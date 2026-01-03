"use client";

import React, { useState, useMemo } from "react";
import { Modal, Input, message } from "antd";
import { Wrench, DollarSign, Trash2, Plus } from "lucide-react";

export default function CheckOutModal({
  open,
  onClose,
  workOrder,
  token,
  onSuccess,
  mode = "ADMIN", // "ADMIN" or "EMPLOYEE"
}) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!workOrder) return;

    try {
      setLoading(true);

      const endpoint =
        mode === "ADMIN"
          ? `/api/workOrder/${workOrder.id}/completed`
          : `/api/workOrder/${workOrder.id}/mark-as-done`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      message.success(
        mode === "ADMIN"
          ? "Work order marked as COMPLETED!"
          : "Work order marked as DONE!"
      );

      onClose();
      onSuccess?.();
    } catch (err) {
      message.error(err.message || "Failed to complete work order");
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(() => {
    return (
      workOrder?.raw?.workOrderServices?.reduce(
        (sum, s) => sum + (s.service?.basePrice || 0),
        0
      ) || 0
    ).toFixed(2);
  }, [workOrder]);

  if (!workOrder) return null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={650}
      bodyStyle={{
        background: "#f9fafb",
        borderRadius: "0.75rem",
        padding: "1.5rem",
      }}
      title={
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Wrench className="text-blue-500" />
            {mode === "ADMIN" ? "Admin Checkout" : "Mark Work Order as Done"}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="bg-white border rounded-md shadow-sm p-4">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">Customer:</span>
            <span>{workOrder.customerName}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="font-medium text-gray-700">Employee:</span>
            <span>{workOrder.employeeName || "Unassigned"}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <DollarSign className="text-indigo-500" /> Estimated Total
          </h4>

          <div className="flex justify-between font-semibold text-gray-700 text-base border-t pt-3">
            <span>Subtotal</span>
            <span>${total}</span>
          </div>
        </div>

        <div className="bg-white border rounded-md shadow-sm p-4">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Add Note (optional)
          </label>
          <Input.TextArea
            rows={3}
            placeholder="Enter completion remarks or internal notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg shadow-md flex justify-between items-center p-4 mt-6">
          <div className="text-lg font-semibold">Final Total: ${total}</div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-white text-emerald-700 hover:bg-gray-50 px-6 py-2 rounded-md font-semibold shadow-sm transition"
          >
            {loading
              ? "Processing..."
              : mode === "ADMIN"
              ? "Mark as Completed"
              : "Mark as Done"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
