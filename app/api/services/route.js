const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Create Service (Admin only)
async function POST(req) {
  try {
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
        { error: "Only Admin can create services" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, category, description, durationMinutes, basePrice } = body;

    const service = await prisma.service.create({
      data: { name, category, description, durationMinutes, basePrice },
    });

    return NextResponse.json({
      message: "Service created successfully",
      service,
    });
  } catch (err) {
    console.error("POST /api/services error:", err);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

// ✅ List Services (all roles can view)
async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || "all"; // 👈 NEW filter

    // Build dynamic filter
    const where = {
      ...(status !== "all" && { isActive: status === "active" }),
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ],
    };

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
      }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json({
      data: services,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("GET /api/services error:", err);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
