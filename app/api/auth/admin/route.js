const { NextResponse } = require("next/server");
const { PrismaClient, UserType } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { encryptPassword } = require("@/lib/encryption");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Get all admins
async function GET(req) {
  try {
    const admins = await prisma.user.findMany({
      where: { userType: UserType.ADMIN },
      select: {
        id: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ admins });
  } catch (err) {
    console.error("Fetch admins error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admins" },
      { status: 500 }
    );
  }
}

// ✅ Create new admin
async function POST(req) {
  try {
    const body = await req.json();
    const { email, phone, password } = body;

    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );

    const passwordEncrypted = encryptPassword(password);

    const admin = await prisma.user.create({
      data: {
        email,
        phone,
        passwordEncrypted,
        userType: UserType.ADMIN,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        userType: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Admin created successfully", admin },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create admin error:", err);
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Email or phone already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

module.exports = { GET, POST };
