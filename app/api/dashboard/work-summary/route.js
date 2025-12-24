import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET() {
  try {
    const grouped = await prisma.workOrder.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const summary = Object.fromEntries(
      grouped.map((g) => [g.status.toLowerCase(), g._count.status])
    );

    return NextResponse.json(summary);
  } catch (err) {
    console.error("Work Summary Error:", err);
    return NextResponse.json(
      { error: "Failed to load work summary" },
      { status: 500 }
    );
  }
}
