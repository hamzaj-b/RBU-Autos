// app/api/customers/route.js
const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Create new customer (without sending password email)
async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can create customers" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, fullName, addressJson, vehicleJson, notes } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email and fullName are required" },
        { status: 400 }
      );
    }

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Create user & customer profile
    const user = await prisma.user.create({
      data: {
        email,
        userType: "CUSTOMER",
        passwordEncrypted: null,
        isActive: true,
      },
    });

    const profile = await prisma.customerProfile.create({
      data: {
        userId: user.id,
        fullName,
        addressJson: addressJson || {},
        vehicleJson: vehicleJson || {},
        notes: notes || null,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { customerProfileId: profile.id },
    });

    return NextResponse.json({
      message: "Customer created successfully",
      user,
      profile,
    });
  } catch (err) {
    console.error("Create customer error:", err);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

// ✅ Fetch all customers
async function GET(req) {
  try {
    const {
      search,
      page = 1,
      limit = 10,
    } = Object.fromEntries(req.nextUrl.searchParams);

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            {
              User: {
                some: { email: { contains: search, mode: "insensitive" } },
              },
            },
          ],
        }
      : {};

    const skip = (page - 1) * limit;
    const total = await prisma.customerProfile.count({ where });

    const customers = await prisma.customerProfile.findMany({
      where,
      include: { User: true },
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      customers,
    });
  } catch (err) {
    console.error("Fetch customers error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
