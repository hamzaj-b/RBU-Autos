import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 🗓️ Define the current month's start and end
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    // 📦 Fetch all completed work orders in current month with their services
    const result = await prisma.workOrderService.findMany({
      where: {
        workOrder: {
          status: "DONE",
          closedAt: { gte: start, lte: end }, // use closedAt for completion
        },
      },
      include: { service: true },
    });

    // 🧮 Count how many times each service was used
    const countByService = {};
    result.forEach((r) => {
      const name = r.service?.name || "Unknown";
      countByService[name] = (countByService[name] || 0) + 1;
    });

    // 🏆 Sort by count and take top 3
    const topServices = Object.entries(countByService)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // ✅ Response
    return NextResponse.json({
      month: start.toLocaleString("default", { month: "long" }),
      topServices,
    });
  } catch (err) {
    console.error("🚨 Service Report Error:", err);
    return NextResponse.json(
      { error: "Failed to load top services report" },
      { status: 500 }
    );
  }
}
