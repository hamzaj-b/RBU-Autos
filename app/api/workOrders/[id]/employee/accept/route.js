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
    // 🔑 1️⃣ Auth check
    // -------------------------
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

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can accept work orders" },
        { status: 403 }
      );
    }

    const { id: workOrderId } = await params;

    if (!decoded.employeeId) {
      return NextResponse.json(
        { error: "Employee profile not linked to token" },
        { status: 403 }
      );
    }

    // -------------------------
    // 🔍 2️⃣ Find WorkOrder + Booking
    // -------------------------
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        booking: {
          include: {
            bookingServices: { include: { service: true } },
            customer: true,
          },
        },
        workOrderServices: { include: { service: true } },
        employee: true,
        customer: true,
      },
    });

    if (!workOrder)
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );

    if (workOrder.status !== WorkOrderStatus.OPEN) {
      return NextResponse.json(
        { error: `WorkOrder is not open (current: ${workOrder.status})` },
        { status: 400 }
      );
    }

    const booking = workOrder.booking;
    if (!booking)
      return NextResponse.json(
        { error: "Linked booking not found" },
        { status: 500 }
      );

    // -------------------------
    // ⏰ 3️⃣ Employee availability check
    // -------------------------
    const conflict = await prisma.workOrder.findFirst({
      where: {
        employeeId: decoded.employeeId,
        status: { in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS] },
        booking: {
          startAt: { lt: booking.endAt },
          endAt: { gt: booking.startAt },
        },
      },
      include: { booking: true },
    });

    if (conflict) {
      return NextResponse.json(
        {
          error: "You already have a job in this time slot",
          conflict: {
            id: conflict.id,
            startAt: conflict.booking.startAt,
            endAt: conflict.booking.endAt,
            services: conflict.booking?.bookingServices?.map(
              (bs) => bs.service.name
            ),
          },
        },
        { status: 400 }
      );
    }

    // -------------------------
    // 💾 4️⃣ Accept job (transactional)
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            employeeId: decoded.employeeId,
            status: WorkOrderStatus.ASSIGNED,
            openedAt: new Date(),
          },
          include: {
            booking: {
              include: {
                bookingServices: { include: { service: true } },
                customer: true,
              },
            },
            workOrderServices: { include: { service: true } },
            employee: true,
            customer: true,
          },
        });

        const bk = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.ACCEPTED,
            acceptedAt: new Date(),
          },
        });

        return [wo, bk];
      }
    );

    // -------------------------
    // ✅ 5️⃣ Success response
    // -------------------------
    return NextResponse.json(
      {
        message: "Work order accepted successfully",
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Employee accept work order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to accept work order" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
