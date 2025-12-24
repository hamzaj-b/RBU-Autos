"use client";

import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

export default function useCustomerNotifications() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // 🚫 Wait until AuthContext has fully loaded
    if (loading) {
      // console.log("⏳ Waiting for AuthContext to finish loading...");
      return;
    }

    if (!user?.customerId) {
      console.warn("🚫 No customerId found — cannot subscribe to Pusher");
      return;
    }

    const channelName = `customer-${user.customerId}`;
    // console.log("🧠 Attempting to subscribe to:", channelName);

    // ✅ Subscribe after user is ready
    const channel = pusherClient.subscribe(channelName);

    channel.bind("pusher:subscription_succeeded", () => {
      console.log(`📡 Subscribed successfully to: ${channelName}`);
    });

    channel.bind("booking-status", (data) => {
      console.log("📢 Received booking-status event:", data);

      toast.custom((t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${
            data.type === "APPROVED"
              ? "border-green-500"
              : data.type === "REJECTED"
              ? "border-red-500"
              : "border-blue-500"
          } p-4`}
        >
          <p className="text-sm font-semibold text-gray-800">{data.message}</p>

          {data.employeeName && (
            <p className="text-xs text-gray-600 mt-1">
              👷 Assigned to: <b>{data.employeeName}</b>
            </p>
          )}

          {data.services?.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              🛠️ {data.services.join(", ")}
            </p>
          )}

          {data.startAt && (
            <p className="text-xs text-gray-400 mt-1">
              🗓️ {new Date(data.startAt).toLocaleString()}
            </p>
          )}
        </div>
      ));
    });

    channel.bind("pusher:error", (err) => {
      console.error("⚠️ Pusher subscription error:", err);
    });

    return () => {
      console.log("🧹 Unsubscribing from:", channelName);
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user, loading]);
}
