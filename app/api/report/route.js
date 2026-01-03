import { NextResponse } from "next/server";
import { PrismaClient, WorkOrderStatus } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

// -------------------------------------------
// 📜 GET — WorkOrder Report with Filters
// -------------------------------------------
export async function GET(req) {
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

    // Parse filters from query params
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    const employeeId = searchParams.get("employeeId");
    const serviceIds = searchParams.getAll("serviceIds");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // 🧠 Build dynamic filter
    const where = {};

    if (customerId) where.customerId = customerId;

    if (employeeId) where.employeeId = employeeId;

    if (serviceIds && serviceIds.length > 0) {
      where.workOrderServices = {
        some: {
          serviceId: { in: serviceIds },
        },
      };
    }

    if (status && Object.values(WorkOrderStatus).includes(status)) {
      where.status = status;
    }

    if (dateFrom && dateTo) {
      const from = new Date(`${dateFrom}T00:00:00`);
      const to = new Date(`${dateTo}T23:59:59`);

      if (!isNaN(from) && !isNaN(to)) {
        where.openedAt = {
          gte: from,
          lte: to,
        };

      }
    }

    // 🧾 Fetch matching Work Orders
    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        customer: true,
        employee: true,
        workOrderServices: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 🧩 Format output
    const formatted = workOrders.map((wo) => ({
      id: wo.id,
      customerName: wo.customer?.fullName || "N/A",
      employeeName: wo.employee?.fullName || "N/A",
      services: wo.workOrderServices.map((ws) => ws.service.name).join(", "),
      totalRevenue: wo.totalRevenue || 0,
      status: wo.status,
      openedAt: wo.openedAt,
      closedAt: wo.closedAt,
    }));

    return NextResponse.json({
      total: formatted.length,
      report: formatted,
      filtersApplied: {
        customerId,
        employeeId,
        serviceIds,
        status,
        dateFrom,
        dateTo,
      },
    });
  } catch (err) {
    console.error("Report Fetch Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}
