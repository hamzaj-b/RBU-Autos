const { NextResponse } = require("next/server");
const { getSlots } = require("@/lib/slot");

async function POST(req) {
  try {
    const body = await req.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const { slots } = await getSlots(date);
    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Available slots error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch slots" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
