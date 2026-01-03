const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PATCH(req, { params }) {
  try {
    const { id } = await params;

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

    // ✅ Only Admin can change status
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can update user status" },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    let newStatus;

    if (typeof body.isActive === "boolean") {
      // Explicit status passed by admin
      newStatus = body.isActive;
    } else {
      // No body provided → just toggle
      newStatus = !user.isActive;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: newStatus },
    });

    return NextResponse.json({
      message: `User is now ${updatedUser.isActive ? "Active" : "Inactive"}`,
      user: updatedUser,
    });
  } catch (err) {
    console.error("PATCH /api/auth/user/[id]/status error:", err);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
