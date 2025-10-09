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
    // 🧾 2. Parse optional body fields
    // -------------------------
    const body = await req.json().catch(() => ({}));
    const note = body?.note?.trim?.() || "";
    const partsUsed = body?.partsUsed || null;
    const laborEntries = body?.laborEntries || null;
    const photos = body?.photos || null;

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

    if (workOrder.status === WorkOrderStatus.DONE) {
      return NextResponse.json(
        { error: "WorkOrder already marked as completed" },
        { status: 409 }
      );
    }

    if (workOrder.status === WorkOrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Cancelled WorkOrder cannot be completed" },
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
        { error: "Only Admin or Employee can complete work orders" },
        { status: 403 }
      );
    }

    // If employee, ensure it’s their own work order
    if (isEmployee && workOrder.employeeId !== decoded.employeeId) {
      return NextResponse.json(
        { error: "You are not authorized to complete this work order" },
        { status: 403 }
      );
    }

    // -------------------------
    // 💾 5. Transaction: mark done + update booking + add extras
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        const updatedWO = await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: WorkOrderStatus.DONE,
            closedAt: new Date(),
            partsUsed: partsUsed
              ? JSON.stringify(partsUsed)
              : workOrder.partsUsed,
            laborEntries: laborEntries
              ? JSON.stringify(laborEntries)
              : workOrder.laborEntries,
            photos: photos ? JSON.stringify(photos) : workOrder.photos,
            notes:
              note.length > 0
                ? `${workOrder.notes || ""}${workOrder.notes ? "\n" : ""}${
                    isAdmin ? "[ADMIN-DONE]" : "[EMPLOYEE-DONE]"
                  } ${note}`
                : workOrder.notes ||
                  `[SYSTEM] Marked as completed by ${
                    isAdmin ? "Admin" : "Employee"
                  }`,
          },
        });

        const updatedBk = await tx.booking.update({
          where: { id: workOrder.bookingId },
          data: {
            status: BookingStatus.COMPLETED,
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
      ? "Work order completed by Admin successfully."
      : "Work order completed successfully.";

    return NextResponse.json(
      {
        message: msg,
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Complete work order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete work order" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
