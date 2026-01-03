import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { subMonths, format } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // ⏳ Parse ?months= param (default = 6)
    const { searchParams } = new URL(req.url);
    const monthsParam = parseInt(searchParams.get("months")) || 6;

    // Limit accepted values (3, 6, 9, 12)
    const allowed = [3, 6, 9, 12];
    const months = allowed.includes(monthsParam) ? monthsParam : 6;

    const now = new Date();
    const startDate = subMonths(now, months - 1); // e.g., last 6 months including current

    // 📦 Fetch completed work orders within the range
    const orders = await prisma.workOrder.findMany({
      where: {
        status: "COMPLETED",
        closedAt: { gte: startDate, lte: now },
      },
      select: {
        totalRevenue: true,
        closedAt: true,
      },
    });

    // 🧮 Aggregate revenue by month
    const monthlyTotals = {};
    orders.forEach((wo) => {
      const month = format(wo.closedAt, "MMM");
      monthlyTotals[month] =
        (monthlyTotals[month] || 0) + (wo.totalRevenue || 0);
    });

    // 🗓️ Generate all months in range (chronological)
    const sortedMonths = Array.from({ length: months }).map((_, i) =>
      format(subMonths(now, months - 1 - i), "MMM")
    );

    const data = sortedMonths.map((month) => ({
      month,
      sales: monthlyTotals[month] || 0, // fill missing months with 0
    }));

    // ✅ Return result
    return NextResponse.json({
      period: `${months}M`,
      data,
    });
  } catch (err) {
    console.error("📊 Dashboard Monthly Sales Error:", err);
    return NextResponse.json(
      { error: "Failed to load monthly sales data" },
      { status: 500 }
    );
  }
}
