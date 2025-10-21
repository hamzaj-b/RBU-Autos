import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function PATCH(req, { params }) {
  try {
    // 🔑 Auth (Admin only)
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

    // Fetch booking (with services)
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingServices: { include: { service: true } },
      },
    });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

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

      // Check employee availability
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

      // 💰 Calculate base revenue from selected services
      const totalRevenue = booking.bookingServices.reduce(
        (sum, bs) => sum + (bs.service?.basePrice || 0),
        0
      );

      // 🔁 Transaction: approve + create work order
      const [updatedBooking, newWorkOrder] = await prisma.$transaction(
        async (tx) => {
          const updatedBooking = await tx.booking.update({
            where: { id },
            data: {
              status: BookingStatus.ACCEPTED,
              acceptedAt: new Date(),
              notes: notes || booking.notes,
            },
          });

          // Create WorkOrder with base revenue
          const newWorkOrder = await tx.workOrder.create({
            data: {
              bookingId: booking.id,
              customerId: booking.customerId,
              employeeId,
              status: WorkOrderStatus.ASSIGNED,
              totalRevenue, // 💰 initial service revenue stored here
            },
          });

          // Link workOrder → services
          await tx.workOrderService.createMany({
            data: booking.bookingServices.map((s) => ({
              workOrderId: newWorkOrder.id,
              serviceId: s.serviceId,
            })),
          });

          return [updatedBooking, newWorkOrder];
        }
      );

      // ✅ Response
      return NextResponse.json(
        {
          message: "Pre-booking approved and assigned successfully.",
          booking: updatedBooking,
          workOrder: newWorkOrder,
          totalRevenue,
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
