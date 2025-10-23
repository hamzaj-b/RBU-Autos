"use client";
import { useAuth } from "@/app/context/AuthContext";
import useAdminNotifications from "@/hooks/useAdminNotifications";
import useCustomerNotifications from "@/hooks/useCustomerNotifications";

export default function GlobalNotificationListener() {
  const auth = useAuth();
  if (!auth || !auth.user) return null;
  const { user } = auth;

  if (user.userType === "ADMIN") {
    useAdminNotifications();
  }

  if (user.userType === "CUSTOMER") {
    useCustomerNotifications();
  }

  return null;
}
