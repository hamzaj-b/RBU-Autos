const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

/**
 * ✅ PATCH /api/services/status
 * Toggle active/inactive status of a service.
 * Admin-only route.
 * Payload: { id: string, isActive: boolean }
 */
async function PATCH(req) {
  try {
    // 🔐 Auth validation
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
        { error: "Only Admin can change service status" },
        { status: 403 }
      );
    }

    // 📦 Extract body
    const { id, isActive } = await req.json();

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Missing or invalid parameters" },
        { status: 400 }
      );
    }

    // 🧠 Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      message: `Service ${isActive ? "activated" : "deactivated"} successfully`,
      service: updatedService,
    });
  } catch (err) {
    console.error("PATCH /api/services/status error:", err);
    return NextResponse.json(
      { error: "Failed to update service status" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
