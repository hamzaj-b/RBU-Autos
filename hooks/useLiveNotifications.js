import { useState, useEffect } from "react";
import { pusherClient } from "@/lib/pusher";
import { useAuth } from "@/app/context/AuthContext";

export default function useLiveNotifications() {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    // 🧩 Fetch current notifications initially
    fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch((err) => console.error("❌ Failed to fetch notifications:", err));

    // 💬 Choose the correct Pusher channel dynamically
    let channelName;
    if (user.userType === "ADMIN") {
      channelName = "admin-channel"; // 🔥 Admins listen here
    } else if (user.userType === "CUSTOMER" && user.customerId) {
      channelName = `customer-${user.customerId}`;
    }

    if (!channelName) return;

    const channel = pusherClient.subscribe(channelName);

    // 🪄 Handle new booking notifications for admins
    channel.bind("new-booking", (data) => {
      const newNotification = {
        id: Date.now().toString(),
        title: "New Pre-booking Created",
        message: `${data.customerName} booked ${data.services.join(", ")}.`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    // 🧩 Handle customer updates (like booking approval)
    channel.bind("booking-status", (data) => {
      const newNotification = {
        id: Date.now().toString(),
        title: data.type === "APPROVED" ? "Booking Approved" : "Booking Update",
        message: data.message,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    });

    // Cleanup on unmount
    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [user, token]);

  return { notifications, setNotifications };
}
