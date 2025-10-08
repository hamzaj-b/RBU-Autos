"use client";

import React from "react";
import {
  CalendarDays,
  LayoutDashboard,
  Lightbulb,
  Settings,
  Settings2,
  SquareUser,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 🌀 Show loader while context is loading
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500"></div>
    );
  }

  const userType = user?.userType; // e.g. "ADMIN", "CUSTOMER", "EMPLOYEE"
  console.log("Sidebar userType:", userType);

  // Define routes for each role
  const linksByRole = {
    ADMIN: [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
      { href: "/repair-tracker", label: "Repair tracker", icon: <Wrench /> },
      { href: "/services", label: "Services", icon: <Settings2 /> },
      { href: "/customers", label: "Customers", icon: <Users /> },
      { href: "/bookings", label: "Create Booking", icon: <CalendarDays /> },
      { href: "/diagnostics", label: "Diagnostics", icon: <Lightbulb /> },
      {
        href: "/staff-management",
        label: "Staff Management",
        icon: <SquareUser />,
      },
      { href: "/marketing", label: "Marketing", icon: <SquareUser /> },
      { href: "/settings", label: "Settings", icon: <Settings /> },
    ],

    CUSTOMER: [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
      { href: "/bookings", label: "Create Booking", icon: <CalendarDays /> },
      { href: "/diagnostics", label: "Diagnostics", icon: <Lightbulb /> },
    ],

    EMPLOYEE: [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
      // { href: "/work-order", label: "Create Work Order", icon: <Users /> },
      { href: "/repair-tracker", label: "Repair tracker", icon: <Wrench /> },
      { href: "/work-order", label: "Work Orders", icon: <Users /> },
    ],
  };

  // Select correct links or empty array
  const links = linksByRole[userType] || [];

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center justify-center">
          <img src="/rbu-logo.png" width={120} alt="Logo" />
        </div>
        <h2 className="text-xl font-extrabold text-blue-theme mt-2">
          RBU <span className="text-black">AUTO INC</span>
        </h2>
      </div>

      {/* Navigation */}
      <nav className="w-full">
        {links.map((link, index) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={index}
              href={link.href}
              className={`flex items-center px-4 py-3 mx-6 ${
                isActive
                  ? "bg-blue-theme text-white font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-gray-100 rounded"
              }`}
            >
              <span
                className={`mr-2 ${
                  isActive ? "text-white" : "text-blue-theme"
                }`}
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
