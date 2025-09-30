const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userType = searchParams.get("userType");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

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
        { error: "Only Admin can view users" },
        { status: 403 }
      );
    }

    const where = {
      isActive: true,
      ...(userType ? { userType: userType.toUpperCase() } : {}),
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        { employee: { fullName: { contains: search, mode: "insensitive" } } },
      ],
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { employee: true, customer: true },
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/auth/user/list error:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
