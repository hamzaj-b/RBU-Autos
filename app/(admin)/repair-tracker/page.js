"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  UserPlus,
  Wrench,
  Plus,
  Trash2,
  Car,
  User,
  DollarSign,
  Printer,
} from "lucide-react";
import { Spin, message, Tag, Modal, Input } from "antd";
import Select from "react-select";
import { useAuth } from "@/app/context/AuthContext";
import ConfirmDialog from "@/app/components/shared/ConfirmModal";
import { useRouter } from "next/navigation";

export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workOrders, setWorkOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [assignModal, setAssignModal] = useState(false);
  const [completeModal, setCompleteModal] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [laborEntries, setLaborEntries] = useState([]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const { token, logout } = useAuth();

  // 🔄 Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 📦 Fetch WorkOrders
  const fetchWorkOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: debouncedSearch,
        sortOrder: "desc",
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
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, token]);

  useEffect(() => {
    if (token) fetchWorkOrders();
  }, [token, fetchWorkOrders]);

  // 📋 Fetch Employees
  useEffect(() => {
    if (!token) return;
    (async () => {
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
    })();
  }, [token]);

  // 🧰 Actions
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

  // ✅ Mark as Done
  const handleMarkAsDone = async (wo) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/workOrders/${wo.id}/mark-as-done`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Work order marked as DONE successfully!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to mark as done");
    } finally {
      setSubmitting(false);
    }
  };

  // 🧾 Complete (Checkout Modal)
  const handleComplete = (wo) => {
    if (wo.status !== "DONE") {
      return message.warning(
        "Work order must be marked as DONE before completing."
      );
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
      message.success("Work order completed successfully!");
      setCompleteModal(false);
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to complete work order");
    } finally {
      setSubmitting(false);
    }
  };

  // ❌ Cancel WorkOrder
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
      message.success("Work order cancelled successfully!");
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to cancel work order");
    } finally {
      setCancelDialog(false);
    }
  };

  // 🏷️ Status Tag
  const getStatusTag = (status) => {
    const colorMap = {
      OPEN: "blue",
      ASSIGNED: "gold",
      IN_PROGRESS: "purple",
      DONE: "green",
      COMPLETED: "cyan",
      CANCELLED: "red",
    };
    return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
  };

  // ➕ Helpers for parts/labor
  const addLabor = () =>
    setLaborEntries([...laborEntries, { task: "", hours: 1, rate: 0 }]);
  const addPart = () =>
    setPartsUsed([...partsUsed, { name: "", qty: 1, price: 0 }]);
  const updateLabor = (i, field, value) =>
    setLaborEntries((prev) =>
      prev.map((l, idx) => (i === idx ? { ...l, [field]: value } : l))
    );
  const updatePart = (i, field, value) =>
    setPartsUsed((prev) =>
      prev.map((p, idx) => (i === idx ? { ...p, [field]: value } : p))
    );
  const removeLabor = (i) =>
    setLaborEntries(laborEntries.filter((_, idx) => i !== idx));
  const removePart = (i) =>
    setPartsUsed(partsUsed.filter((_, idx) => i !== idx));

  // Totals
  const laborTotal = laborEntries.reduce(
    (sum, l) => sum + (Number(l.rate) || 0) * (Number(l.hours) || 0),
    0
  );
  const partsTotal = partsUsed.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.qty) || 0),
    0
  );

  return (
    <div className="container mx-auto p-6 space-y-6 text-gray-900">
      {/* 🔍 Filters */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[250px]">
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
        <div className="hidden md:flex gap-2 flex-wrap justify-end">
          {[
            "all",
            "OPEN",
            "ASSIGNED",
            "IN_PROGRESS",
            "DONE",
            "COMPLETED",
            "CANCELLED",
          ].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                statusFilter === s
                  ? "bg-blue-600 !text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="w-full flex flex-col gap-2 flex-wrap justify-end ">
          {/* Dropdown for small screens */}
          <div className="md:hidden">
            <select
              onChange={(e) => setStatusFilter(e.target.value)}
              value={statusFilter}
              className="w-full px-2 py-1 text-xs md:text-sm rounded-lg font-medium bg-white border border-gray-300 hover:bg-gray-200 focus:ring-0 focus:border-blue-500 focus:outline-none transition-colors duration-200"
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

      {/* 📋 Work Orders */}
      <div className="bg-white w-full rounded-xl shadow-sm border border-gray-100 divide-y">
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
              className="flex flex-col md:flex-row md:justify-between md:items-center p-4 hover:bg-gray-50 transition-all"
            >
              <div>
                <h3 className="text-base font-semibold">{wo.customerName}</h3>
                <p className="text-sm text-gray-500">
                  {wo.services?.join(", ")} • {wo.employeeName || "Unassigned"}
                </p>
                {getStatusTag(wo.status)}
              </div>

              <div className="flex gap-2 mt-3 md:mt-0 justify-end">
                {wo.status === "OPEN" && (
                  <button
                    onClick={() => {
                      setSelectedWO(wo);
                      setAssignModal(true);
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-blue-600 !text-white hover:bg-blue-700 font-medium"
                  >
                    <UserPlus className="inline w-4 h-4 mr-1" /> Assign
                  </button>
                )}

                {wo.status === "IN_PROGRESS" && (
                  <button
                    onClick={() => handleMarkAsDone(wo)}
                    disabled={submitting}
                    className="px-3 py-1 text-xs rounded-md bg-emerald-600 !text-white hover:bg-emerald-700 font-medium"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1" />{" "}
                    {submitting ? "Processing..." : "Mark as Done"}
                  </button>
                )}

                {wo.status === "DONE" && (
                  <button
                    onClick={() => handleComplete(wo)}
                    className="px-3 py-1 text-xs rounded-md bg-teal-600 !text-white hover:bg-teal-700 font-medium"
                  >
                    <CheckCircle className="inline w-4 h-4 mr-1" /> CheckOut
                  </button>
                )}

                {wo.status !== "CANCELLED" &&
                  wo.status !== "COMPLETED" &&
                  wo.status !== "DONE" && (
                    <button
                      onClick={() => handleCancel(wo)}
                      className="px-3 py-1 text-xs rounded-md bg-rose-600 !text-white hover:bg-rose-700 font-medium"
                    >
                      <XCircle className="inline w-4 h-4 mr-1" /> Cancel
                    </button>
                  )}

                {wo.status === "COMPLETED" && (
                  <div
                    onClick={() => window.open(`/checkout/${wo.id}`, "_blank")}
                    className="text-sm bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 
               p-2 rounded-lg hover:scale-105 transition-transform duration-500 
               text-white italic flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Printer size={16} /> Print
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 👷 Assign Modal */}
      <Modal
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        footer={null}
        centered
        title={<div className="text-lg font-semibold">Assign Employee</div>}
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
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 !text-white font-medium"
          >
            {assigning ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </Modal>

      {/* ✅ Complete Modal */}
      <Modal
        open={completeModal}
        onCancel={() => setCompleteModal(false)}
        footer={null}
        centered
        width={850}
        bodyStyle={{
          background: "#f9fafb",
          borderRadius: "0.75rem",
          padding: "1.5rem",
        }}
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
            {/* Customer Info */}
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
                {selectedWO.raw?.customer?.vehicleJson && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 flex items-center gap-1">
                      <Car size={15} /> Vehicle
                    </p>
                    <p className="font-semibold">
                      {selectedWO.raw.customer.vehicleJson.make} •{" "}
                      {selectedWO.raw.customer.vehicleJson.model} •{" "}
                      {selectedWO.raw.customer.vehicleJson.variant ||
                        selectedWO.raw.customer.vehicleJson.year}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Estimated Services */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="text-indigo-500" /> Estimated Services
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

            {/* Labor Entries */}
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Wrench className="text-blue-500" /> Additional Labor
                </h4>
                <button
                  onClick={addLabor}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-md hover:bg-blue-100 transition"
                >
                  <Plus className="w-4 h-4" /> Add Labor
                </button>
              </div>

              {laborEntries.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No labor entries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {laborEntries.map((l, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded-md border hover:shadow-sm transition-all"
                    >
                      {/* Task Label + Input */}
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Task
                        </label>
                        <Input
                          placeholder="Enter task description"
                          value={l.task}
                          onChange={(e) =>
                            updateLabor(i, "task", e.target.value)
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Hours Label + Input */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Hours
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 2"
                          value={l.hours}
                          onChange={(e) =>
                            updateLabor(i, "hours", e.target.value)
                          }
                          className="w-full text-center"
                        />
                      </div>

                      {/* Rate Label + Input */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Rate ($)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 50"
                          value={l.rate}
                          onChange={(e) =>
                            updateLabor(i, "rate", e.target.value)
                          }
                          className="w-full text-center"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-center justify-center col-span-2">
                        <Trash2
                          className="text-gray-400 hover:text-red-500 cursor-pointer transition-all w-5 h-5"
                          onClick={() => removeLabor(i)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {laborEntries.length > 0 && (
                <div className="text-right font-semibold text-gray-700 pt-3 border-t mt-3">
                  Labor Total:{" "}
                  <span className="text-emerald-600">
                    ${laborTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Parts Section */}
            <div className="bg-white shadow-sm rounded-lg border p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <Wrench className="text-purple-500 rotate-90" /> Parts Used
                </h4>
                <button
                  onClick={addPart}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-md hover:bg-purple-100 transition"
                >
                  <Plus className="w-4 h-4" /> Add Part
                </button>
              </div>

              {partsUsed.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  No parts added yet
                </p>
              ) : (
                <div className="space-y-3">
                  {partsUsed.map((p, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded-md border hover:shadow-sm transition-all"
                    >
                      {/* Part Name */}
                      <div className="col-span-5">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Part Name
                        </label>
                        <Input
                          placeholder="e.g. Oil Filter"
                          value={p.name}
                          onChange={(e) =>
                            updatePart(i, "name", e.target.value)
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Quantity
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 2"
                          value={p.qty}
                          onChange={(e) => updatePart(i, "qty", e.target.value)}
                          className="w-full text-center"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Price ($)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 15"
                          value={p.price}
                          onChange={(e) =>
                            updatePart(i, "price", e.target.value)
                          }
                          className="w-full text-center"
                        />
                      </div>

                      {/* Remove Button */}
                      <div className="flex items-center justify-center col-span-2">
                        <Trash2
                          className="text-gray-400 hover:text-red-500 cursor-pointer transition-all w-5 h-5"
                          onClick={() => removePart(i)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {partsUsed.length > 0 && (
                <div className="text-right font-semibold text-gray-700 pt-3 border-t mt-3">
                  Parts Total:{" "}
                  <span className="text-emerald-600">
                    ${partsTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Grand Total */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg shadow-md flex justify-between items-center p-4 mt-6">
              <div className="text-lg font-semibold">
                Grand Total: $
                {(
                  (selectedWO.raw?.workOrderServices?.reduce(
                    (sum, s) => sum + (s.service?.basePrice || 0),
                    0
                  ) || 0) +
                  laborTotal +
                  partsTotal
                ).toFixed(2)}
              </div>
              <button
                onClick={submitCompletion}
                disabled={submitting}
                className="bg-white !text-emerald-700 hover:bg-gray-50 px-6 py-2 rounded-md font-semibold shadow-sm transition"
              >
                {submitting ? "Completing..." : "Mark as Completed"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">
            No work order selected.
          </p>
        )}
      </Modal>

      {/* ❌ Cancel Confirmation */}
      <ConfirmDialog
        open={cancelDialog}
        onCancel={() => setCancelDialog(false)}
        type="danger"
        onConfirm={confirmCancel}
        title="Cancel Work Order?"
        description="This will permanently cancel this work order. Are you sure?"
      />
    </div>
  );
}
