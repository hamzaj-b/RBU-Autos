const { NextResponse } = require("next/server");
const {
  PrismaClient,
  BookingStatus,
  WorkOrderStatus,
} = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { getSlots } = require("@/lib/slot");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function POST(req) {
  try {
    // 🔑 Auth check
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

    // 📦 Request body
    const body = await req.json();
    const {
      customerId,
      serviceId,
      startAt,
      endAt,
      directAssignEmployeeId,
      notes,
    } = body;

    if (!customerId || !serviceId || !startAt || !endAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🕑 Step 1: Validate slot availability
    const date = startAt.split("T")[0]; // extract YYYY-MM-DD
    const { slots } = await getSlots(date);

    const targetSlot = slots.find(
      (s) =>
        new Date(s.start).getTime() === new Date(startAt).getTime() &&
        new Date(s.end).getTime() === new Date(endAt).getTime()
    );

    if (!targetSlot) {
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });
    }

    if (targetSlot.capacity <= 0) {
      return NextResponse.json(
        { error: "Slot fully booked. Please choose another time." },
        { status: 409 }
      );
    }

    // 👷 Step 2: If employee directly assigned → check availability
    if (directAssignEmployeeId) {
      const overlapping = await prisma.workOrder.findFirst({
        where: {
          employeeId: directAssignEmployeeId,
          status: { in: ["ASSIGNED", "IN_PROGRESS"] },
          booking: {
            startAt: { lt: new Date(endAt) },
            endAt: { gt: new Date(startAt) },
          },
        },
      });

      if (overlapping) {
        return NextResponse.json(
          {
            error: "Selected employee is already booked in this time slot.",
            conflictBookingId: overlapping.bookingId,
          },
          { status: 409 }
        );
      }
    }

    // 📝 Step 3: Create booking
    const booking = await prisma.booking.create({
      data: {
        customerId,
        createdByUserId: decoded.id,
        serviceId,
        date: new Date(startAt),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        slotMinutes: 60,
        notes: notes || null,
        status: BookingStatus.ACCEPTED,
      },
    });

    // 🛠 Step 4: Create workOrder
    const workOrder = await prisma.workOrder.create({
      data: {
        bookingId: booking.id,
        customerId,
        serviceId,
        employeeId: directAssignEmployeeId || null,
        status: directAssignEmployeeId
          ? WorkOrderStatus.ASSIGNED
          : WorkOrderStatus.OPEN,
      },
    });

    // 🔗 Step 5: Link workOrder back to booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: { workOrderId: workOrder.id },
    });

    return NextResponse.json({
      message: "Booking + WorkOrder created successfully",
      booking,
      workOrder,
    });
  } catch (err) {
    console.error("Create booking error:", err);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        service: true,
        customer: true,
        workOrder: {
          include: {
            employee: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
