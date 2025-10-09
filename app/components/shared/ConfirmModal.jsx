"use client";
import { Modal } from "antd";

export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  type = "info", // info | success | danger
  title,
  message,
  confirmText = "Confirm",
}) {
  const colors = {
    info: "text-blue-600",
    success: "text-emerald-600",
    danger: "text-rose-600",
  };

  const buttonColors = {
    info: "bg-blue-600 hover:bg-blue-700",
    success: "bg-emerald-600 hover:bg-emerald-700",
    danger: "bg-rose-600 hover:bg-rose-700",
  };

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onCancel}
      centered
      className="rounded-xl"
    >
      <div className="space-y-4">
        <h2 className={`text-xl font-semibold ${colors[type]}`}>{title}</h2>
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white font-medium ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
