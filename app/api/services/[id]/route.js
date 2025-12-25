const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Update Service (Admin only)
async function PUT(req, { params }) {
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

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can update services" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      category,
      description,
      durationMinutes,
      basePrice,
      isActive,
    } = body;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        name,
        category,
        description,
        durationMinutes,
        basePrice,
        isActive,
      },
    });

    return NextResponse.json({ message: "Service updated", service: updated });
  } catch (err) {
    console.error("PUT /api/services/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

// ✅ Soft Delete Service (Admin only)
async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // 🧩 1️⃣ Auth check
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
        { error: "Only Admin can delete services" },
        { status: 403 }
      );
    }

    // 🗑️ 2️⃣ Delete the record permanently
    const deletedService = await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      message: `Service '${deletedService.name}' deleted successfully.`,
      service: deletedService,
    });
  } catch (err) {
    console.error("DELETE /api/services/[id] error:", err);

    // Prisma-specific error handling (e.g., not found)
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}

module.exports = { PUT, DELETE };
