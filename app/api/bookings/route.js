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

// -------------------------------------------
// 📦 POST — Create Booking
// -------------------------------------------
async function POST(req) {
  try {
    // 🔑 1️⃣ Auth Check
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

    // 📦 2️⃣ Parse Request Body
    const body = await req.json();
    const {
      customerId,
      serviceIds, // array of service IDs
      startAt,
      endAt,
      directAssignEmployeeId,
      notes,
    } = body;

    if (
      !customerId ||
      !Array.isArray(serviceIds) ||
      serviceIds.length === 0 ||
      !startAt ||
      !endAt
    ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // 🕑 3️⃣ Validate slot availability
    const date = startAt.split("T")[0];
    const { slots } = await getSlots(date);

    const targetSlot = slots.find(
      (s) =>
        new Date(s.start).getTime() === new Date(startAt).getTime() &&
        new Date(s.end).getTime() === new Date(endAt).getTime()
    );

    if (!targetSlot)
      return NextResponse.json({ error: "Invalid time slot" }, { status: 400 });

    if (targetSlot.capacity <= 0)
      return NextResponse.json(
        { error: "Slot fully booked. Please choose another time." },
        { status: 409 }
      );

    // 👷 4️⃣ Check employee overlap BEFORE inserting anything
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

    // 🔒 5️⃣ Use a transaction to create booking + workOrder atomically
    const [booking, workOrder] = await prisma.$transaction(async (tx) => {
      // ➕ Create booking
      const booking = await tx.booking.create({
        data: {
          customerId,
          createdByUserId: decoded.id,
          date: new Date(startAt),
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          slotMinutes: 60,
          notes: notes || null,
          status: BookingStatus.ACCEPTED,
        },
      });

      // ➕ Link booking to multiple services
      await tx.bookingService.createMany({
        data: serviceIds.map((serviceId) => ({
          bookingId: booking.id,
          serviceId,
        })),
      });

      // ➕ Create workOrder
      const workOrder = await tx.workOrder.create({
        data: {
          bookingId: booking.id,
          customerId,
          employeeId: directAssignEmployeeId || null,
          status: directAssignEmployeeId
            ? WorkOrderStatus.ASSIGNED
            : WorkOrderStatus.OPEN,
        },
      });

      // ➕ Link workOrder to same services
      await tx.workOrderService.createMany({
        data: serviceIds.map((serviceId) => ({
          workOrderId: workOrder.id,
          serviceId,
        })),
      });

      // 🔗 Link booking → workOrder
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          workOrder: {
            connect: { id: workOrder.id },
          },
        },
      });

      return [booking, workOrder];
    });

    // ✅ 6️⃣ Respond Success
    const message = directAssignEmployeeId
      ? "Booking created and assigned to employee successfully."
      : "Booking created successfully and added to Open Work Orders queue.";

    return NextResponse.json({ message, booking, workOrder }, { status: 201 });
  } catch (err) {
    console.error("Create booking error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

// -------------------------------------------
// 📜 GET — Fetch All Bookings
// -------------------------------------------
async function GET(req) {
  try {
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

    // Query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where = {};

    if (decoded.userType === "CUSTOMER" && decoded.customerId)
      where.customerId = decoded.customerId;
    else if (decoded.userType === "EMPLOYEE" && decoded.employeeId)
      where.workOrder = { employeeId: decoded.employeeId };

    if (status && status !== "all") where.status = status;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: {
          bookingServices: { include: { service: true } },
          customer: true,
          workOrder: { include: { employee: true } },
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
    ]);

    const results = bookings.map((b) => ({
      id: b.id,
      services: b.bookingServices.map((bs) => bs.service.name),
      customerName: b.customer?.fullName || "N/A",
      employeeName: b.workOrder?.employee?.fullName || "Unassigned",
      status: b.status,
      notes: b.notes,
      startAt: b.startAt,
      endAt: b.endAt,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      raw: b,
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
