"use client";

import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { usePathname } from "next/navigation"; // Correct import

export default function ClientLayout({ children }) {
  const pathname = usePathname(); // Get current path using usePathname
  const [isAuthRoute, setIsAuthRoute] = useState(false);

  useEffect(() => {
    // Update the state based on the current route
    setIsAuthRoute(pathname.startsWith("/auth"));
  }, [pathname]); // Update on pathname change

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Conditionally render Sidebar and Header only if not on /auth routes */}
      {!isAuthRoute && (
        <div className="w-64">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Conditionally render Header only if not on /auth routes */}
        {!isAuthRoute && <Header />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
