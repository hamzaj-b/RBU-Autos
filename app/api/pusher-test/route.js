import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function GET() {
  try {
    await pusherServer.trigger("admin-channel", "new-booking", {
      message: "🚀 Test notification from /api/pusher-test",
      booking: {
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
      },
      customerId: "demo-customer-123",
    });

    console.log("✅ Manual test notification sent via Pusher");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Pusher test error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
