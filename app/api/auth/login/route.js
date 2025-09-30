const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { decryptPassword } = require("@/lib/encryption");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordEncrypted) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const decrypted = decryptPassword(user.passwordEncrypted);
    if (decrypted !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, userType: user.userType },
      SECRET_KEY,
      { expiresIn: "2h" }
    );

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, userType: user.userType },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

module.exports = { POST };
