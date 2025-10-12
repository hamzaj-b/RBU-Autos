"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, PlayCircle, CheckCircle, UserPlus } from "lucide-react";
import { Spin, message, Modal } from "antd";
import { useAuth } from "@/app/context/AuthContext";

export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedWO, setSelectedWO] = useState(null);
  const [viewModal, setViewModal] = useState(false);
  const [loadingIds, setLoadingIds] = useState(new Set());

  const { token, logout } = useAuth();

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

  // ✅ Assign Employee (for Admin)
  const handleAssign = async (woId, empId) => {
    try {
      const res = await fetch(`/api/workOrders/${woId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId: empId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Employee assigned successfully!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to assign employee");
    }
  };

  // 🚀 Start WorkOrder
  const handleStart = async (item) => {
    if (!token) return message.error("Unauthorized: Please log in first");

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
        message.success("🚀 Work started!");
        fetchWorkOrders();
      } else message.error(data.error || "Failed to start work order");
    } catch (err) {
      console.error("Start error:", err);
      message.error("Network error.");
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

  // ✅ Complete WorkOrder
  const handleComplete = async (item) => {
    if (!token) return message.error("Unauthorized: Please log in first");

    setLoadingIds((prev) => new Set([...prev, item.id]));
    try {
      const res = await fetch(`/api/workOrders/${item.id}/completed`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: "Completed by employee" }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success("✅ Work order marked as completed!");
        fetchWorkOrders();
      } else message.error(data.error || "Failed to complete work order");
    } catch (err) {
      console.error("Complete error:", err);
      message.error("Network error.");
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

  // 🏷️ Status Tag Colors
  const getStatusTag = (status) => {
    const colorMap = {
      OPEN: "bg-blue-100 text-blue-700",
      ASSIGNED: "bg-amber-100 text-amber-700",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
      DONE: "bg-emerald-100 text-emerald-700",
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

  // 🧭 Pagination
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
                ? "bg-blue-600 text-white"
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
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or service..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {["all", "OPEN", "ASSIGNED", "IN_PROGRESS", "DONE", "CANCELLED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : status.replace("_", " ").toLowerCase()}
                </button>
              )
            )}
          </div>

          {/* Date Range */}
          <div className="flex space-x-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="p-2 border border-gray-300 rounded-md text-sm"
            />
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
          <p className="text-center text-gray-400 py-10">No work orders found</p>
        ) : (
          workOrders.map((wo) => {
            const isLoading = loadingIds.has(wo.id);
            return (
              <div
                key={wo.id}
                className="flex justify-between items-center border-b py-3 px-3 hover:bg-gray-50 transition"
              >
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-800">{wo.serviceName}</p>
                  <p className="text-xs text-gray-500">
                    {wo.customerName} • {wo.employeeName || "Unassigned"}
                  </p>
                  <div className="mt-1">{getStatusTag(wo.status)}</div>
                </div>

                <div className="flex gap-2">
                  {/* 👁️ View */}
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      setViewModal(true);
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                  >
                    <Eye className="inline w-4 h-4 mr-1" />
                    View
                  </button>

                  {/* ▶️ Start */}
                  {wo.status === "ASSIGNED" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleStart(wo)}
                     className={`px-3 py-2 text-xs rounded-md !text-white ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-theme hover:bg-blue-bold"
                      }`} >
                      {isLoading ? "Starting..." : "Start"}
                    </button>
                  )}

                  {/* ✅ Complete */}
                  {wo.status === "IN_PROGRESS" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleComplete(wo)}
                      className={`px-3 py-2 text-xs rounded-md !text-white ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-theme hover:bg-blue-bold"
                      }`}
                    >
                      {isLoading ? "Completing..." : "Mark As Done"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {renderPagination()}

      {/* 👁️ Modal */}
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
              <strong>Service:</strong> {selectedWO.serviceName}
            </p>
            <p>
              <strong>Customer:</strong> {selectedWO.customerName}
            </p>
            <p>
              <strong>Employee:</strong>{" "}
              {selectedWO.employeeName || "Not assigned"}
            </p>
            <p>
              <strong>Status:</strong> {getStatusTag(selectedWO.status)}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(selectedWO.createdAt).toLocaleString()}
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
