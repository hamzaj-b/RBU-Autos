"use client";

import Sidebar from "../shared/Sidebar";
import Header from "../shared/Header";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  // Compute directly if this is an auth route or a print route
  const isAuthRoute = pathname.startsWith("/auth");

  // Conditionally render sidebar/header
  const showSidebarAndHeader = !isAuthRoute;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {showSidebarAndHeader && (
        <div className="w-64">
          <Sidebar />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        {showSidebarAndHeader && <Header />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
