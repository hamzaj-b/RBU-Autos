const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ===============================
// 🟢 GET Business Settings by ID
// ===============================
async function GET(req, { params }) {
  try {
    const { id } = await params;

    const settings = await prisma.businessSettings.findUnique({
      where: { id },
    });

    if (!settings) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ✅ fallback for old entries without tax field
    return NextResponse.json({
      settings: {
        ...settings,
        regionalTax: settings.regionalTax ?? 0.0,
      },
    });
  } catch (err) {
    console.error("Get BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// ===============================
// 🟢 UPDATE Business Settings by ID
// ===============================
async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      timezone,
      utc,
      openTime,
      closeTime,
      slotMinutes,
      bufferMinutes,
      allowCustomerBooking,
      regionalTax, // 🆕 added
    } = body;

    // ✅ validate regionalTax if provided
    if (regionalTax !== undefined) {
      const taxValue = Number(regionalTax);
      if (isNaN(taxValue) || taxValue < 0 || taxValue > 100) {
        return NextResponse.json(
          { error: "Invalid regional tax value (must be between 0 and 100)" },
          { status: 400 }
        );
      }
    }

    // ✅ update all provided fields dynamically
    const updated = await prisma.businessSettings.update({
      where: { id },
      data: {
        ...(timezone && { timezone }),
        ...(utc && { utc }),
        ...(openTime && { openTime }),
        ...(closeTime && { closeTime }),
        ...(slotMinutes && { slotMinutes }),
        ...(bufferMinutes !== undefined && { bufferMinutes }),
        ...(allowCustomerBooking !== undefined && { allowCustomerBooking }),
        ...(regionalTax !== undefined && {
          regionalTax: Number(regionalTax),
        }), // 🆕 update tax
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

// ===============================
// 🔴 DELETE Business Settings by ID
// ===============================
async function DELETE(req, { params }) {
  try {
    const { id } = await params;

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
