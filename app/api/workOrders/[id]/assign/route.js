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
    // 🔑 1. Verify Admin JWT
    // -------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -------------------------
    // 🆔 2. Get WorkOrder ID & target employee
    // -------------------------
    const { id: workOrderId } = await params;
    const body = await req.json();
    const { employeeId } = body || {};

    if (!workOrderId || !employeeId) {
      return NextResponse.json(
        { error: "workOrderId and employeeId are required" },
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

    // -------------------------
    // 🧠 4. Check employee availability
    // -------------------------
    const overlap = await prisma.workOrder.findFirst({
      where: {
        employeeId,
        id: { not: workOrderId },
        status: { in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS] },
        booking: {
          startAt: { lt: workOrder.booking.endAt },
          endAt: { gt: workOrder.booking.startAt },
        },
      },
    });

    if (overlap) {
      return NextResponse.json(
        {
          error: "Selected employee already has a job in this time slot.",
          conflictBookingId: overlap.bookingId,
        },
        { status: 409 }
      );
    }

    // -------------------------
    // 💾 5. Transaction: assign employee + update booking
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            employeeId,
            status: WorkOrderStatus.ASSIGNED,
          },
        });

        const bk = await tx.booking.update({
          where: { id: workOrder.bookingId },
          data: {
            status: BookingStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });

        return [wo, bk];
      }
    );

    // -------------------------
    // ✅ 6. Return Success
    // -------------------------
    return NextResponse.json(
      {
        message: "Employee assigned successfully.",
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Assign employee error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to assign employee" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
