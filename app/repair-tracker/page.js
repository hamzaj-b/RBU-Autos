"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  UserPlus,
  Clock,
  Wrench,
} from "lucide-react";
import { Spin, message, Tag, Modal } from "antd";
import Select from "react-select";
import { useAuth } from "@/app/context/AuthContext";
import ConfirmDialog from "@/app/components/shared/ConfirmModal";

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
  const [assignModal, setAssignModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const { token, logout } = useAuth();

  // 🔄 Debounce Search
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

  // 📋 Fetch employees
  const fetchEmployees = async () => {
    if (!token) return; // <-- Prevent premature API call
    try {
      const res = await fetch("/api/auth/admin/employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEmployees(
        data.employees?.map((e) => ({ label: e.fullName, value: e.id })) || []
      );
    } catch (err) {
      console.error("Employee fetch error:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchWorkOrders();
      fetchEmployees();
    }
  }, [token, fetchWorkOrders]);

  // 🧰 Action APIs
  const handleAssign = async (woId) => {
    if (!selectedEmp) return message.warning("Select an employee first!");
    setAssigning(true);
    try {
      const res = await fetch(`/api/workOrders/${woId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId: selectedEmp.value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Employee assigned successfully!");
      fetchWorkOrders();
      setAssignModal(false);
      setSelectedEmp(null);
    } catch (err) {
      message.error(err.message || "Failed to assign employee");
    } finally {
      setAssigning(false);
    }
  };

  const handleMarkDone = async (woId) => {
    try {
      const res = await fetch(`/api/workOrders/${woId}/completed`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Work order marked as completed!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to mark complete");
    }
  };

  const handleCancel = async (woId) => {
    try {
      const res = await fetch(`/api/workOrders/${woId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Work order cancelled.");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to cancel work order");
    }
  };

  // 🏷️ Status Tag
  const getStatusTag = (status) => {
    const colorMap = {
      OPEN: "bg-blue-100 text-blue-700",
      ASSIGNED: "bg-amber-100 text-amber-700",
      IN_PROGRESS: "bg-indigo-100 text-indigo-700",
      DONE: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-rose-100 text-rose-700",
    };
    return (
      <Tag className={`${colorMap[status]} px-2 py-0.5 text-xs font-semibold`}>
        {status}
      </Tag>
    );
  };

  return (
    <div className="container mx-auto p-6 text-black space-y-6">
      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or service..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {[
              "all",
              "OPEN",
              "ASSIGNED",
              "IN_PROGRESS",
              "DONE",
              "CANCELLED",
            ].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                  statusFilter === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all"
                  ? "All"
                  : status.replace("_", " ").toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 Work Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : workOrders.length === 0 ? (
          <p className="text-center text-gray-400 py-10">
            No work orders found.
          </p>
        ) : (
          workOrders.map((wo) => (
            <div
              key={wo.id}
              className="flex justify-between items-center p-4 hover:bg-gray-50 transition-all"
            >
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  {wo.services?.join(", ") || wo.serviceName}
                </h3>
                <p className="text-sm text-gray-500">
                  👤 {wo.customerName} • 👷 {wo.employeeName || "Unassigned"}
                </p>
                <div className="mt-1">{getStatusTag(wo.status)}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedWO(wo);
                    setViewModal(true);
                  }}
                  className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                >
                  <Eye className="inline w-4 h-4 mr-1" /> View
                </button>

                {wo.status === "OPEN" && (
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      setAssignModal(true);
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    <UserPlus className="inline w-4 h-4 mr-1" /> Assign
                  </button>
                )}

                {wo.status === "ASSIGNED" && (
                  <button
                    onClick={() => handleMarkDone(wo.id)}
                    className="px-3 py-1 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1" /> Complete
                  </button>
                )}

                {wo.status !== "DONE" && wo.status !== "CANCELLED" && (
                  <button
                    onClick={() => handleCancel(wo.id)}
                    className="px-3 py-1 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-700 font-medium"
                  >
                    <XCircle className="inline w-4 h-4 mr-1" /> Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🔍 View Modal */}
      <Modal
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        centered
        width={600}
        title={
          <div className="text-lg font-semibold text-gray-800">
            Work Order Details
          </div>
        }
      >
        {selectedWO && (
          <div className="space-y-3 text-sm text-gray-700">
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
              <strong>Services:</strong> {selectedWO.services?.join(", ")}
            </p>
            <p>
              <strong>Notes:</strong> {selectedWO.notes || "—"}
            </p>
          </div>
        )}
      </Modal>

      {/* 👷 Assign Modal */}
      <Modal
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        footer={null}
        centered
        title={
          <div className="text-lg font-semibold text-gray-800">
            Assign Employee
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            options={employees}
            value={selectedEmp}
            onChange={setSelectedEmp}
            placeholder="Select an employee..."
          />
          <button
            onClick={() => handleAssign(selectedWO.id)}
            disabled={assigning}
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {assigning ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
