import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "supersecret";

export async function GET(req) {
  try {
    // 🔑 1️⃣ Auth check (Admin only)
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

    if (decoded.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Only Admin can check employee availability" },
        { status: 403 }
      );
    }

    // 📦 2️⃣ Parse query params
    const { searchParams } = new URL(req.url);
    const startAtParam = searchParams.get("startAt");
    const duration = parseInt(searchParams.get("duration") || "60", 10); // minutes

    // ⏰ Determine requested time window
    const now = new Date();
    const startAt = startAtParam ? new Date(startAtParam) : now;
    const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

    // 🧠 3️⃣ Find busy employees in that window
    const busyWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS", "WAITING"] },
        booking: {
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      },
      select: {
        employeeId: true,
        booking: {
          select: {
            startAt: true,
            endAt: true,
          },
        },
        employee: {
          select: {
            id: true,
            fullName: true,
            title: true,
            hourlyRate: true,
          },
        },
      },
    });

    // Format busy list
    const busyEmployees = busyWorkOrders
      .filter((w) => !!w.employee)
      .map((w) => ({
        id: w.employee.id,
        fullName: w.employee.fullName,
        title: w.employee.title,
        hourlyRate: w.employee.hourlyRate,
        busyFrom: w.booking.startAt,
        busyUntil: w.booking.endAt,
        currentStatus: "BUSY",
      }));

    const busyIds = busyEmployees.map((e) => e.id);

    // 🧩 4️⃣ Find all employees who are NOT busy
    const availableEmployees = await prisma.employeeProfile.findMany({
      where: { id: { notIn: busyIds } },
      select: {
        id: true,
        fullName: true,
        title: true,
        hourlyRate: true,
      },
      orderBy: { fullName: "asc" },
    });

    // ✅ 5️⃣ Return both lists
    return NextResponse.json({
      window: { startAt, endAt, durationMinutes: duration },
      summary: {
        totalEmployees: availableEmployees.length + busyEmployees.length,
        availableCount: availableEmployees.length,
        busyCount: busyEmployees.length,
      },
      availableEmployees,
      busyEmployees,
    });
  } catch (err) {
    console.error("❌ Employee availability error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch available employees" },
      { status: 500 }
    );
  }
}
