import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function GET(req) {
  try {
    // 🔐 Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    if (decoded.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Access denied: Not a customer" },
        { status: 403 }
      );
    }

    const customerId = decoded.customerId;
    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID missing in token" },
        { status: 400 }
      );
    }

    // 👤 Customer profile
    const customer = await prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        fullName: true,
        createdAt: true,
        vehicleJson: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // 📦 Bookings (for totals + weekly trend)
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      select: { id: true, createdAt: true, status: true },
      orderBy: { createdAt: "desc" },
    });

    // 🧰 Work orders (include services & employee)
    const workOrders = await prisma.workOrder.findMany({
      where: { customerId },
      include: {
        employee: { select: { fullName: true } },
        workOrderServices: {
          include: { service: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 📊 Stats
    const totalBookings = bookings.length;
    const completed = workOrders.filter((w) => w.status === "COMPLETED").length;
    const pending = workOrders.filter(
      (w) => w.status === "ASSIGNED" || w.status === "IN_PROGRESS"
    ).length;
    const cancelled = workOrders.filter((w) => w.status === "CANCELLED").length;

    // Vehicles count
    const vehicleCount = Array.isArray(customer.vehicleJson)
      ? customer.vehicleJson.length
      : customer.vehicleJson
      ? 1
      : 0;

    // 🕒 Recent work orders (flattened, ready for table)
    const recentOrders = workOrders.slice(0, 5).map((wo) => ({
      id: wo.id,
      status: wo.status,
      employeeName: wo.employee?.fullName || "—",
      services:
        wo.workOrderServices?.map((ws) => ws.service?.name).filter(Boolean) ||
        [],
      closedAt: wo.closedAt || null,
    }));

    // 📈 Weekly trend (last 7 days, by booking creation)
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i)); // oldest → newest
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD

      const sameDay = (a, b) =>
        new Date(a).toDateString() === new Date(b).toDateString();

      const count = bookings.filter((b) => sameDay(b.createdAt, d)).length;
      return { date: key, count };
    });

    return NextResponse.json({
      customer,
      stats: {
        totalBookings,
        completed,
        pending,
        cancelled,
        vehicleCount,
      },
      recentOrders,
      last7Days: days,
    });
  } catch (err) {
    console.error("Customer dashboard error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load customer dashboard" },
      { status: 500 }
    );
  }
}
