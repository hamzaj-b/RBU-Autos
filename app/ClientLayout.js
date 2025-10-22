"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/shared/Sidebar";
import Header from "./components/shared/Header";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const authRoutes = ["/auth", "/checkout", "/unauthorized", "/403"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const showSidebarAndHeader = !isAuthRoute;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  // Close sidebar on outside click (mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebarAndHeader && (
        <div
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 transform ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 w-64 h-screen bg-white flex flex-col items-center py-6 transition-transform duration-300 z-40`}
        >
          <Sidebar toggleSidebar={toggleSidebar}/>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {showSidebarAndHeader && (
          <Header
            toggleSidebar={toggleSidebar}
            className={`md:pl-[270px] md:w-full`}
          />
        )}

        <main
          className={`flex-1 overflow-y-auto ${
            showSidebarAndHeader ? "md:pl-[260px]" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
