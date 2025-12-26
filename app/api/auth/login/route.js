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

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 🔍 Find user by email (NOT unique → use findFirst)
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        employee: true,
        customer: true,
      },
    });

    // ❌ If no user or no password
    if (!user || !user.passwordEncrypted) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🚫 Restrict customer accounts
    if (user.userType === "CUSTOMER") {
      return NextResponse.json(
        { error: "Please login via Customer Login (Phone OTP)" },
        { status: 403 }
      );
    }

    // ✅ Allow only ADMIN or EMPLOYEE
    if (!["ADMIN", "EMPLOYEE"].includes(user.userType)) {
      return NextResponse.json(
        { error: "Unauthorized user type" },
        { status: 403 }
      );
    }

    // 🔐 Verify password
    const decrypted = decryptPassword(user.passwordEncrypted);
    if (decrypted !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🧱 Build token payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
    };

    let username = "Admin";
    if (user.userType === "EMPLOYEE" && user.employeeProfileId) {
      tokenPayload.employeeId = user.employeeProfileId;
      username = user.employee?.fullName || username;
    }

    // 🪙 Generate JWT
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "24h" });

    // ✅ Return token + user info
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        employeeId: user.employeeProfileId || null,
        username,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

module.exports = { POST };
