const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function GET(req) {
  try {
    // -------------------------
    // 🔑 1. Verify JWT (Employee Only)
    // -------------------------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET_KEY);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Only employees can view open work orders" },
        { status: 403 }
      );
    }

    // -------------------------
    // 📦 2. Parse Query Params
    // -------------------------
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // -------------------------
    // 🔍 3. Build Query
    // -------------------------
    const whereClause = {
      status: WorkOrderStatus.OPEN,
    };

    if (search) {
      whereClause.OR = [
        { notes: { contains: search, mode: "insensitive" } },
        { service: { name: { contains: search, mode: "insensitive" } } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // -------------------------
    // 📊 4. Fetch Data
    // -------------------------
    const total = await prisma.workOrder.count({ where: whereClause });

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        service: true,
        customer: true,
        employee: true,
        booking: {
          include: {
            service: true,
            customer: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // -------------------------
    // 🧮 5. Summary of Open Jobs
    // -------------------------
    const totalSlots = workOrders.length;
    const avgDuration =
      totalSlots > 0
        ? Math.round(
            workOrders.reduce(
              (sum, wo) => sum + (wo.booking?.service?.durationMinutes || 60),
              0
            ) / totalSlots
          )
        : 0;

    const earliestBooking = workOrders
      .map((wo) => wo.booking?.startAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];

    const summary = {
      totalOpen: totalSlots,
      averageDuration: avgDuration,
      nextStartingAt: earliestBooking || null,
    };

    // -------------------------
    // 🧩 6. Format WorkOrders (Summary List)
    // -------------------------
    const formatted = workOrders.map((wo) => ({
      id: wo.id,
      status: wo.status,
      startAt: wo.booking?.startAt,
      endAt: wo.booking?.endAt,
      bookingTitle: wo.booking?.service?.name || "Service",
      customerName: wo.booking?.customer?.fullName || "Unknown Customer",
      estimatedTime: wo.booking?.service?.durationMinutes || 60,
      notes: wo.booking?.notes || null,
      // NEW — attach full details (for expanded views)
      details: {
        workOrder: {
          id: wo.id,
          status: wo.status,
          notes: wo.notes,
          openedAt: wo.openedAt,
          createdAt: wo.createdAt,
          updatedAt: wo.updatedAt,
          service: wo.service,
          customer: wo.customer,
          employee: wo.employee,
        },
        booking: {
          id: wo.booking?.id,
          status: wo.booking?.status,
          notes: wo.booking?.notes,
          date: wo.booking?.date,
          startAt: wo.booking?.startAt,
          endAt: wo.booking?.endAt,
          service: wo.booking?.service,
          customer: wo.booking?.customer,
          slotMinutes: wo.booking?.slotMinutes,
          attachments: wo.booking?.attachments,
        },
      },
    }));

    // -------------------------
    // ✅ 7. Return Response
    // -------------------------
    return NextResponse.json({
      message: "Open work orders fetched successfully",
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        count: formatted.length,
      },
      workOrders: formatted,
    });
  } catch (err) {
    console.error("Fetch open work orders error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch open work orders" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
