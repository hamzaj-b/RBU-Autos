import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function PATCH(req, { params }) {
  try {
    // 🔑 Auth check (Admin only)
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

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admin can approve or reject pre-bookings" },
        { status: 403 }
      );
    }

    // Parse booking id and body
    const { id } = params;
    const body = await req.json();
    const { action, employeeId, notes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { bookingServices: true },
    });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.bookingType !== "PREBOOKING") {
      return NextResponse.json(
        { error: "This is not a pre-booking" },
        { status: 400 }
      );
    }

    // 🚫 Already processed
    if (booking.status !== BookingStatus.PENDING) {
      return NextResponse.json(
        { error: `Booking already ${booking.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // ❌ REJECT
    if (action === "REJECT") {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          notes: notes || booking.notes,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(
        { message: "Pre-booking rejected successfully.", booking: updated },
        { status: 200 }
      );
    }

    // ✅ APPROVE
    if (action === "APPROVE") {
      if (!employeeId) {
        return NextResponse.json(
          { error: "Employee ID required for approval" },
          { status: 400 }
        );
      }

      // Check if employee is available for that time
      const overlap = await prisma.workOrder.findFirst({
        where: {
          employeeId,
          status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING"] },
          booking: {
            startAt: { lt: booking.endAt },
            endAt: { gt: booking.startAt },
          },
        },
      });

      if (overlap) {
        return NextResponse.json(
          {
            error: "Selected employee is already booked in this time slot.",
            conflictBookingId: overlap.bookingId,
          },
          { status: 409 }
        );
      }

      // Transaction: Update booking + create work order
      const [updatedBooking, workOrder] = await prisma.$transaction(
        async (tx) => {
          const updatedBooking = await tx.booking.update({
            where: { id },
            data: {
              status: BookingStatus.ACCEPTED,
              acceptedAt: new Date(),
              notes: notes || booking.notes,
            },
          });

          const newWorkOrder = await tx.workOrder.create({
            data: {
              bookingId: booking.id,
              customerId: booking.customerId,
              employeeId,
              status: WorkOrderStatus.ASSIGNED,
            },
          });

          // Link services
          await tx.workOrderService.createMany({
            data: booking.bookingServices.map((s) => ({
              workOrderId: newWorkOrder.id,
              serviceId: s.serviceId,
            })),
          });

          return [updatedBooking, newWorkOrder];
        }
      );

      return NextResponse.json(
        {
          message: "Pre-booking approved and assigned successfully.",
          booking: updatedBooking,
          workOrder,
        },
        { status: 200 }
      );
    }
  } catch (err) {
    console.error("❌ Pre-booking approval error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process pre-booking" },
      { status: 500 }
    );
  }
}
