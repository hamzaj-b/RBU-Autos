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

    const { id: workOrderId } = await params;
    if (!workOrderId) {
      return NextResponse.json(
        { error: "WorkOrder ID required" },
        { status: 400 }
      );
    }

    // -------------------------
    // 🧾 2. Parse optional note
    // -------------------------
    const body = await req.json().catch(() => ({}));
    const note = body?.note?.trim?.() || "";

    // -------------------------
    // 🔍 3. Load WorkOrder
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

    if (
      [WorkOrderStatus.CANCELLED, WorkOrderStatus.COMPLETED].includes(
        workOrder.status
      )
    ) {
      return NextResponse.json(
        { error: `WorkOrder already ${workOrder.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    // -------------------------
    // ⚖️ 4. Permission checks
    // -------------------------
    const isAdmin = decoded.userType === "ADMIN";
    const isEmployee = decoded.userType === "EMPLOYEE";

    if (!isAdmin && !isEmployee) {
      return NextResponse.json(
        { error: "Only Admin or Employee can mark work orders as done" },
        { status: 403 }
      );
    }

    if (isEmployee && workOrder.employeeId !== decoded.employeeId) {
      return NextResponse.json(
        { error: "You are not authorized to mark this work order as done" },
        { status: 403 }
      );
    }

    // -------------------------
    // 💾 5. Mark as DONE + update booking
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const updatedWO = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.DONE,
            closedAt: new Date(),
            notes:
              note.length > 0
                ? `${workOrder.notes || ""}${workOrder.notes ? "\n" : ""}${
                    isAdmin ? "[ADMIN-DONE]" : "[EMPLOYEE-DONE]"
                  } ${note}`
                : workOrder.notes ||
                  `[SYSTEM] Marked as DONE by ${
                    isAdmin ? "Admin" : "Employee"
                  }`,
          },
        });

        const updatedBk = await tx.booking.update({
          where: { id: workOrder.bookingId },
          data: {
            status: BookingStatus.DONE,
            completedAt: new Date(),
          },
        });

        return [updatedWO, updatedBk];
      }
    );

    // -------------------------
    // ✅ 6. Success Response
    // -------------------------
    const msg = isAdmin
      ? "Work order marked as DONE by Admin."
      : "Work order marked as DONE by Employee.";

    return NextResponse.json(
      {
        message: msg,
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Mark as DONE Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to mark work order as done" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
