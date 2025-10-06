const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

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

    const { id, userType, employeeId } = decoded;

    if (userType === "EMPLOYEE" && employeeId) {
      // Find latest active session
      const session = await prisma.employeeSession.findFirst({
        where: { employeeId, logoutAt: null },
        orderBy: { loginAt: "desc" },
      });

      if (session) {
        const updated = await prisma.employeeSession.update({
          where: { id: session.id },
          data: { logoutAt: new Date() },
        });
        console.log("✅ Logout updated:", updated);
      } else {
        console.log("⚠️ No active session found for this employee");
      }
    }

    return NextResponse.json({
      message: "Logout successful",
      userType,
      logoutAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

module.exports = { POST };
