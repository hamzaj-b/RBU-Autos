"use client";
import useAdminNotifications from "@/hooks/useAdminNotifications";
import { useAuth } from "@/app/context/AuthContext";

export default function GlobalNotificationListener() {
  const { user } = useAuth();

  if (user?.userType === "ADMIN") {
    useAdminNotifications();
  }

  return null;
}
