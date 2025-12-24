"use client";

import { useAuth } from "@/app/context/AuthContext";
import useAdminNotifications from "@/hooks/useAdminNotifications";
import useCustomerNotifications from "@/hooks/useCustomerNotifications";

export default function GlobalNotificationListener() {
  const { user } = useAuth();

  // ✅ Always call both hooks to preserve hook order
  const adminNotifications = useAdminNotifications();
  const customerNotifications = useCustomerNotifications();

  // ✅ No conditional hook calls, only conditional effects or logic
  if (!user) return null;

  // Hooks already handle their own roles internally (they can early-return safely)
  // Optionally, you can choose which one to react to:
  if (user.userType === "ADMIN") {
    adminNotifications?.start?.(); // if your hook has a start/subscribe method
  }

  if (user.userType === "CUSTOMER") {
    customerNotifications?.start?.();
  }

  return null;
}
