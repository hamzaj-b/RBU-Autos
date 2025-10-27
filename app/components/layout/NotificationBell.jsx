"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, X } from "lucide-react";
import useLiveNotifications from "@/hooks/useLiveNotifications";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const { notifications, setNotifications } = useLiveNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unread = notifications.length;

  // 🧠 Mark as seen — instant remove, async delete
  const handleSeen = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    // Fire and forget API call
    fetch(`/api/notifications/${id}`, { method: "PATCH" }).catch((err) =>
      console.error("❌ Failed to delete notification:", err)
    );
  };

  // 🖱️ Close dropdown on outside click
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 🔔 Bell Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="w-5 h-5 text-gray-700" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* 📬 Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border z-50 max-h-[26rem] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-3 py-2 border-b bg-gray-50 rounded-t-lg">
              <h3 className="text-sm font-semibold text-gray-700">
                Notifications
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center">
                No notifications yet.
              </p>
            ) : (
              notifications.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-start gap-2 p-3 border-b last:border-0 hover:bg-blue-50 transition bg-white"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-600">{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSeen(n.id)}
                    className="ml-2 text-gray-400 hover:text-green-600 transition"
                    title="Mark as seen"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
