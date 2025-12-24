const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { encryptPassword } = require("@/lib/encryption");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
      if (decoded.purpose !== "SET_PASSWORD") {
        return NextResponse.json(
          { error: "Invalid token purpose" },
          { status: 400 }
        );
      }
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const encrypted = encryptPassword(newPassword);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordEncrypted: encrypted },
    });

    return NextResponse.json({ message: "Password set successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to set password" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
