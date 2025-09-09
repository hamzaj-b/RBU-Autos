"use client";

import {
  CalendarDays,
  LayoutDashboard,
  Lightbulb,
  SquareUser,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";

export default function Sidebar() {
  // Define the links and their associated data
  const links = [
    {
      href: "#",
      label: "Dashboard",
      icon: <LayoutDashboard />,
      isActive: true,
    },
    { href: "#", label: "Repair tracker", icon: <Wrench /> },
    { href: "#", label: "Create Work Order", icon: <Users /> },
    { href: "#", label: "Customers", icon: <Users /> },
    { href: "#", label: "Bookings", icon: <CalendarDays /> },
    { href: "#", label: "Diagnostics", icon: <Lightbulb /> },
    { href: "#", label: "Staff Management", icon: <SquareUser /> },
    { href: "#", label: "Marketing", icon: <SquareUser /> },
  ];

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col items-center py-6">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center justify-center">
          <img src="/logo.png" width={100} alt="Logo" />
        </div>
        <h2 className="text-xl font-semibold text-yellow-primary mt-2">
          Lorem <span className="text-black">Ipsum</span>
        </h2>
      </div>
      <nav className="w-full">
        {links.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={`flex items-center px-4 py-3 mx-6 ${
              link.isActive
                ? "bg-yellow-primary text-black font-semibold rounded-lg"
                : "text-gray-600 hover:bg-gray-100 rounded"
            }`}
          >
            <span
              className={`mr-2 ${
                link.isActive ? "text-black" : "text-yellow-primary"
              }`}
            >
              {link.icon}
            </span>{" "}
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
