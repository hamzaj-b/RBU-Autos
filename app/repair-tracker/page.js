"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import RecentWorkOrder from "../components/RecentWorkOrder";
import { useAuth } from "@/app/context/AuthContext";

export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user, token, logout } = useAuth();
  console.log("Token is", token);

  // 🧠 Fetch WorkOrders API call
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page,
        limit: 10,
        search: searchTerm,
        sortOrder: "desc",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/workOrders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch work orders");

      setWorkOrders(data.workOrders || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error("Error fetching work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when filters/search/page change
  useEffect(() => {
    fetchWorkOrders();
  }, [searchTerm, statusFilter, dateFrom, dateTo, page]);

  return (
    <div className="container min-h-screen mx-auto p-6 text-black">
      {/* 🔍 Search + Filters */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex space-x-4 mb-4">
          {/* Search */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search work order / customer"
              className="w-full px-14 py-2 md:py-4 rounded-lg bg-gray-100 text-sm md:text-base focus:outline-none focus:border focus:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2 md:top-4 text-gray-500">
              <Search />
            </span>
          </div>

          <button
            onClick={fetchWorkOrders}
            className="md:py-2 px-2 md:px-4 rounded-lg bg-gray-100 flex items-center text-gray-500"
          >
            <SlidersHorizontal className="w-4" />
            <span className="hidden md:block px-2">Refresh</span>
          </button>
        </div>

        {/* Filter Buttons + Date Range */}
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div className="flex space-x-3">
            {[
              { label: "All", value: "all" },
              { label: "Open", value: "OPEN" },
              { label: "Assigned", value: "ASSIGNED" },
              { label: "In Progress", value: "IN_PROGRESS" },
              { label: "Completed", value: "DONE" },
              { label: "Cancelled", value: "CANCELLED" },
            ].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`py-1 px-4 md:py-2 rounded-full text-sm md:text-base font-medium ${
                  statusFilter === btn.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Date Filters */}
          <div className="flex space-x-3">
            <input
              type="date"
              className="p-2 rounded-lg border border-gray-300"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              type="date"
              className="p-2 rounded-lg border border-gray-300"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 📋 Work Order List */}
      <div className="bg-white p-2 rounded-lg">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No work orders found.
          </div>
        ) : (
          <RecentWorkOrder
            data={workOrders.map((wo) => ({
              id: wo.id,
              customer: wo.customerName || "Unknown",
              image: "/user1.png",
              orderDate:
                wo.bookingTime?.split(" - ")[0] ||
                new Date(wo.createdAt).toLocaleDateString(),
              orderTime: wo.bookingTime?.split(" - ")[1] || "",
              status: wo.status,
            }))}
            containerWidth="w-full"
          />
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 rounded-md ${
              page === i + 1
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
