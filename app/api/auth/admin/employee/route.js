const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { token, email, password, fullName, title, hourlyRate } = body;

    // verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.userType !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // check if exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const encrypted = encryptPassword(password);

    // Step 1: create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordEncrypted: encrypted,
        userType: "EMPLOYEE",
      },
    });

    // Step 2: create employee profile linked to userId
    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        fullName,
        title,
        hourlyRate,
      },
    });

    // Step 3: update user to connect employeeProfileId
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeProfileId: profile.id },
    });

    return NextResponse.json({ message: "Employee created", user, profile });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
async function GET(req) {
  try {
    // 🔐 1️⃣ Authenticate Admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can access this resource" },
        { status: 403 }
      );
    }

    // 📄 2️⃣ Handle Search, Pagination, and Sorting
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    // 🧠 3️⃣ Filter + Search Logic
    const where = {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        {
          User: {
            some: {
              email: { contains: search, mode: "insensitive" },
            },
          },
        },
      ],
    };

    // ⚡ 4️⃣ Fetch Data + Count in Parallel
    const [employees, total] = await Promise.all([
      prisma.employeeProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          Sessions: {
            select: {
              id: true,
              loginAt: true,
              logoutAt: true,
              source: true,
              location: true,
            },
            orderBy: { loginAt: "desc" },
          },
          User: {
            select: {
              email: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
      }),
      prisma.employeeProfile.count({ where }),
    ]);

    // 🧾 5️⃣ Response
    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ GET /api/auth/admin/employee error:", err);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
