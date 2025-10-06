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

async function GET(req) {
  try {
    // 🔐 Token validation
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

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

    // 📜 Parse query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const status = searchParams.get("status"); // ACCEPTED, CANCELLED, etc.
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // 🧩 Build where condition dynamically
    const where = {};

    // Filter by userType
    if (decoded.userType === "CUSTOMER" && decoded.customerId) {
      where.customerId = decoded.customerId;
    } else if (decoded.userType === "EMPLOYEE" && decoded.employeeId) {
      // Employee → only bookings linked to their work orders
      where.workOrder = { employeeId: decoded.employeeId };
    }

    // Filter by status
    if (status && status !== "all") {
      where.status = status;
    }

    // Search by customer name or service name
    if (search) {
      where.OR = [
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        { service: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Date filters
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // 🧠 Query bookings
    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          service: true,
          customer: true,
          workOrder: {
            include: {
              employee: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    // ✅ Build formatted response
    const results = bookings.map((b) => ({
      id: b.id,
      serviceName: b.service?.name || "N/A",
      customerName: b.customer?.fullName || "N/A",
      status: b.status,
      notes: b.notes,
      startAt: b.startAt,
      endAt: b.endAt,
      employeeName: b.workOrder?.employee?.fullName || "Unassigned",
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      raw: b, // full details if needed
    }));

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      count: results.length,
      bookings: results,
    });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
