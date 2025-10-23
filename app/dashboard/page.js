"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Spin } from "antd";
import EmployeeDashboard from "@/app/components/app/EmployeeDashboard";
import CustomerDashboard from "@/app/components/app/CustomersDashboard";

export default function DashboardPage() {
  const { user, loading } = useAuth();

//   console.log("🏠 Rendering DashboardPage for user:", user.customerId);

  // 🕒 Show loader while auth is being resolved or user is missing
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  // ✅ Render dashboard based on userType
  switch (user.userType) {
    case "EMPLOYEE":
      return <EmployeeDashboard />;

    case "CUSTOMER":
      return <CustomerDashboard />;

    default:
      // 🧩 Optional fallback for unhandled roles
      return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 text-gray-600">
          <p className="text-lg font-medium">
            No dashboard available for user type:{" "}
            <b>{user.userType || "Unknown"}</b>
          </p>
        </div>
      );
  }
}
