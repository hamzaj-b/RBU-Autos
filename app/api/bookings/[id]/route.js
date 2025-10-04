const { NextResponse } = require("next/server");
const {
  PrismaClient,
  BookingStatus,
  WorkOrderStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// ✅ Get booking by ID
async function GET(req, context) {
  try {
    const { id } = await context.params; // 👈 await here

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
        customer: true,
        workOrder: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("Fetch booking error:", err);
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}

// ✅ Update booking
async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, notes, directAssignEmployeeId } = body;

    // Update booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: status || undefined,
        notes: notes || undefined,
      },
      include: { workOrder: true },
    });

    // If reassigning employee
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
      message: "Booking updated",
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

// ✅ Delete booking (cancel)
async function DELETE(req, { params }) {
  try {
    const { id } = params;

    // Cancel booking
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });

    // Cancel related workOrder
    await prisma.workOrder.update({
      where: { bookingId: id },
      data: { status: WorkOrderStatus.CANCELLED },
    });

    return NextResponse.json({
      message: "Booking cancelled",
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
