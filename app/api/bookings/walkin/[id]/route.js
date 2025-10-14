import { NextResponse } from "next/server";
import { PrismaClient, BookingStatus, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// 🔑 Helper: Auth verification
async function verifyAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) throw new Error("No token provided");

  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    throw new Error("Invalid or expired token");
  }
}

/**
 * 🔵 GET /api/bookings/walkin/[id]
 * Fetch detailed booking info (includes services, workOrder, employee, etc.)
 */
export async function GET(req, { params }) {
  try {
    await verifyAuth(req);
    const { id } = params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        bookingServices: { include: { service: true } },
        workOrder: {
          include: {
            employee: true,
            workOrderServices: { include: { service: true } },
          },
        },
      },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    return NextResponse.json(booking);
  } catch (err) {
    console.error("❌ GET by ID error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

/**
 * 🟡 PUT /api/bookings/walkin/[id]
 * Update general details (e.g., notes, time, services)
 */
export async function PUT(req, { params }) {
  try {
    const decoded = await verifyAuth(req);
    if (decoded.userType !== "ADMIN")
      return NextResponse.json(
        { error: "Only admin can update bookings" },
        { status: 403 }
      );

    const { id } = params;
    const body = await req.json();

    const { notes, startAt, endAt, serviceIds } = body;
    const updateData = {};

    if (notes) updateData.notes = notes;
    if (startAt && endAt) {
      updateData.startAt = new Date(startAt);
      updateData.endAt = new Date(endAt);
      updateData.slotMinutes = Math.round(
        (new Date(endAt) - new Date(startAt)) / 60000
      );
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Update services if provided
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      await prisma.bookingService.deleteMany({ where: { bookingId: id } });
      await prisma.bookingService.createMany({
        data: serviceIds.map((serviceId) => ({ bookingId: id, serviceId })),
      });
    }

    return NextResponse.json({
      message: "Booking updated successfully",
      booking: updatedBooking,
    });
  } catch (err) {
    console.error("❌ PUT by ID error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update booking" },
      { status: 500 }
    );
  }
}

/**
 * 🟠 PATCH /api/bookings/walkin/[id]
 * Update status — assign employee, complete, cancel
 */
export async function PATCH(req, { params }) {
  try {
    const decoded = await verifyAuth(req);
    const { id } = params;
    const body = await req.json();
    const { action, employeeId, note, reason } = body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { workOrder: true },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    switch (action) {
      case "assign": {
        if (decoded.userType !== "ADMIN")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (!employeeId)
          return NextResponse.json(
            { error: "Employee ID required" },
            { status: 400 }
          );

        const overlap = await prisma.workOrder.findFirst({
          where: {
            employeeId,
            status: {
              in: [WorkOrderStatus.ASSIGNED, WorkOrderStatus.IN_PROGRESS],
            },
            booking: {
              startAt: { lt: booking.endAt },
              endAt: { gt: booking.startAt },
            },
          },
        });
        if (overlap)
          return NextResponse.json(
            { error: "Employee already booked in this time" },
            { status: 409 }
          );

        const [wo, bk] = await prisma.$transaction([
          prisma.workOrder.update({
            where: { id: booking.workOrder.id },
            data: { employeeId, status: WorkOrderStatus.ASSIGNED },
          }),
          prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.ACCEPTED, acceptedAt: new Date() },
          }),
        ]);
        return NextResponse.json({
          message: "Employee assigned successfully",
          booking: bk,
          workOrder: wo,
        });
      }

      case "complete": {
        const isAdmin = decoded.userType === "ADMIN";
        const isEmployee = decoded.userType === "EMPLOYEE";
        if (!isAdmin && !isEmployee)
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

        const [wo, bk] = await prisma.$transaction([
          prisma.workOrder.update({
            where: { id: booking.workOrder.id },
            data: {
              status: WorkOrderStatus.DONE,
              notes: `${booking.workOrder.notes || ""}\n[COMPLETED] ${
                note || ""
              }`,
              closedAt: new Date(),
            },
          }),
          prisma.booking.update({
            where: { id },
            data: { status: BookingStatus.DONE, completedAt: new Date() },
          }),
        ]);
        return NextResponse.json({
          message: "Booking completed successfully",
          booking: bk,
          workOrder: wo,
        });
      }

      case "cancel": {
        if (decoded.userType !== "ADMIN")
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const [bk, wo] = await prisma.$transaction([
          prisma.booking.update({
            where: { id },
            data: {
              status: BookingStatus.CANCELLED,
              notes: `${booking.notes || ""}\n[CANCELLED] ${
                reason || "Cancelled"
              }`,
            },
          }),
          booking.workOrder
            ? prisma.workOrder.update({
                where: { id: booking.workOrder.id },
                data: {
                  status: WorkOrderStatus.CANCELLED,
                  closedAt: new Date(),
                },
              })
            : Promise.resolve(null),
        ]);

        return NextResponse.json({
          message: "Booking cancelled successfully",
          booking: bk,
          workOrder: wo,
        });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err) {
    console.error("❌ PATCH by ID error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update status" },
      { status: 500 }
    );
  }
}

/**
 * 🔴 DELETE /api/bookings/walkin/[id]
 * Hard delete booking + related work order + link tables
 */
export async function DELETE(req, { params }) {
  try {
    const decoded = await verifyAuth(req);
    if (decoded.userType !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { workOrder: true },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.bookingService.deleteMany({ where: { bookingId: id } });
      if (booking.workOrder) {
        await tx.workOrderService.deleteMany({
          where: { workOrderId: booking.workOrder.id },
        });
        await tx.workOrder.delete({ where: { id: booking.workOrder.id } });
      }
      await tx.booking.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE by ID error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete booking" },
      { status: 500 }
    );
  }
}
