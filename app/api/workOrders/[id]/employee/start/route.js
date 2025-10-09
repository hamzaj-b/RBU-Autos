const { NextResponse } = require("next/server");
const {
  PrismaClient,
  WorkOrderStatus,
  BookingStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PATCH(req, { params }) {
  try {
    // -------------------------
    // 🔑 1. Verify JWT Token
    // -------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Employee-only access
    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can start work orders" },
        { status: 403 }
      );
    }

    // -------------------------
    // 🆔 2. Params
    // -------------------------
    const { id: workOrderId } = await params;
    if (!workOrderId) {
      return NextResponse.json(
        { error: "WorkOrder ID is required" },
        { status: 400 }
      );
    }

    // -------------------------
    // 🔍 3. Load WorkOrder + Booking
    // -------------------------
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { booking: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );
    }

    // Ensure it’s their own
    if (workOrder.employeeId !== decoded.employeeId) {
      return NextResponse.json(
        { error: "You are not assigned to this work order" },
        { status: 403 }
      );
    }

    // Must be ASSIGNED to start
    if (workOrder.status !== WorkOrderStatus.ASSIGNED) {
      return NextResponse.json(
        {
          error: `Cannot start work. Current status: ${workOrder.status}`,
        },
        { status: 409 }
      );
    }

    // -------------------------
    // 💾 4. Mark WorkOrder as IN_PROGRESS
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.IN_PROGRESS,
            openedAt: new Date(),
          },
        });

        const bk = await tx.booking.update({
          where: { id: workOrder.bookingId },
          data: {
            status: BookingStatus.ACCEPTED, // keep accepted or use IN_PROGRESS if you prefer
            startedAt: new Date(),
          },
        });

        return [wo, bk];
      }
    );

    // -------------------------
    // ✅ 5. Success Response
    // -------------------------
    return NextResponse.json(
      {
        message: "Work started successfully.",
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Start work order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to start work order" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
