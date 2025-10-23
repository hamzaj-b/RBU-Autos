"use client";

import React, { useState } from "react";
import { Modal, message } from "antd";
import { useAuth } from "../context/AuthContext"; // ✅ assuming your AuthContext is used app-wide
import toast, { Toaster } from "react-hot-toast";
import { Eye } from "lucide-react";

const EmployeeWorkOrder = ({
  data,
  fetchWorkOrders,
  heading = "Recent Work Orders",
  containerWidth = "w-full",
}) => {
  const { token } = useAuth(); // ✅ employee auth token
  const [viewModal, setViewModal] = useState(false);
  const [selectedWO, setSelectedWO] = useState(null);
  const [workOrders, setWorkOrders] = useState(data); // local state for status change
  const [loadingIds, setLoadingIds] = useState(new Set()); // prevent multiple clicks

  // 🕒 Format date range
  const formatDateRange = (startISO, endISO) => {
    if (!startISO || !endISO) return "N/A";
    const start = new Date(startISO);
    const end = new Date(endISO);
    const sameDay = start.toDateString() === end.toDateString();

    const dateOptions = { month: "short", day: "numeric", year: "numeric" };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };

    if (sameDay) {
      return `${start.toLocaleDateString(
        undefined,
        dateOptions
      )} • ${start.toLocaleTimeString(
        undefined,
        timeOptions
      )} - ${end.toLocaleTimeString(undefined, timeOptions)}`;
    }

    return `${start.toLocaleDateString(
      undefined,
      dateOptions
    )}, ${start.toLocaleTimeString(
      undefined,
      timeOptions
    )} → ${end.toLocaleDateString(
      undefined,
      dateOptions
    )}, ${end.toLocaleTimeString(undefined, timeOptions)}`;
  };

  // 🧩 View Details Handler
  const handleViewDetails = (item) => {
    setSelectedWO(item);
    setViewModal(true);
  };

  // ✅ Accept Work Order API call
  const handleAccept = async (item) => {
    if (!token) {
      message.error("Unauthorized: Please log in first");
      return;
    }

    // prevent duplicate clicks
    setLoadingIds((prev) => new Set([...prev, item.id]));

    try {
      const res = await fetch(`/api/workOrders/${item.id}/employee/accept`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("✅ Work order accepted successfully!");
        await fetchWorkOrders();
        // update local state (hide Accept → show Start)
        // setWorkOrders((prev) =>
        //   prev.map((wo) =>
        //     wo.id === item.id
        //       ? { ...wo, status: "ASSIGNED", accepted: true }
        //       : wo
        //   )
        // );
      } else {
        toast.error(
          data.error ||
            "Failed to accept work order as you may have already accepted one already."
        );
      }
    } catch (err) {
      console.error("💥 Accept WorkOrder Error:", err);
      toast.error(
        "Failed to accept work order as you may have already accepted one already."
      );
    } finally {
      setLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // 🧠 Handle Start Button (future use)
  const handleStart = (item) => {
    message.info(`Starting work order #${item.id}...`);
  };

  return (
    <div className={containerWidth}>
      <h2 className="text-lg sm:text-[22px] px-3 sm:px-4 py-2 sm:py-3 text-gray-500 font-semibold mb-2 sm:mb-4">
        {heading}
      </h2>

      {/* Work Orders List */}
      <div className="space-y-2 sm:space-y-3 px-2 sm:px-3">
        {workOrders.map((item) => {
          const isLoading = loadingIds.has(item.id);
          return (
            <article
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow transition-shadow"
            >
              <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Customer Info */}
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-700 to-blue-500 text-white font-semibold text-sm shadow-sm">
                      {item?.customerName
                        ?.split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-gray-800 text-sm md:text-lg font-semibold truncate">
                        {item.bookingTitle}
                      </p>
                      <p className="text-gray-700 text-sm md:text-base font-medium truncate">
                        {item.customerName}
                      </p>
                      <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-x-2 text-xs sm:text-sm">
                        <span className="text-gray-600 truncate">
                          {formatDateRange(item.startAt, item.endAt)}
                        </span>
                        <span className="hidden md:block text-gray-400">•</span>
                        <span className="text-gray-500 truncate">
                          {item.estimatedTime} Min
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* ✅ Action Buttons */}
                  <div className="flex justify-end">
                    {item.status === "OPEN" && (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleAccept(item)}
                        className={`px-4 sm:px-5 py-2 rounded-lg !text-white font-medium shadow-md transition-all ${
                          isLoading
                            ? "bg-gray-700 cursor-not-allowed"
                            : "bg-blue-theme hover:bg-blue-bold hover:shadow-lg"
                        }`}
                      >
                        {isLoading ? "Accepting" : "Accept"}
                      </button>
                    )}

                    {item.status === "ASSIGNED" && (
                      <button
                        type="button"
                        onClick={() => handleStart(item)}
                        className="px-4 sm:px-5 py-2 rounded-lg bg-blue-theme hover:bg-blue-bold hover:shadow-lg !text-white font-medium shadow-md  transition-all"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-3 sm:px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Order No: <span className="tabular-nums">#{item.id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleViewDetails(item)}
                  className="text-xs sm:text-sm text-gray-600 flex items-center hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors"
                >
                  <Eye className="inline w-4 h-4 mr-1" />
                  <span className="hidden md:block">View</span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 🪟 Work Order Details Modal */}
      <Modal
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        centered
        title={
          <div className="text-xl font-semibold text-gray-800 text-center border-b py-2">
            Work Order Details
          </div>
        }
      >
        {selectedWO && (
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Service:</strong> {selectedWO.bookingTitle}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {selectedWO.details?.workOrder?.service?.description || "N/A"}
            </p>
            <p>
              <strong>Category:</strong>{" "}
              {selectedWO.details?.workOrder?.service?.category || "N/A"}
            </p>
            <p>
              <strong>Customer:</strong> {selectedWO.customerName}
            </p>
            <p>
              <strong>Status:</strong> {selectedWO.status}
            </p>
            <p>
              <strong>Start Time:</strong>{" "}
              {new Date(selectedWO.startAt).toLocaleString()}
            </p>
            <p>
              <strong>End Time:</strong>{" "}
              {new Date(selectedWO.endAt).toLocaleString()}
            </p>
            {selectedWO.details?.workOrder?.service?.notes && (
              <p>
                <strong>Notes:</strong>{" "}
                {selectedWO.details.workOrder.service.notes}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeWorkOrder;
