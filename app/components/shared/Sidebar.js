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
import { usePathname } from "next/navigation"; // Import usePathname

export default function Sidebar() {
  // Get the current pathname
  const pathname = usePathname();

  // Define the links and their associated data
  const links = [
    {
      href: "/", // Adjusted href to be an actual route
      label: "Dashboard",
      icon: <LayoutDashboard />,
    },
    {
      href: "/repair-tracker", // Adjusted href to be an actual route
      label: "Repair tracker",
      icon: <Wrench />,
    },
    {
      href: "/work-order", // Adjusted href to be an actual route
      label: "Create Work Order",
      icon: <Users />,
    },
    {
      href: "/customers",
      label: "Customers",
      icon: <Users />,
    },
    {
      href: "/bookings", // Adjusted href to be an actual route
      label: "Bookings",
      icon: <CalendarDays />,
    },
    {
      href: "/diagnostics", // Adjusted href to be an actual route
      label: "Diagnostics",
      icon: <Lightbulb />,
    },
    {
      href: "/staff-management", // Adjusted href to be an actual route
      label: "Staff Management",
      icon: <SquareUser />,
    },
    {
      href: "/marketing", // Adjusted href to be an actual route
      label: "Marketing",
      icon: <SquareUser />,
    },
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
        {links.map((link, index) => {
          const isActive = pathname === link.href; // Check if the current route matches the link href

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
