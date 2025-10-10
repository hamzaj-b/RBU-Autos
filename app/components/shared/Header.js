"use client";

import { useAuth } from "@/app/context/AuthContext";
import { showNotification } from "@/lib/showNotification";
import { Bell, User, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function Header({ toggleSidebar, className = "" }) {
  const { user, logout, token } = useAuth();
  const [open, setOpen] = useState(false);

  const handleProfile = () => {
    // Navigate to profile page
    window.location.href = "/profile"; // or use Next.js router
  };

  const handleLogout = () => {
    logout(); // Clear token, session, etc.
    window.location.href = "/auth/login";
  };

  return (
    <div
      className={`w-full bg-white flex items-center px-4 md:px-6 py-4 ${className} relative`}
    >
      {/* Sidebar Toggle */}
      <div>
        <button
          className="md:hidden text-black rounded"
          onClick={toggleSidebar}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>

      {/* Greeting */}
      <div className="hidden md:flex md:flex-1 flex-col ml-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Hi, {user?.fullName || "User"}
        </h2>
        <p className="text-sm text-gray-500">Let's check your Garage today</p>
      </div>

      {/* Right Section */}
      <div className="flex-1 flex items-center justify-end space-x-4 relative">
        {/* Notifications */}
        <button
          className="relative text-gray-600 hover:text-gray-800"
          onClick={() =>
            showNotification({
              title: "New Booking!",
              message: "You have received a new booking 🎉",
              type: "order",
            })
          }
        >
          <Bell className="text-xl" />
          <span className="absolute w-2 h-2 bg-red-500 rounded-full top-0 left-4"></span>
        </button>

        {/* Profile Avatar */}
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm cursor-pointer">
            {user?.userType
              ?.split(" ")
              .map((n) => n[0]?.toUpperCase())
              .join("")
              .slice(0, 2)}
          </div>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={handleProfile}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
