import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST() {
  await pusherServer.trigger(
    "customer-68e0c31f153f0482d88e51fd",
    "booking-status",
    {
      type: "APPROVED",
      message: "🧪 Test notification: Pusher working fine!",
      bookingId: "TEST-BOOKING-123",
    }
  );
  console.log("✅ Test event triggered for customer-68e0c31f153f0482d88e51fd");
  return NextResponse.json({ ok: true });
}
