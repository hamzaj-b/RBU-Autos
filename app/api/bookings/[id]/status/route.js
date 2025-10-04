const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    let decoded = jwt.verify(token, SECRET_KEY);

    const body = await req.json();
    const { status } = body;

    const allowedStatuses = [
      "CONFIRMED",
      "CANCELLED",
      "IN_PROGRESS",
      "COMPLETED",
    ];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Rules: Admin controls CONFIRM/CANCEL, Employee controls IN_PROGRESS/COMPLETED
    if (
      ["CONFIRMED", "CANCELLED"].includes(status) &&
      decoded.userType !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Only Admin can confirm/cancel" },
        { status: 403 }
      );
    }
    if (
      ["IN_PROGRESS", "COMPLETED"].includes(status) &&
      decoded.userType !== "EMPLOYEE"
    ) {
      return NextResponse.json(
        { error: "Only Employee can progress work orders" },
        { status: 403 }
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      message: `Booking marked as ${status}`,
      booking,
    });
  } catch (err) {
    console.error("PATCH /api/bookings/[id]/status error:", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
