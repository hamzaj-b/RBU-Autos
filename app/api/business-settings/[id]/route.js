const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Get by ID
async function GET(req, { params }) {
  try {
    const { id } = params;
    const settings = await prisma.businessSettings.findUnique({
      where: { id },
    });

    if (!settings) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ settings });
  } catch (err) {
    console.error("Get BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// Update by ID
async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const {
      timezone,
      openTime,
      closeTime,
      slotMinutes,
      bufferMinutes,
      allowCustomerBooking,
    } = body;

    const updated = await prisma.businessSettings.update({
      where: { id },
      data: {
        ...(timezone && { timezone }),
        ...(openTime && { openTime }),
        ...(closeTime && { closeTime }),
        ...(slotMinutes && { slotMinutes }),
        ...(bufferMinutes !== undefined && { bufferMinutes }),
        ...(allowCustomerBooking !== undefined && { allowCustomerBooking }),
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (err) {
    console.error("Update BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// Delete by ID
async function DELETE(req, { params }) {
  try {
    const { id } = params;

    await prisma.businessSettings.delete({ where: { id } });

    return NextResponse.json({ message: "Business settings deleted" });
  } catch (err) {
    console.error("Delete BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to delete settings" },
      { status: 500 }
    );
  }
}

module.exports = { GET, PUT, DELETE };
