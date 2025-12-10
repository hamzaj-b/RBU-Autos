"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, PlayCircle, CheckCircle, Printer } from "lucide-react";
import { Spin, message, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { ChevronDown } from "lucide-react";

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

  const [viewModal, setViewModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);

  const [loadingIds, setLoadingIds] = useState(new Set());
  const [isOpen, setIsOpen] = useState(false);

  // NEW FOR NOTE MODAL
  const [doneModal, setDoneModal] = useState(false);
  const [doneNote, setDoneNote] = useState("");
  const [pendingDoneWO, setPendingDoneWO] = useState(null);

  const { token, logout } = useAuth();
  const router = useRouter();

  const statuses = [
    "all",
    "OPEN",
    "ASSIGNED",
    "IN_PROGRESS",
    "DONE",
    "COMPLETED",
    "CANCELLED",
  ];

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const minutesToHoursString = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // Fetch Data
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
     console.log("workorder data " , data.workOrders);
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

  const formatDateTime = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // START WORK
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
      toast.error("Network error.");
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

  // -----------------------------
  // NEW — OPEN NOTE DIALOG FIRST
  // -----------------------------
  const handleMarkDoneOpen = (item) => {
    setPendingDoneWO(item);
    setDoneNote("");
    setDoneModal(true);
  };

  // -----------------------------
  // SUBMIT DONE WITH NOTE
  // -----------------------------
  const handleMarkDone = async () => {
    if (!pendingDoneWO) return;

    const item = pendingDoneWO;

    setLoadingIds((prev) => new Set([...prev, item.id]));
    try {
      const res = await fetch(`/api/workOrders/${item.id}/mark-as-done`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          note: doneNote || "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("✅ Work order marked as done!");
        fetchWorkOrders();
        setDoneModal(false);
      } else toast.error(data.error || "Failed to mark as done");
    } catch (err) {
      toast.error("Network error.");
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(item.id);
        return s;
      });
    }
  };

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
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}
      >
        {status}
      </span>
    );
  };

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
                ? "bg-blue-theme text-white"
                : "bg-gray-100 hover:bg-gray-200"
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
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg mb-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-4/5 ">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search…"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <div className="w-full md:w-1/5 flex justify-end items-end">
            <div className="relative w-full">
              <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="w-full flex justify-between items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <span>{statusFilter === "all" ? "All" : statusFilter}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                  {statuses.map((s) => (
                    <div
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setIsOpen(false);
                      }}
                      className={`px-3 py-2 text-sm cursor-pointer ${
                        s === statusFilter
                          ? "bg-blue-theme text-white"
                          : "hover:bg-blue-50"
                      }`}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Work Orders */}
      <div className="bg-white rounded-lg shadow-sm border p-3">
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
                className="flex justify-between items-center border-b py-3 px-3 hover:bg-gray-50"
              >
                <div className="flex items-start gap-2 ">
                  <div className="w-[55px]">
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-lg shadow-sm">
                      {wo.customerName
                        .split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold">{wo.services?.join(", ")}</h3>
                    <p className="text-sm text-gray-500">
                      {wo.customerName} •{" "}
                      {minutesToHoursString(wo.raw.booking.slotMinutes)}
                    </p>

                    <div className="flex items-center gap-3">
                      {getStatusTag(wo.status)}

                      {!["OPEN", "ASSIGNED"].includes(wo.status) && (
                        <span className="text-xs text-gray-500">
                          Start: {formatDateTime(wo.openedAt)}
                        </span>
                      )}

                      {!["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(
                        wo.status
                      ) && (
                        <span className="text-xs text-gray-500">
                          End: {formatDateTime(wo.closedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* VIEW */}
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      setViewModal(true);
                    }}
                    className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    <Eye className="inline w-4 h-4 mr-1" />
                    View
                  </button>

                  {/* START */}
                  {wo.status === "ASSIGNED" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleStart(wo)}
                      className={`px-3 py-2 text-xs rounded-md text-white ${
                        isLoading
                          ? "bg-gray-400"
                          : "bg-blue-theme hover:bg-blue-bold"
                      }`}
                    >
                      {isLoading ? "Starting…" : "Start"}
                    </button>
                  )}

                  {/* DONE → OPEN NOTE MODAL */}
                  {wo.status === "IN_PROGRESS" && (
                    <button
                      disabled={isLoading}
                      onClick={() => handleMarkDoneOpen(wo)}
                      className={`px-3 py-2 text-xs rounded-md !text-white ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {isLoading ? "Marking…" : "Mark as Done"}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {renderPagination()}

      {/* DONE NOTE MODAL */}
      <Modal
        open={doneModal}
        onCancel={() => setDoneModal(false)}
        footer={null}
        centered
        title={<div className="text-lg font-semibold">Add Note (Optional)</div>}
      >
        <div className="space-y-4">
          <textarea
            className="w-full border rounded-lg p-2 text-sm"
            placeholder="Write a note about the work done… (optional)"
            rows={4}
            value={doneNote}
            onChange={(e) => setDoneNote(e.target.value)}
          ></textarea>

          <button
            onClick={handleMarkDone}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-md font-medium"
          >
            Confirm Done
          </button>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        centered
        title={<div className="text-lg font-semibold">Work Order Details</div>}
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
              <strong>Vehicle:</strong>{" "}
              {selectedWO.raw.customer.vehicleJson.make} •{" "}
              {selectedWO.raw.customer.vehicleJson.model} •{" "}
              {selectedWO.raw.customer.vehicleJson.variant}
            </p>
            <p>
              <strong>Total Time:</strong>{" "}
              {minutesToHoursString(selectedWO.raw.booking.slotMinutes)}
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
