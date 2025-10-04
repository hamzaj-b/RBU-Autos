const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Verify requester is Admin
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

    // 2. Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // 3. Encrypt password and create Admin
    const encrypted = encryptPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordEncrypted: encrypted,
        userType: "ADMIN",
        isActive: true,
      },
    });

    return NextResponse.json({ message: "Admin created successfully", user });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create admin" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
