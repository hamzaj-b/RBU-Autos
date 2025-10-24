import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 🧾 Total number of bookings
    const totalBookings = await prisma.booking.count();

    // 🧰 Total number of completed work orders
    const workCompleted = await prisma.workOrder.count({
      where: { status: "DONE" },
    });

    // 💰 Total revenue (sum of totalRevenue in completed work orders)
    const revenueSum = await prisma.workOrder.aggregate({
      _sum: { totalRevenue: true },
      where: { status: "COMPLETED" },
    });

    const totalRevenue = revenueSum._sum.totalRevenue || 0;

    // ✅ Return dashboard stats
    return NextResponse.json({
      totalBookings,
      workCompleted,
      totalRevenue,
    });
  } catch (err) {
    console.error("Dashboard Overview Error:", err);
    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 }
    );
  }
}
