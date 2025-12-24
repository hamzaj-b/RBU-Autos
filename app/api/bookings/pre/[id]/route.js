import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";
import { pusherServer } from "@/lib/pusher"; // ✅ add this

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function PATCH(req, { params }) {
  try {
    // 🔐 Auth (Admin only)
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

    const { id } = await params;
    const body = await req.json();
    const { action, employeeId, notes } = body;

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be APPROVE or REJECT." },
        { status: 400 }
      );
    }

    // 🔍 Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingServices: { include: { service: true } },
      },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (booking.bookingType !== "PREBOOKING")
      return NextResponse.json(
        { error: "This is not a pre-booking" },
        { status: 400 }
      );

    if (booking.status !== BookingStatus.PENDING)
      return NextResponse.json(
        { error: `Booking already ${booking.status.toLowerCase()}` },
        { status: 400 }
      );

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

      // 🔔 Notify the respective customer
      try {
        await pusherServer.trigger(
          `customer-${booking.customerId}`,
          "booking-status",
          {
            type: "REJECTED",
            message: "❌ Your pre-booking has been rejected by the admin.",
            bookingId: booking.id,
            notes: updated.notes,
          }
        );
        // console.log(
        //   `📢 Notified customer-${booking.customerId} of booking rejection`
        // );

        // 💾 🆕 STORE NOTIFICATION
        await prisma.notification.create({
          data: {
            userId: booking.customerId,
            title: "Booking Rejected",
            message: "Your pre-booking has been rejected by the admin.",
            type: "BOOKING_REJECTED",
            metadata: {
              bookingId: booking.id,
              notes: updated.notes,
            },
          },
        });
        // console.log("🗂️ Notification stored for rejected booking.");
      } catch (err) {
        console.error("⚠️ Pusher customer rejection notify failed:", err);
      }

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

      // 💰 Calculate base revenue
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

          const newWorkOrder = await tx.workOrder.create({
            data: {
              bookingId: booking.id,
              customerId: booking.customerId,
              employeeId,
              status: WorkOrderStatus.ASSIGNED,
              totalRevenue,
            },
          });

          await tx.workOrderService.createMany({
            data: booking.bookingServices.map((s) => ({
              workOrderId: newWorkOrder.id,
              serviceId: s.serviceId,
            })),
          });

          return [updatedBooking, newWorkOrder];
        }
      );

      // ✅ Fetch employee name & service names for notification
      const employee = await prisma.employeeProfile.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      const bookingWithServices = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          bookingServices: {
            include: { service: { select: { name: true } } },
          },
        },
      });

      const serviceNames =
        bookingWithServices.bookingServices.map((bs) => bs.service.name) || [];

      // ✅ Trigger Pusher notification for customer
      try {
        await pusherServer.trigger(
          `customer-${booking.customerId}`,
          "booking-status",
          {
            type: "APPROVED",
            message: "✅ Your pre-booking has been approved and assigned.",
            employeeName: employee?.fullName || "Assigned Staff",
            services: serviceNames,
            startAt: booking.startAt,
          }
        );

        // console.log(
        //   `📢 Notified customer-${
        //     booking.customerId
        //   } of booking approval (employee: ${
        //     employee?.fullName
        //   }, services: ${serviceNames.join(", ")})`
        // );

        // 💾 🆕 STORE NOTIFICATION
        // 🔍 Find the actual user linked to this customer profile
        const customerUser = await prisma.user.findFirst({
          where: { customerProfileId: booking.customerId },
          select: { id: true },
        });

        // 💾 🆕 Store notification only if that user exists
        if (customerUser) {
          await prisma.notification.create({
            data: {
              userId: customerUser.id, // ✅ Correctly linked to User.id
              title: "Booking Approved",
              message: `Your booking has been approved and assigned to ${
                employee?.fullName || "an employee"
              }. Services: ${serviceNames.join(", ")}.`,
              type: "BOOKING_APPROVED",
              metadata: {
                bookingId: booking.id,
                employeeId,
                services: serviceNames,
                startAt: booking.startAt,
              },
            },
          });

          // console.log(`✅ Notification stored for user ${customerUser.id}`);
        } else {
          console.warn(
            `⚠️ No matching User found for CustomerProfile ID ${booking.customerId}`
          );
        }

        // console.log("🗂️ Notification stored for approved booking.");
      } catch (err) {
        console.error("⚠️ Pusher trigger failed:", err);
      }

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
