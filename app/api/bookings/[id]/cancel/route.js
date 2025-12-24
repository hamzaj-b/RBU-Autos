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
    // 🆔 2. Get Booking ID and optional reason
    // -------------------------
    const { id: bookingId } = await params;
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 }
      );
    }

    let reason = "";
    try {
      const body = await req.json().catch(() => null);
      reason = body?.reason?.toString()?.trim() || "";
    } catch {
      // ignore JSON parse errors
    }

    // -------------------------
    // 🔍 3. Fetch Booking + WorkOrder
    // -------------------------
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { workOrder: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 409 }
      );
    }

    // Protect Completed WorkOrders
    if (booking.workOrder?.status === WorkOrderStatus.DONE) {
      return NextResponse.json(
        {
          error:
            "Work order is already completed. Cancellation is not allowed.",
        },
        { status: 409 }
      );
    }

    // -------------------------
    // 💾 4. Cancel Booking + WorkOrder (Atomic)
    // -------------------------
    const [updatedBooking, updatedWorkOrder] = await prisma.$transaction(
      async (tx) => {
        let updatedWO = null;

        // Cancel work order first (if exists)
        if (booking.workOrder) {
          updatedWO = await tx.workOrder.update({
            where: { id: booking.workOrder.id },
            data: {
              status: WorkOrderStatus.CANCELLED,
              closedAt: new Date(),
            },
          });
        }

        // Append reason to booking notes
        const newNotes =
          reason?.length > 0
            ? `${booking.notes || ""}${
                booking.notes ? "\n" : ""
              }[CANCELLED] ${reason}`
            : booking.notes;

        const updatedBk = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CANCELLED,
            notes: newNotes,
          },
        });

        return [updatedBk, updatedWO];
      }
    );

    // -------------------------
    // ✅ 5. Return Success
    // -------------------------
    return NextResponse.json(
      {
        message: "Booking cancelled successfully.",
        booking: updatedBooking,
        workOrder: updatedWorkOrder,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

module.exports = { PATCH };
