// /lib/pusher.js
import Pusher from "pusher";
import PusherClient from "pusher-js";

/**
 * ✅ Server instance (for API routes, server actions, and route handlers)
 * Loaded only on the server – uses secret keys
 */
export const pusherServer =
  typeof window === "undefined"
    ? new Pusher({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.PUSHER_CLUSTER || "ap2",
        useTLS: true,
      })
    : null;

/**
 * ✅ Client instance (for frontend)
 * Loaded only in the browser – uses NEXT_PUBLIC_ vars
 */
export const pusherClient =
  typeof window !== "undefined"
    ? new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        forceTLS: true,
        enabledTransports: ["ws", "wss"], // more stable across browsers
      })
    : null;

// Optional: log in dev mode to confirm keys loaded
if (process.env.NODE_ENV === "development") {
  console.log("🔐 Pusher initialized:");
  console.log(
    "   Server Key:",
    process.env.PUSHER_KEY ? "✅ Loaded" : "❌ Missing"
  );
  console.log(
    "   Client Key:",
    process.env.NEXT_PUBLIC_PUSHER_KEY ? "✅ Loaded" : "❌ Missing"
  );
}
