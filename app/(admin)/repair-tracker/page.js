"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Wrench,
  Printer,
  Car,
  User,
  DollarSign,
  ClockFading,
  ChevronDown,
} from "lucide-react";
import { Spin, message, Tag, Modal } from "antd";
import Select from "react-select";
import { useAuth } from "@/app/context/AuthContext";
import ConfirmDialog from "@/app/components/shared/ConfirmModal";
import CheckoutSection from "@/app/components/app/CheckoutSection";
import { Button } from "@/components/ui/button";

// ========================================================================
//   REPAIR TRACKER PAGE
// ========================================================================
export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workOrders, setWorkOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination → backend uses limit not pageSize
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // 🔥 uses backend naming
  const [total, setTotal] = useState(0);

  // Modal states
  const [assignModal, setAssignModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [isReassign, setIsReassign] = useState(false);

  const [completeModal, setCompleteModal] = useState(false);
  const [laborEntries, setLaborEntries] = useState([]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [cancelDialog, setCancelDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { token, logout } = useAuth();

  // ========================================================================
  //   SEARCH DEBOUNCE
  // ========================================================================
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // ========================================================================
  //   FETCH WORK ORDERS (with pagination)
  // ========================================================================
  const fetchWorkOrders = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: debouncedSearch,
        sortOrder: "desc",
        page,
        limit, // 🔥 backend expects "limit"
      });

      if (statusFilter !== "all") params.append("status", statusFilter);

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
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, page, limit, token]);

  useEffect(() => {
    if (token) fetchWorkOrders();
  }, [token, fetchWorkOrders]);

  // ========================================================================
  //   FETCH EMPLOYEES
  // ========================================================================
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/auth/admin/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        setEmployees(
          data.employees?.map((e) => ({
            label: e.fullName,
            value: e.id,
          })) || []
        );
      } catch (err) {
        console.error("Employee fetch error:", err);
      }
    })();
  }, [token]);

  // ========================================================================
  //   ASSIGN EMPLOYEE
  // ========================================================================
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
      setAssignModal(false);
      setSelectedEmp(null);
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to assign employee");
    } finally {
      setAssigning(false);
    }
  };

  // ========================================================================
  //   RE-ASSIGN EMPLOYEE
  // ========================================================================
  const handleReassign = async (woId) => {
    if (!selectedEmp) return message.warning("Select an employee first!");
    setAssigning(true);

    try {
      const res = await fetch(`/api/workOrders/${woId}/reassign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employeeId: selectedEmp.value }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("Employee re-assigned successfully!");
      setAssignModal(false);
      setSelectedEmp(null);
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to reassign employee");
    } finally {
      setAssigning(false);
    }
  };

  // ========================================================================
  //   MARK AS DONE
  // ========================================================================
  const handleMarkAsDone = async (wo) => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/workOrders/${wo.id}/mark-as-done`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("Work order marked as DONE!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to mark as done");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================================
  //   COMPLETE WORK ORDER
  // ========================================================================
  const handleComplete = (wo) => {
    if (wo.status !== "DONE") {
      return message.warning("Work order must be DONE to complete.");
    }

    setSelectedWO(wo);
    setLaborEntries([]);
    setPartsUsed([]);
    setCompleteModal(true);
  };

  const submitCompletion = async () => {
    try {
      setSubmitting(true);

      const res = await fetch(`/api/workOrders/${selectedWO.id}/completed`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ laborEntries, partsUsed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("Work order completed!");
      setCompleteModal(false);
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to complete");
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================================================
  //   CANCEL WORK ORDER
  // ========================================================================
  const handleCancel = (wo) => {
    setSelectedWO(wo);
    setCancelDialog(true);
  };

  const confirmCancel = async () => {
    try {
      const res = await fetch(`/api/workOrders/${selectedWO.id}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("Cancelled successfully!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message);
    } finally {
      setCancelDialog(false);
    }
  };

  // ========================================================================
  //   STATUS TAG
  // ========================================================================
  const getStatusTag = (status) => {
    const map = {
      OPEN: "blue",
      ASSIGNED: "gold",
      IN_PROGRESS: "purple",
      DONE: "green",
      COMPLETED: "cyan",
      CANCELLED: "red",
    };
    return <Tag color={map[status] || "default"}>{status}</Tag>;
  };

  // Pagination helpers
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  // ========================================================================
  //   VIEW
  // ========================================================================
  return (
    <div className="container mx-auto p-6 space-y-6 text-gray-900">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg mb-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:w-4/5">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer or service..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-lg"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <div className="w-full md:w-1/5">
            <Button
              onClick={() => setIsOpen((p) => !p)}
              className="w-full flex justify-between items-center px-3 py-2 bg-white hover:bg-gray-100 border rounded-lg"
            >
              <span>{statusFilter === "all" ? "All" : statusFilter}</span>
              <ChevronDown
                className={`w-4 h-4 transition ${isOpen ? "rotate-180" : ""}`}
              />
            </Button>

            {isOpen && (
              <div className="absolute mt-1 w-fit bg-white border rounded-lg shadow">
                {[
                  "All",
                  "OPEN",
                  "ASSIGNED",
                  "IN_PROGRESS",
                  "DONE",
                  "COMPLETED",
                  "CANCELLED",
                ].map((s) => (
                  <div
                    key={s}
                    className={`px-3 py-2 text-sm cursor-pointer ${
                      s === statusFilter
                        ? "bg-blue-theme text-white"
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => {
                      setStatusFilter(s);
                      setPage(1);
                      setIsOpen(false);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PAGE SIZE DROPDOWN (LIMIT) */}
      <div className="flex justify-end gap-2 items-center text-sm mb-2">
        <span className="text-gray-600">Rows per page:</span>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded-md px-2 py-1 bg-white"
        >
          {[10, 20, 50, 100].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Work Orders */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spin size="large" />
          </div>
        ) : workOrders.length === 0 ? (
          <p className="text-center py-10 text-gray-400">
            No work orders found.
          </p>
        ) : (
          workOrders.map((wo) => (
            <div
              key={wo.id}
              className="flex flex-col md:flex-row md:justify-between md:items-center p-4 hover:bg-gray-50 transition-all"
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
                  <h3 className="font-semibold">{wo.customerName}</h3>
                  <p className="text-gray-500 text-sm">
                    {wo.services?.join(", ")} •{" "}
                    {wo.employeeName || "Unassigned"}
                  </p>

                  {getStatusTag(wo.status)}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 md:mt-0">
                {/* ASSIGN */}
                {wo.status === "OPEN" && (
                  <Button
                    onClick={() => {
                      setSelectedWO(wo);
                      setIsReassign(false);
                      setAssignModal(true);
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded"
                  >
                    <UserPlus className="inline w-4 h-4 mr-1" /> Assign
                  </Button>
                )}

                {/* REASSIGN */}
                {["ASSIGNED", "WAITING"].includes(wo.status) && (
                  <Button
                    onClick={() => {
                      setSelectedWO(wo);
                      setIsReassign(true);
                      setAssignModal(true);
                    }}
                    className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 !text-white rounded"
                  >
                    <UserPlus className="inline w-4 h-4 mr-1" /> Reassign
                  </Button>
                )}

                {/* MARK DONE */}
                {wo.status === "IN_PROGRESS" && (
                  <Button
                    onClick={() => handleMarkAsDone(wo)}
                    disabled={submitting}
                    className="px-3 py-1 text-xs rounded-md bg-emerald-600 !text-white hover:bg-emerald-700 font-medium"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1" />{" "}
                    {submitting ? "Processing..." : "Mark as Done"}
                  </Button>
                )}

                {/* COMPLETE */}
                {wo.status === "DONE" && (
                  <Button
                    onClick={() => handleComplete(wo)}
                    className="px-3 py-1 text-xs rounded-md bg-teal-600 !text-white hover:bg-teal-700 font-medium"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1" /> Checkout
                  </Button>
                )}

                {/* CANCEL */}
                {["DRAFT", "OPEN", "ASSIGNED", "WAITING"].includes(
                  wo.status
                ) && (
                  <Button
                    onClick={() => handleCancel(wo)}
                    className="px-3 py-1 text-xs rounded-md bg-rose-600 !text-white hover:bg-rose-700 font-medium"
                  >
                    <XCircle className="inline w-4 h-4 mr-1" /> Cancel
                  </Button>
                )}

                {/* PRINT */}
                {wo.status === "COMPLETED" && (
                  <Button
                    onClick={() => window.open(`/checkout/${wo.id}`, "_blank")}
                    className="text-sm bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 
                    p-2 rounded-lg hover:scale-105 transition-transform duration-500 
                    !text-white italic flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Printer size={16} /> Print
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {total > 0 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-gray-600">
            Showing <b>{start}</b>–<b>{end}</b> of <b>{total}</b>
          </span>

          <div className="flex gap-2">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded hover:bg-emerald-600 hover:!text-white bg-white"
            >
              Previous
            </Button>

            <Button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded hover:bg-emerald-600 hover:!text-white bg-white"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ASSIGN / REASSIGN MODAL */}
      <Modal
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        footer={null}
        centered
        title={
          <div className="text-lg font-semibold">
            {isReassign ? "Reassign Employee" : "Assign Employee"}
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

          <Button
            onClick={() =>
              isReassign
                ? handleReassign(selectedWO.id)
                : handleAssign(selectedWO.id)
            }
            disabled={assigning}
            className="w-full py-2 rounded-md bg-blue-theme hover:bg-blue-bold !text-white font-medium"
          >
            {assigning
              ? isReassign
                ? "Reassigning..."
                : "Assigning..."
              : isReassign
              ? "Confirm Reassignment"
              : "Confirm Assignment"}
          </Button>
        </div>
      </Modal>

      {/* COMPLETE MODAL */}
      <Modal
        open={completeModal}
        onCancel={() => setCompleteModal(false)}
        footer={null}
        centered
        width={850}
        title={
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Wrench className="text-blue-500" />
              Complete Work Order
            </div>
          </div>
        }
      >
        {selectedWO ? (
          <div className="space-y-6">
            {/* CUSTOMER INFO */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <User size={15} /> Customer
                  </p>
                  <p className="font-semibold">{selectedWO.customerName}</p>
                </div>

                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <UserPlus size={15} /> Employee
                  </p>
                  <p className="font-semibold">
                    {selectedWO.employeeName || "Unassigned"}
                  </p>
                </div>

                {selectedWO.raw?.vehicleJson && (
                  <div className="md:col-span-1">
                    <p className="text-gray-500 flex items-center gap-1">
                      <Car size={15} /> Vehicle
                    </p>
                    <p className="font-semibold">
                      {selectedWO.raw.vehicleJson.make} •{" "}
                      {selectedWO.raw.vehicleJson.model}
                    </p>
                    <p className="font-semibold">
                      {selectedWO.raw.vehicleJson.variant} •{" "}
                      {selectedWO.raw.vehicleJson.year} • (
                      {selectedWO.raw.vehicleJson.vin})
                    </p>
                  </div>
                )}

                <div className="md:col-span-1">
                  <p className="text-gray-500 flex items-center gap-1">
                    <ClockFading size={15} /> Time Span
                  </p>
                  <p className="">
                    <span className="block">
                      <strong>Start At:</strong>{" "}
                      {new Date(selectedWO.raw.openedAt).toLocaleString()}
                    </span>
                    <span className="block">
                      <strong>Close At:</strong>{" "}
                      {new Date(selectedWO.raw.closedAt).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* SERVICES */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="text-indigo-500" /> Services (Reference
                Only)
              </h4>

              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Service</th>
                    <th className="py-2 px-3 font-semibold">Category</th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Price ($)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedWO.raw?.workOrderServices?.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2 px-3">{s.service.name}</td>
                      <td className="py-2 px-3 text-gray-500">
                        {s.service.category}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {s.service.basePrice}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={2} className="py-2 px-3 text-right">
                      Subtotal
                    </td>
                    <td className="py-2 px-3 text-right">
                      $
                      {selectedWO.raw?.workOrderServices
                        ?.reduce(
                          (sum, s) => sum + (s.service?.basePrice || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <CheckoutSection
              selectedWO={selectedWO}
              fetchWorkOrders={fetchWorkOrders}
              setCompleteModal={setCompleteModal}
              token={token}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">
            No work order selected.
          </p>
        )}
      </Modal>

      {/* CANCEL CONFIRM */}
      <ConfirmDialog
        open={cancelDialog}
        onCancel={() => setCancelDialog(false)}
        type="danger"
        onConfirm={confirmCancel}
        title="Cancel Work Order?"
        description="This will permanently cancel the work order."
      />
    </div>
  );
}
