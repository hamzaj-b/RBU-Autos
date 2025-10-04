const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function PUT(req, { params }) {
  try {
    // 🔑 Auth check
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid/expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can accept workOrders" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!decoded.employeeId) {
      return NextResponse.json(
        { error: "No employee profile linked to this token" },
        { status: 403 }
      );
    }

    // 🔎 Find WorkOrder (with booking times)
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { booking: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "WorkOrder not found" },
        { status: 404 }
      );
    }

    if (workOrder.status !== WorkOrderStatus.OPEN) {
      return NextResponse.json(
        { error: "WorkOrder not open" },
        { status: 400 }
      );
    }

    const booking = workOrder.booking;
    if (!booking) {
      return NextResponse.json(
        { error: "Associated booking not found" },
        { status: 500 }
      );
    }

    // 🚦 Check if employee already has a job in this slot
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
            service: conflict.booking.serviceId,
          },
        },
        { status: 400 }
      );
    }

    // ✍️ Assign to employee
    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: {
        employeeId: decoded.employeeId,
        status: WorkOrderStatus.ASSIGNED,
        openedAt: new Date(),
      },
      include: {
        booking: { include: { service: true, customer: true } },
        employee: true,
      },
    });

    return NextResponse.json({
      message: "WorkOrder accepted successfully",
      workOrder: updatedWO,
    });
  } catch (err) {
    console.error("Accept WO error:", err);
    return NextResponse.json(
      { error: "Failed to accept workOrder" },
      { status: 500 }
    );
  }
}

module.exports = { PUT };
