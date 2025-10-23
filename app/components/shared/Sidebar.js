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
  ChevronLeft,
  LucideBookmarkPlus,
  LucidePencil, // <-- Add the arrow icon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Sidebar({ toggleSidebar }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 🌀 Show loader while context is loading
  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-full text-gray-500"></div>
    );
  }

  const userType = user?.userType; // e.g. "ADMIN", "CUSTOMER", "EMPLOYEE"

  // Define routes for each role
  const linksByRole = {
    ADMIN: [
      { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
      { href: "/repair-tracker", label: "Repair tracker", icon: <Wrench /> },
      { href: "/services", label: "Services", icon: <Settings2 /> },
      { href: "/customers", label: "Customers", icon: <Users /> },
      { href: "/bookings", label: "Walkin Booking", icon: <CalendarDays /> },
      {
        href: "/pending-bookings",
        label: "Pre Booking",
        icon: <LucideBookmarkPlus />,
      },
      { href: "/diagnostics", label: "Diagnostics", icon: <Lightbulb /> },
      {
        href: "/staff-management",
        label: "Staff Management",
        icon: <SquareUser />,
      },
      {
        href: "/manage-booking",
        label: "Manage Booking",
        icon: <LucidePencil />,
      },
      // { href: "/marketing", label: "Marketing", icon: <SquareUser /> },
      { href: "/settings", label: "Settings", icon: <Settings /> },
    ],

    CUSTOMER: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
      {
        href: "/preBooking",
        label: "Request Booking",
        icon: <LucideBookmarkPlus />,
      },
      { href: "/my-bookings", label: "My Bookings ", icon: <CalendarDays /> },
      { href: "/diagnostics", label: "Diagnostics", icon: <Lightbulb /> },
    ],

    EMPLOYEE: [
      { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> },
      {
        href: "/employee/repair-tracker",
        label: "Repair tracker",
        icon: <Wrench />,
      },
      { href: "/work-order", label: "Work Orders", icon: <Users /> },
    ],
  };

  // Select correct links or empty array
  const links = linksByRole[userType] || [];

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* Logo & Branding */}
      <div className="flex flex-col items-center mb-2 md:mb-10">
        <div className="flex items-center justify-center">
          <img src="/rbu-logo.png" width={120} alt="Logo" />
        </div>
        <h2 className="text-xl font-extrabold text-blue-theme md:mt-2">
          RBU <span className="text-black">AUTO INC</span>
        </h2>
      </div>

      {/* Arrow Icon */}
      <div
        className="absolute md:hidden top-4 right-4 cursor-pointer"
        onClick={toggleSidebar}
      >
        <ChevronLeft className="text-blue-theme" size={30} />
      </div>

      {/* Navigation */}
      <nav className="w-full flex-1 overflow-y-auto max-h-screen mb-16">
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
