"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, PlayCircle, CheckCircle, Printer } from "lucide-react";
import { Spin, message, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";

export default function EmployeeRepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedWO, setSelectedWO] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [loadingIds, setLoadingIds] = useState(new Set());

  const { token, logout } = useAuth();
  const router = useRouter();

  // 🔄 Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // 📦 Fetch WorkOrders
  const fetchWorkOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        sortOrder: "desc",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/workOrders?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        message.error("Session expired. Please log in again.");
        logout();
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWorkOrders(data.workOrders || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, page, limit, token]);

  useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  // 🚀 Start WorkOrder
  const handleStart = async (item) => {
    setLoadingIds((prev) => new Set([...prev, item.id]));
    try {
      const res = await fetch(`/api/workOrders/${item.id}/employee/start`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("🚀 Work started!"); 
        fetchWorkOrders();
      } else toast.error(data.error || "Failed to start work order"); 
    } catch (err) {
      console.error("Start error:", err);
      toast.error("Network error."); 
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

  // // ✅ Mark as Done
  const handleMarkDone = async (item) => {
    setLoadingIds((prev) => new Set([...prev, item.id]));
    try {
      const res = await fetch(`/api/workOrders/${item.id}/mark-as-done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: "Marked as done by employee" }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Work order marked as done!");
        fetchWorkOrders();
      } else toast.error(data.error || "Failed to mark as done"); 
    } catch (err) {
      console.error("Done error:", err);
      toast.error("Network error."); 
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };



  // 🖨️ Print Invoice (for completed workOrders)
  const handlePrint = (item) => {
    window.open(`/employee/workOrders/${item.id}/invoice`, "_blank");
  };

  // 🏷️ Status Tag
  const getStatusTag = (status) => {
    const colorMap = {
      OPEN: "bg-blue-100 text-blue-700",
      ASSIGNED: "bg-amber-100 text-amber-700",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
      DONE: "bg-emerald-100 text-emerald-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-rose-100 text-rose-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          colorMap[status] || "bg-gray-100 text-gray-700"
        }`}
      >
        {status}
      </span>
    );
  };

  // 📖 Pagination
  const renderPagination = () => (
    <div className="flex flex-wrap justify-between items-center mt-6">
      <div className="flex items-center space-x-2 text-sm">
        <span>Show:</span>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-300 rounded-md px-2 py-1"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex space-x-1">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 text-sm rounded-md ${
              page === i + 1
                ? "bg-blue-theme !text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 text-black">
      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-lg mb-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 ">
          <Search
            className="absolute left-3 top-2 md:top-3 text-gray-400"
            size={18}
          />
            <input
              type="text"
              placeholder="Search by customer or service..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg  focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="hidden md:flex gap-2 flex-wrap">
            {[
              "all",
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "DONE",
              "COMPLETED",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  statusFilter === status
                    ? "bg-blue-theme !text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.replace("_", " ").toLowerCase()}
              </button>
            ))}
          </div>
          <div className=" md:hidden w-full flex flex-col gap-2 flex-wrap justify-end ">
          {/* Dropdown for small screens */}
          <div className="md:hidden">
            <select
              onChange={(e) => setStatusFilter(e.target.value)}
              value={statusFilter}
              className="px-2 py-1 text-xs md:text-sm rounded-lg font-medium bg-white border border-gray-300 hover:bg-gray-200 focus:ring-0 focus:border-blue-500 focus:outline-none transition-colors duration-200"
            >
              {[
                "all",
                "OPEN",
                "ASSIGNED",
                "IN_PROGRESS",
                "DONE",
                "COMPLETED",
                "CANCELLED",
              ].map((s) => (
                <option
                  key={s}
                  value={s}
                  className={`${
                    statusFilter === s
                      ? "bg-blue-bold text-white"
                      : "text-gray-500"
                  }`}
                >
                  {s === "all" ? "All" : s.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>
      </div>

      {/* 📋 Work Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : workOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            No work orders found
          </p>
        ) : (
          workOrders.map((wo) => {
            const isLoading = loadingIds.has(wo.id);
            return (
              <div
                key={wo.id}
                className="flex justify-between items-center border-b py-3 px-3 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-800">
                    {wo.services?.join(", ") || "—"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {wo.customerName} • {wo.employeeName || "Unassigned"}
                  </p>
                  <div className="mt-1">{getStatusTag(wo.status)}</div>
                </div>

                <div className="flex gap-2 items-center">
                  {/* View */}
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      setViewModal(true);
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    <Eye className="inline w-4 h-4 mr-1" />
                   <span className="hidden md:block">View</span>
                  </button>

                  {/* Start */}
                  {wo.status === "ASSIGNED" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleStart(wo)}
                      className={`px-3 py-2 text-xs rounded-md !text-white ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-theme hover:bg-blue-bold"
                      }`}
                    >
                      {isLoading ? "Starting..." : "Start"}
                    </button>
                  )}

                  {/* Mark as Done */}
                  {wo.status === "IN_PROGRESS" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleMarkDone(wo)}
                      className={`px-3 py-2 text-xs rounded-md !text-white ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {isLoading ? "Marking..." : "Mark as Done"}
                    </button>
                  )}

                  {/* Print */}
                  {wo.status === "COMPLETED" && (
                    <div
                      onClick={() => handlePrint(wo)}
                      className="text-xs bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 
                                 p-2 rounded-lg hover:scale-105 transition-transform duration-500 
                                 text-white italic flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Printer size={15} /> Print
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {renderPagination()}

      {/* 👁️ View Modal */}
      <Modal
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        centered
        title={
          <div className="text-lg font-semibold text-gray-800">
            Work Order Details
          </div>
        }
      >
        {selectedWO && (
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Customer:</strong> {selectedWO.customerName}
            </p>
            <p>
              <strong>Employee:</strong>{" "}
              {selectedWO.employeeName || "Unassigned"}
            </p>
            <p>
              <strong>Status:</strong> {getStatusTag(selectedWO.status)}
            </p>
            <p>
              <strong>Booking Time:</strong> {selectedWO.bookingTime || "—"}
            </p>
            {selectedWO.notes && (
              <p>
                <strong>Notes:</strong> {selectedWO.notes}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
