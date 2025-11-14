const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// Allowed statuses for reassignment
const VALID_REASSIGN_STATUSES = [
  WorkOrderStatus.DRAFT,
  WorkOrderStatus.OPEN,
  WorkOrderStatus.ASSIGNED,
  WorkOrderStatus.WAITING,
];

async function PATCH(req, { params }) {
  try {
    // -------------------------
    // 🔐 1. ADMIN Auth
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

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -------------------------
    // 🆔 2. WorkOrder ID & employeeId
    // -------------------------
    const { id: workOrderId } = params;
    const body = await req.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId is required" },
        { status: 400 }
      );
    }

    // -------------------------
    // 🔍 3. Load workOrder + booking
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
    // ⛔ 4. Check if reassignment allowed
    // -------------------------
    if (!VALID_REASSIGN_STATUSES.includes(workOrder.status)) {
      return NextResponse.json(
        {
          error: `Cannot reassign employee when WorkOrder is in status: ${workOrder.status}`,
        },
        { status: 400 }
      );
    }

    // -------------------------
    // ⚠️ 5. Employee availability check
    // -------------------------
    const overlap = await prisma.workOrder.findFirst({
      where: {
        employeeId,
        id: { not: workOrderId },
        status: {
          in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS],
        },
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
    // 💾 6. Reassign Employee (ONLY this)
    // -------------------------
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        employeeId,
        status: WorkOrderStatus.ASSIGNED, // normalize state
      },
      include: { employee: true },
    });

    return NextResponse.json(
      {
        message: "Employee reassigned successfully.",
        workOrder: updatedWorkOrder,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Reassign employee error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reassign employee" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
