"use client";

import { useAuth } from "@/app/context/AuthContext";
import { showNotification } from "@/lib/showNotification";
import { Bell, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import LogoutDialog from "./LogoutModal";

export default function Header({ toggleSidebar, className = "" }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleProfile = () => {
    window.location.href = "/profile";
  };

  const handleConfirmLogout = async () => {
    try {
      // Clear auth + cookies
      Cookies.remove("authToken");
      Cookies.remove("authUser");
      logout();

      // Redirect manually
      window.location.href = "/auth/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // 🔒 Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🧩 Extract avatar initials
  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  return (
    <>
      <header
        className={`w-full bg-white flex items-center justify-between px-4 md:px-6 py-3 shadow-sm border-b border-gray-100 ${className}`}
      >
        {/* Sidebar Toggle */}
        <button
          className="md:hidden text-gray-700 hover:text-blue-600 transition"
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

        {/* Greeting */}
        <div className="hidden md:flex flex-col ml-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Hi, {user?.fullName || "User"}
          </h2>
          <p className="text-sm text-gray-500">
            Let’s see what’s happening in your garage today 🚗
          </p>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-4">
          {/* Notification */}
          <button
            className="relative p-2 rounded-full hover:bg-gray-100 transition group"
            onClick={() =>
              showNotification({
                title: "New Booking!",
                message: "You have received a new booking 🎉",
                type: "order",
              })
            }
          >
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
          </button>

          {/* Profile Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 !text-white font-semibold shadow-md hover:shadow-lg transition"
              onClick={() => setOpen((prev) => !prev)}
            >
              {initials}
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-52 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 !mb-0">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-gray-500 mt-0">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="flex flex-col py-2">
                    <button
                      onClick={handleProfile}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <User className="w-4 h-4 mr-2 text-blue-500" />
                      Profile
                    </button>

                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <Settings className="w-4 h-4 mr-2 text-blue-500" />
                      Settings
                    </Link>

                    <button
                      onClick={() => setLogoutOpen(true)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-rose-500" />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
      <LogoutDialog
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
