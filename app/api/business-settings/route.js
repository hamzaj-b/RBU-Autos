const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ===============================
// 🟢 CREATE Business Settings
// ===============================
async function POST(req) {
  try {
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

    // ✅ validation
    if (!timezone || !openTime || !closeTime || !slotMinutes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ numeric validation for tax
    const taxValue = Number(regionalTax);
    if (isNaN(taxValue) || taxValue < 0 || taxValue > 100) {
      return NextResponse.json(
        { error: "Invalid regional tax value (must be between 0 and 100)" },
        { status: 400 }
      );
    }

    // ✅ create record with default values
    const settings = await prisma.businessSettings.create({
      data: {
        timezone,
        utc: utc || "(UTC+00:00)",
        openTime,
        closeTime,
        slotMinutes,
        bufferMinutes: bufferMinutes || 0,
        allowCustomerBooking: allowCustomerBooking ?? true,
        regionalTax: taxValue || 0.0, // 🆕 save tax
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

// ===============================
// 🟢 GET Business Settings
// ===============================
async function GET() {
  try {
    const settings = await prisma.businessSettings.findMany({
      orderBy: { createdAt: "desc" },
    });

    // ✅ default to 0 tax if missing (for backward compatibility)
    const normalized = settings.map((s) => ({
      ...s,
      regionalTax: s.regionalTax ?? 0.0,
    }));

    return NextResponse.json({ settings: normalized });
  } catch (err) {
    console.error("Fetch BusinessSettings error:", err);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

module.exports = { POST, GET };
