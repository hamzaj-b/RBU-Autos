const { NextResponse } = require("next/server");
const {
  PrismaClient,
  BookingStatus,
  WorkOrderStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ GET booking by ID
async function GET(req, context) {
  try {
    const { id } = await context.params; // 👈 await here

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        bookingServices: {
          include: { service: true },
        },
        customer: true,
        workOrder: {
          include: {
            employee: true,
            workOrderServices: {
              include: { service: true },
            },
          },
        },
      },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // 🧩 Flatten the services for easier client handling
    const services = booking.bookingServices.map((bs) => bs.service);

    return NextResponse.json({
      booking: {
        ...booking,
        services,
      },
    });
  } catch (err) {
    console.error("Fetch booking error:", err);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// ✅ PUT — Update booking
async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, notes, directAssignEmployeeId, serviceIds } = body;

    // 🔐 Token (optional if you want to enforce)
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

    // 🧩 1️⃣ Update booking base fields
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes || undefined,
      },
      include: { workOrder: true },
    });

    // 🧩 2️⃣ Update services if provided
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      // delete old ones first
      await prisma.bookingService.deleteMany({
        where: { bookingId: id },
      });

      await prisma.bookingService.createMany({
        data: serviceIds.map((serviceId) => ({
          bookingId: id,
          serviceId,
        })),
      });

      // also update workOrderServices to keep in sync
      if (booking.workOrder) {
        await prisma.workOrderService.deleteMany({
          where: { workOrderId: booking.workOrder.id },
        });
        await prisma.workOrderService.createMany({
          data: serviceIds.map((serviceId) => ({
            workOrderId: booking.workOrder.id,
            serviceId,
          })),
        });
      }
    }

    // 🧩 3️⃣ Handle employee reassignment
    let updatedWorkOrder = null;
    if (directAssignEmployeeId) {
      updatedWorkOrder = await prisma.workOrder.update({
        where: { bookingId: id },
        data: {
          employeeId: directAssignEmployeeId,
          status: WorkOrderStatus.ASSIGNED,
        },
      });
    }

    return NextResponse.json({
      message: "Booking updated successfully",
      booking,
      workOrder: updatedWorkOrder,
    });
  } catch (err) {
    console.error("Update booking error:", err);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// ✅ DELETE — Cancel booking + related work order
async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const booking = await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    // Cancel related workOrder if exists
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { bookingId: id },
    });
    if (existingWorkOrder) {
      await prisma.workOrder.update({
        where: { bookingId: id },
        data: { status: WorkOrderStatus.CANCELLED },
      });
    }

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking,
    });
  } catch (err) {
    console.error("Delete booking error:", err);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
