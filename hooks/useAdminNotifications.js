"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import toast from "react-hot-toast";

export default function useAdminNotifications() {
  useEffect(() => {
    console.log("🧠 Subscribing to admin-channel...");
    const channel = pusherClient.subscribe("admin-channel");

    channel.bind("pusher:subscription_succeeded", () =>
      console.log("📡 Subscribed to admin-channel")
    );

    channel.bind("new-booking", (data) => {
      console.log("📢 Received new booking event:", data);

      // ✅ React-safe toast notification
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 border-blue-500 p-4`}
        >
          <p className="text-sm font-semibold text-gray-800">{data.message}</p>
          <p className="text-xs text-gray-600 mt-1">👤 {data.customerName}</p>
          <p className="text-xs text-gray-500 mt-1">
            🛠️ {data.services?.join(", ") || "No services listed"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(data.booking.startAt).toLocaleString()}
          </p>
        </div>
      ));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);
}
