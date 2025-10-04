const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Create Business Settings
async function POST(req) {
  try {
    const body = await req.json();
    const {
      timezone,
      openTime,
      closeTime,
      slotMinutes,
      bufferMinutes,
      allowCustomerBooking,
    } = body;

    if (!timezone || !openTime || !closeTime || !slotMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const settings = await prisma.businessSettings.create({
      data: {
        timezone,
        openTime,
        closeTime,
        slotMinutes,
        bufferMinutes: bufferMinutes || 0,
        allowCustomerBooking: allowCustomerBooking ?? true,
      },
    });

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Create BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to create settings" },
      { status: 500 }
    );
  }
}

// Get all Business Settings
async function GET() {
  try {
    const settings = await prisma.businessSettings.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Fetch BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
