"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Skeleton } from "antd";
import { Calendar, Eye, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import ConfirmDialog from "@/app/components/shared/ConfirmModal";

export default function MyBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Confirmation Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?type=all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");
      setBookings(data.bookings || []);
    } catch (err) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  // 🔹 Handle cancel
  const handleCancelConfirm = (record) => {
    setBookingToCancel(record);
    setConfirmOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel || !token) return;
    try {
      setCancelLoading(true);

      const res = await fetch(`/api/bookings/${bookingToCancel.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      toast.success("Booking cancelled successfully");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id ? { ...b, status: "CANCELLED" } : b
        )
      );
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
      setConfirmOpen(false);
      setBookingToCancel(null);
    }
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "bookingType",
      render: (v) => <Tag color={v === "WALKIN" ? "blue" : "purple"}>{v}</Tag>,
    },
    {
      title: "Services",
      dataIndex: "services",
      render: (list) =>
        list?.map((s, i) => (
          <Tag key={i} color="blue">
            {s}
          </Tag>
        )),
    },
    {
      title: "Date / Time",
      dataIndex: "startAt",
      render: (v) =>
        new Date(v).toLocaleString([], {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => (
        <Tag
          color={
            v === "PENDING"
              ? "gold"
              : v === "ACCEPTED"
              ? "green"
              : v === "DONE"
              ? "blue"
              : "red"
          }
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<Eye size={16} />}
            size="small"
            onClick={() => {
              setSelectedBooking(record);
              setDetailModal(true);
            }}
          />
          {record.status === "PENDING" && (
            <Button
              danger
              icon={<XCircle size={16} />}
              size="small"
              onClick={() => handleCancelConfirm(record)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="w-full mx-auto">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">My Bookings</span>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-4">
              <Skeleton active />
              <Skeleton active />
            </div>
          ) : (
            <Table
              dataSource={bookings}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              className="rounded-lg"
            />
          )}
        </Card>
      </div>

      {/* 🔹 Custom Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        type="danger"
        title="Cancel Booking"
        message={`Are you sure you want to cancel this booking?`}
        loading={cancelLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmCancelBooking}
      />
    </div>
  );
}
