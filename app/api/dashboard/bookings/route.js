import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const bookings = await prisma.booking.findMany({
      where: { date: { gte: start, lte: end } },
    });

    const days = eachDayOfInterval({ start, end });
    const trend = days.map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      count: bookings.filter(
        (b) => format(b.date, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
      ).length,
    }));

    return NextResponse.json({
      today: trend.at(-1)?.count || 0,
      thisMonth: bookings.length,
      trend,
    });
  } catch (err) {
    console.error("Dashboard Bookings Error:", err);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }
}
