import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return NextResponse.json({ error: "No token provided" }, { status: 401 });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    // 🧩 Ensure Employee user
    if (decoded.userType !== "EMPLOYEE") {
      return NextResponse.json(
        { error: "Access denied: Not an employee" },
        { status: 403 }
      );
    }

    const employeeId = decoded.employeeId;
    if (!employeeId)
      return NextResponse.json(
        { error: "Employee ID missing in token" },
        { status: 400 }
      );

    // 🧠 Fetch employee profile
    const employee = await prisma.employeeProfile.findUnique({
      where: { id: employeeId },
    });

    if (!employee)
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );

    // 🧾 Fetch related work orders with service + customer
    const workOrders = await prisma.workOrder.findMany({
      where: { employeeId },
      include: {
        customer: { select: { fullName: true } },
        workOrderServices: {
          include: { service: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 📊 Aggregate stats safely (no revenue)
    const totalOrders = workOrders.length;
    const completed = workOrders.filter((w) => w.status === "COMPLETED").length;
    const inProgress = workOrders.filter(
      (w) => w.status === "IN_PROGRESS"
    ).length;

    // 🕒 Safe total hours calc
    const totalHours = workOrders.reduce((sum, w) => {
      let laborEntries = [];

      if (typeof w.laborEntries === "string") {
        try {
          laborEntries = JSON.parse(w.laborEntries);
        } catch {
          laborEntries = [];
        }
      } else if (Array.isArray(w.laborEntries)) {
        laborEntries = w.laborEntries;
      }

      const hours = laborEntries.reduce(
        (acc, entry) => acc + parseFloat(entry.hours || 0),
        0
      );
      return sum + hours;
    }, 0);

    // 🕓 Recent 5 work orders (flattened for UI)
    const recentOrders = workOrders.slice(0, 5).map((wo) => ({
      id: wo.id,
      status: wo.status,
      customerName: wo.customer?.fullName || "—",
      services:
        wo.workOrderServices?.map((s) => s.service?.name).filter(Boolean) || [],
      closedAt: wo.closedAt || null,
    }));

    // 📈 Weekly stats (7 days)
    const now = new Date();
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(now);
      date.setDate(now.getDate() - i);

      const sameDay = (a, b) =>
        new Date(a).toDateString() === new Date(b).toDateString();

      const count = workOrders.filter(
        (w) =>
          w.status === "COMPLETED" && w.closedAt && sameDay(w.closedAt, date)
      ).length;

      return {
        date: date.toISOString().slice(0, 10),
        count,
      };
    });

    // ✅ Final response
    return NextResponse.json({
      employee,
      stats: {
        totalOrders,
        completed,
        inProgress,
        totalHours,
      },
      recentOrders,
      last7Days: last7Days.reverse(),
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
