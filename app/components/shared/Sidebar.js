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
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard /> },
    { href: "/repair-tracker", label: "Repair tracker", icon: <Wrench /> },
    { href: "/work-order", label: "Create Work Order", icon: <Users /> },
    { href: "/customers", label: "Customers", icon: <Users /> },
    { href: "/bookings", label: "Bookings", icon: <CalendarDays /> },
    { href: "/diagnostics", label: "Diagnostics", icon: <Lightbulb /> },
    { href: "/staff-management", label: "Staff Management", icon: <SquareUser /> },
    { href: "/marketing", label: "Marketing", icon: <SquareUser /> },
  ];

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center justify-center">
          <img src="/rbu-logo.png" width={120} alt="Logo" />
        </div>
        <h2 className="text-xl font-extrabold text-yellow-primary mt-2">
          RBU <span className="text-black">AUTO INC</span>
        </h2>
      </div>
      <nav className="w-full">
        {links.map((link, index) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={index}
              href={link.href}
              className={`flex items-center px-4 py-3 mx-6 ${
                isActive
                  ? "bg-yellow-primary text-black font-semibold rounded-lg"
                  : "text-gray-600 hover:bg-gray-100 rounded"
              }`}
            >
              <span
                className={`mr-2 ${
                  isActive ? "text-black" : "text-yellow-primary"
                }`}
              >
                {link.icon}
              </span>{" "}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}