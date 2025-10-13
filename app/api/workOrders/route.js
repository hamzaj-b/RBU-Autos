const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// -------------------------------------------
// 📜 GET — Fetch Work Orders (multi-service safe)
// -------------------------------------------
async function GET(req) {
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

    // 📦 Query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") || null;
    const search = searchParams.get("search")?.trim() || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    // 🧩 Role-based filtering
    const where = {};

    if (decoded.userType === "EMPLOYEE") {
      if (!decoded.employeeId)
        return NextResponse.json(
          { error: "Employee profile missing in token" },
          { status: 403 }
        );
      where.employeeId = decoded.employeeId;
    } else if (decoded.userType === "CUSTOMER") {
      if (!decoded.customerId)
        return NextResponse.json(
          { error: "Customer profile missing in token" },
          { status: 403 }
        );
      where.customerId = decoded.customerId;
    }

    // 🧭 Status filter
    if (status && Object.values(WorkOrderStatus).includes(status)) {
      where.status = status;
    }

    // 🔍 Search filter
    if (search) {
      where.OR = [
        { notes: { contains: search, mode: "insensitive" } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        {
          workOrderServices: {
            some: {
              service: { name: { contains: search, mode: "insensitive" } },
            },
          },
        },
      ];
    }

    // 📊 Fetch total count
    const total = await prisma.workOrder.count({ where });

    // 📦 Fetch data (with relations)
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: true,
            bookingServices: { include: { service: true } },
          },
        },
        customer: true,
        employee: true,
        workOrderServices: { include: { service: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    // 🧩 Format response
    const formatted = workOrders.map((wo) => ({
      id: wo.id,
      status: wo.status,
      openedAt: wo.openedAt,
      closedAt: wo.closedAt,
      customerName: wo.customer?.fullName || "N/A",
      employeeName: wo.employee?.fullName || "Unassigned",
      services:
        wo.workOrderServices?.map((ws) => ws.service.name) ||
        wo.booking?.bookingServices?.map((bs) => bs.service.name) ||
        [],
      bookingTime: wo.booking
        ? `${new Date(wo.booking.startAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${new Date(wo.booking.endAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`
        : null,
      notes: wo.notes,
      raw: wo,
    }));

    return NextResponse.json({
      userType: decoded.userType,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      workOrders: formatted,
    });
  } catch (err) {
    console.error("Fetch workOrders error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch workOrders" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
