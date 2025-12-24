const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

async function GET(req) {
  try {
    // -------------------------
    // 🔑 1️⃣ Verify JWT (Employee Only)
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
    // 📦 2️⃣ Parse Query Params
    // -------------------------
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const skip = (page - 1) * limit;

    // -------------------------
    // 🔍 3️⃣ Build Query
    // -------------------------
    const whereClause = {
      status: WorkOrderStatus.OPEN,
    };

    if (search) {
      whereClause.OR = [
        { notes: { contains: search, mode: "insensitive" } },
        {
          workOrderServices: {
            some: {
              service: { name: { contains: search, mode: "insensitive" } },
            },
          },
        },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // -------------------------
    // 📊 4️⃣ Fetch Data
    // -------------------------
    const total = await prisma.workOrder.count({ where: whereClause });

    const workOrders = await prisma.workOrder.findMany({
      where: whereClause,
      include: {
        customer: true,
        employee: true,
        workOrderServices: { include: { service: true } },
        booking: {
          include: {
            customer: true,
            bookingServices: { include: { service: true } },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    });

    // -------------------------
    // 🧮 5️⃣ Summary Calculations
    // -------------------------
    const totalOpen = workOrders.length;

    const avgDuration =
      totalOpen > 0
        ? Math.round(
            workOrders.reduce((sum, wo) => {
              const durations =
                wo.workOrderServices?.map(
                  (ws) => ws.service.durationMinutes || 60
                ) || [];
              const avg =
                durations.length > 0
                  ? durations.reduce((a, b) => a + b, 0) / durations.length
                  : 60;
              return sum + avg;
            }, 0) / totalOpen
          )
        : 0;

    const earliestBooking = workOrders
      .map((wo) => wo.booking?.startAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a) - new Date(b))[0];

    const summary = {
      totalOpen,
      averageDuration: avgDuration,
      nextStartingAt: earliestBooking || null,
    };

    // -------------------------
    // 🧩 6️⃣ Format WorkOrders
    // -------------------------
    const formatted = workOrders.map((wo) => {
      const services =
        wo.workOrderServices?.map((ws) => ws.service.name) ||
        wo.booking?.bookingServices?.map((bs) => bs.service.name) ||
        [];

      return {
        id: wo.id,
        status: wo.status,
        startAt: wo.booking?.startAt || null,
        endAt: wo.booking?.endAt || null,
        customerName: wo.customer?.fullName || "Unknown Customer",
        employeeName: wo.employee?.fullName || "Unassigned",
        services,
        estimatedTime:
          Math.round(
            (services.length > 0
              ? services.length * 60
              : wo.booking?.slotMinutes || 60) / 60
          ) * 60,
        notes: wo.notes || wo.booking?.notes || null,
        details: {
          workOrder: {
            id: wo.id,
            status: wo.status,
            notes: wo.notes,
            openedAt: wo.openedAt,
            createdAt: wo.createdAt,
            updatedAt: wo.updatedAt,
            services: wo.workOrderServices.map((ws) => ws.service),
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
            slotMinutes: wo.booking?.slotMinutes,
            attachments: wo.booking?.attachments,
            services:
              wo.booking?.bookingServices?.map((bs) => bs.service) || [],
            customer: wo.booking?.customer,
          },
        },
      };
    });

    // -------------------------
    // ✅ 7️⃣ Return Response
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
