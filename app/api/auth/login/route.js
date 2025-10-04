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

    const decrypted = decryptPassword(user.passwordEncrypted);
    if (decrypted !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ Build token payload
    const tokenPayload = {
      id: user.id,
      email: user.email,
      userType: user.userType,
    };

    if (user.userType === "EMPLOYEE" && user.employeeProfileId) {
      tokenPayload.employeeId = user.employeeProfileId;
    }
    if (user.userType === "CUSTOMER" && user.customerProfileId) {
      tokenPayload.customerId = user.customerProfileId;
    }

    // ✅ Generate token
    const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "24h" });

    // ✅ If Employee → log session with backend-detected data
    if (user.userType === "EMPLOYEE") {
      const ip =
        req.headers.get("x-forwarded-for") ||
        req.headers.get("x-real-ip") ||
        "unknown";

      const userAgent = req.headers.get("user-agent") || "unknown";

      // 🔹 Detect platform (simple parse)
      let source = "web";
      if (/mobile/i.test(userAgent)) source = "mobile";
      else if (/postman/i.test(userAgent)) source = "postman";

      const location = ip !== "unknown" ? `IP:${ip}` : null;

      await prisma.employeeSession.create({
        data: {
          userId: user.id,
          employeeId: user.employeeProfileId || null,
          loginAt: new Date(),
          source,
          location,
        },
      });
    }

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        employeeId: user.employeeProfileId || null,
        customerId: user.customerProfileId || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}

module.exports = { POST };
