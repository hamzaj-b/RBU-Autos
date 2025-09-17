"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./components/shared/Sidebar";
import Header from "./components/shared/Header";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const [isAuthRoute, setIsAuthRoute] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    setIsAuthRoute(pathname.startsWith("/auth"));
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {!isAuthRoute && (
        <>
          <div
            ref={sidebarRef}
            className={`fixed inset-y-0 left-0 transform ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 w-64 h-screen bg-white shadow-lg flex flex-col items-center py-6 transition-transform duration-300 z-40`}
          >
            <Sidebar />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col">
        {!isAuthRoute && (
          <Header toggleSidebar={toggleSidebar} className={`md:ml-auto md:w-full ${isSidebarOpen ? "block" : "w-full"}`} />
        )}
        <main className="flex-1 overflow-y-auto md:w-5/6 md:ml-auto">{children}</main>
      </div>
    </div>
  );
}