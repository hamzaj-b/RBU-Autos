const { NextResponse } = require("next/server");
const { PrismaClient, WorkOrderStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: WorkOrderStatus.OPEN,
        employeeId: null, // only unassigned open
      },
      include: {
        booking: {
          include: {
            service: true,
            customer: true,
          },
        },
        customer: true,
        service: true,
      },
    });

    // 📝 Format response with description
    const formatted = workOrders.map((wo) => {
      return {
        id: wo.id,
        status: wo.status,
        startAt: wo.booking?.startAt,
        endAt: wo.booking?.endAt,
        bookingTitle: wo.booking?.service?.name || "Service",
        customerName: wo.booking?.customer?.fullName || "Unknown Customer",
        estimatedTime: wo.booking?.service?.durationMinutes || 60,
        notes: wo.booking?.notes || null,
      };
    });

    return NextResponse.json({ workOrders: formatted });
  } catch (err) {
    console.error("Fetch open workOrders error:", err);
    return NextResponse.json(
      { error: "Failed to fetch open workOrders" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
