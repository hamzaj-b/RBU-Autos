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

    // 🔍 1. Find user + related profiles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
        customer: true,
      },
    });

    if (!user || !user.passwordEncrypted) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🔐 2. Verify password
    const decrypted = decryptPassword(user.passwordEncrypted);
    if (decrypted !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 🧱 3. Build token payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
    };

    // 👤 Get fullName from the correct profile
    let username = "Admin";
    if (user.userType === "EMPLOYEE" && user.employeeProfileId) {
      tokenPayload.employeeId = user.employeeProfileId;
      username = user.employee?.fullName || username;
    }
    if (user.userType === "CUSTOMER" && user.customerProfileId) {
      tokenPayload.customerId = user.customerProfileId;
      username = user.customer?.fullName || username;
    }

    // 🪙 4. Generate token
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "24h" });

    // ✅ 5. Return token + user info
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        employeeId: user.employeeProfileId || null,
        customerId: user.customerProfileId || null,
        username, // 👈 added fullName here
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

module.exports = { POST };
