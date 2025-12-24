const { NextResponse } = require("next/server");
const {
  PrismaClient,
  BookingStatus,
  WorkOrderStatus,
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
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Must be Admin
    if (decoded.userType !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // -------------------------
    // 🆔 2. Get WorkOrder ID + optional reason
    // -------------------------
    const { id: workOrderId } = await params;
    if (!workOrderId) {
      return NextResponse.json(
        { error: "WorkOrder ID is required" },
        { status: 400 }
      );
    }

    let reason = "";
    try {
      const body = await req.json().catch(() => null);
      reason = body?.reason?.toString()?.trim() || "";
    } catch {
      // ignore parse errors
    }

    // -------------------------
    // 🔍 3. Fetch WorkOrder + Booking
    // -------------------------
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { booking: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { error: "Work order not found" },
        { status: 404 }
      );
    }

    // Prevent double-cancellation
    if (workOrder.status === WorkOrderStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Work order already cancelled" },
        { status: 409 }
      );
    }

    // Prevent cancelling completed work
    if (workOrder.status === WorkOrderStatus.DONE) {
      return NextResponse.json(
        { error: "Completed work order cannot be cancelled" },
        { status: 409 }
      );
    }

    // -------------------------
    // 💾 4. Cancel WorkOrder + its linked Booking (Atomic)
    // -------------------------
    const [updatedWorkOrder, updatedBooking] = await prisma.$transaction(
      async (tx) => {
        // Cancel WorkOrder first
        const updatedWO = await tx.workOrder.update({
          where: { id: workOrder.id },
          data: {
            status: WorkOrderStatus.CANCELLED,
            closedAt: new Date(),
          },
        });

        // Cancel associated Booking (if exists)
        let updatedBk = null;
        if (workOrder.booking) {
          const newNotes =
            reason?.length > 0
              ? `${workOrder.booking.notes || ""}${
                  workOrder.booking.notes ? "\n" : ""
                }[CANCELLED] ${reason}`
              : workOrder.booking.notes;

          updatedBk = await tx.booking.update({
            where: { id: workOrder.booking.id },
            data: {
              status: BookingStatus.CANCELLED,
              notes: newNotes,
            },
          });
        }

        return [updatedWO, updatedBk];
      }
    );

    // -------------------------
    // ✅ 5. Success Response
    // -------------------------
    return NextResponse.json(
      {
        message: "Work order cancelled successfully.",
        workOrder: updatedWorkOrder,
        booking: updatedBooking,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cancel work order error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel work order" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
