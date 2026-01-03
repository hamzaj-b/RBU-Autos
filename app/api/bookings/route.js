const { NextResponse } = require("next/server");
const {
  PrismaClient,
  BookingStatus,
  WorkOrderStatus,
  BookingType,
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

async function GET(req) {
  try {
    // 🔑 Auth
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

    // 📦 Query params
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    // accept pageSize alias as well as limit
    const limit = parseInt(
      searchParams.get("pageSize") || searchParams.get("limit") || "10",
      10
    );
    const skip = (page - 1) * limit;

    const statusParam = searchParams.get("status"); // e.g. ACCEPTED
    const search = searchParams.get("search")?.trim() || "";
    const typeParam = (searchParams.get("type") || "").toUpperCase(); // WALKIN / PREBOOKING
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // 🧠 Build where
    const where = {};

    // Role-based scope
    if (decoded.userType === "CUSTOMER" && decoded.customerId) {
      where.customerId = decoded.customerId;
    } else if (decoded.userType === "EMPLOYEE" && decoded.employeeId) {
      // only bookings where its work order is assigned to this employee
      where.workOrder = { employeeId: decoded.employeeId };
    }

    // Booking type (validate against enum)
    if (typeParam && Object.values(BookingType).includes(typeParam)) {
      // Prisma enums are strings under the hood
      where.bookingType = typeParam;
    }

    // Booking status (validate against enum)
    if (
      statusParam &&
      statusParam !== "all" &&
      Object.values(BookingStatus).includes(statusParam)
    ) {
      where.status = statusParam;
    }

    // Date range (by booking.date)
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    // Search across notes, customer name, employee name, service name
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        {
          workOrder: {
            employee: { fullName: { contains: search, mode: "insensitive" } },
          },
        },
        {
          bookingServices: {
            some: {
              service: { name: { contains: search, mode: "insensitive" } },
            },
          },
        },
      ];
    }

    // ⚡ Query
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

    // 🧩 Shape response
    const items = bookings.map((b) => ({
      id: b.id,
      bookingType: b.bookingType, // WALKIN | PREBOOKING
      services: b.bookingServices.map((bs) => bs.service.name),
      totalDuration: b.bookingServices.reduce(
        (sum, bs) => sum + (bs.service.durationMinutes || 0),
        0
      ),
      customerName: b.customer?.fullName || "N/A",
      employeeName: b.workOrder?.employee?.fullName || "Unassigned",
      status: b.status,
      notes: b.notes,
      startAt: b.startAt,
      endAt: b.endAt,
      date: b.date,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      raw: b,
    }));

    return NextResponse.json({
      total,
      page,
      limit, // also works as pageSize on frontend
      totalPages: Math.ceil(total / limit),
      count: items.length,
      filters: {
        status: statusParam || "all",
        type: typeParam || "all",
        dateFrom: dateFrom || null,
        dateTo: dateTo || null,
        search,
      },
      bookings: items,
      pagination: {
        // convenient block for UIs
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("❌ Fetch bookings error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
