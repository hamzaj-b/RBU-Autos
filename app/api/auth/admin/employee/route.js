const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// 🟢 CREATE Employee (Admin only)
async function POST(req) {
  try {
    const body = await req.json();
    const {
      token,
      email,
      password,
      fullName,
      title,
      hourlyRate,
      phone, // ✅ new field
    } = body;

    // 🔐 Verify admin token
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

    // 🧩 Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        isActive: true,
      },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // 🔑 Encrypt password
    const encrypted = encryptPassword(password);

    // 🧱 Step 1: Create user
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null, // ✅ Added
        passwordEncrypted: encrypted,
        userType: "EMPLOYEE",
      },
    });

    // 🧱 Step 2: Create employee profile linked to userId
    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        fullName,
        title,
        hourlyRate,
      },
    });

    // 🧱 Step 3: Link profile to user
    await prisma.user.update({
      where: { id: user.id },
      data: { employeeProfileId: profile.id },
    });

    return NextResponse.json({
      message: "✅ Employee created successfully",
      user,
      profile,
    });
  } catch (err) {
    console.error("❌ Employee creation error:", err);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}

// 🟢 GET Employees (Admin + Employee Self)
async function GET(req) {
  try {
    // 🔐 Authenticate
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

    // 👷 EMPLOYEE → fetch self
    if (decoded.userType === "EMPLOYEE") {
      if (!decoded.employeeId)
        return NextResponse.json(
          { error: "Employee ID missing in token" },
          { status: 403 }
        );

      const employee = await prisma.employeeProfile.findUnique({
        where: { id: decoded.employeeId },
        include: {
          User: {
            select: {
              email: true,
              phone: true,
              isActive: true,
              createdAt: true,
            },
          },
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
        },
      });

      if (!employee)
        return NextResponse.json(
          { error: "Employee profile not found" },
          { status: 404 }
        );

      // 🕒 Calculate total logged time (exclude active sessions)
      const totalMs = employee.Sessions.reduce((sum, s) => {
        if (!s.loginAt || !s.logoutAt) return sum; // skip active
        const diff = new Date(s.logoutAt) - new Date(s.loginAt);
        return sum + Math.max(diff, 0);
      }, 0);

      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHoursDecimal = +(totalMs / (1000 * 60 * 60)).toFixed(2);
      const totalLoggedTime = `${hours}h ${minutes}m`;

      // Find current active session if any
      const activeSession = employee.Sessions.find((s) => !s.logoutAt) || null;
      let activeDuration = null;
      if (activeSession?.loginAt) {
        const diffMs = new Date() - new Date(activeSession.loginAt);
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        activeDuration = `${h}h ${m}m`;
      }

      return NextResponse.json({
        employee: {
          ...employee,
          totalLoggedHours: totalHoursDecimal,
          totalLoggedTime,
          activeSession: activeSession
            ? {
                id: activeSession.id,
                loginAt: activeSession.loginAt,
                activeFor: activeDuration,
              }
            : null,
        },
        message: "Employee profile fetched successfully",
      });
    }

    // 👑 ADMIN → list all employees
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Access denied. Only Admin or Employee allowed." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { title: { contains: search, mode: "insensitive" } },
            {
              User: {
                some: {
                  OR: [
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search, mode: "insensitive" } }, // ✅ Search by phone too
                  ],
                },
              },
            },
          ],
        }
      : {};

    // ⚡ Fetch employees with sessions
    const [employees, total] = await Promise.all([
      prisma.employeeProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          Sessions: {
            select: { id: true, loginAt: true, logoutAt: true },
          },
          User: {
            select: {
              email: true,
              isActive: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        orderBy: { [sortBy]: order },
      }),
      prisma.employeeProfile.count({ where }),
    ]);

    // 🕒 Compute total hours for each employee
    const enriched = employees.map((emp) => {
      const totalMs = emp.Sessions.reduce((sum, s) => {
        if (!s.loginAt || !s.logoutAt) return sum; // skip active
        const diff = new Date(s.logoutAt) - new Date(s.loginAt);
        return sum + Math.max(diff, 0);
      }, 0);

      const hours = Math.floor(totalMs / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const totalHoursDecimal = +(totalMs / (1000 * 60 * 60)).toFixed(2);
      const totalLoggedTime = `${hours}h ${minutes}m`;

      return {
        ...emp,
        totalLoggedHours: totalHoursDecimal,
        totalLoggedTime,
      };
    });

    return NextResponse.json({
      employees: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ GET employees error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
