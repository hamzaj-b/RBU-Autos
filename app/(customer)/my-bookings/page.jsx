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

  // Cancel Confirmation
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
      title: "Services",
      dataIndex: "services",
      render: (list) =>
        list?.map((s, i) => (
          <Tag key={i} color="blue">
            {s}
          </Tag>
        )),
      onCell: () => ({ "data-label": "Services" }),
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
      onCell: () => ({ "data-label": "Date / Time" }),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => (
        <Tag
          className="w-fit"
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
      onCell: () => ({ "data-label": "Status" }),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <Button
            className="items-center"
            size="medium"
            onClick={() => {
              setSelectedBooking(record);
              setDetailModal(true);
            }}
          >
            <Eye className="" size={16} />
          </Button>
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
      onCell: () => ({ "data-label": "Actions" }),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      {/* 📱 Responsive Styles */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .ant-table-thead {
            display: none !important;
          }
          .ant-table-tbody > tr {
            display: flex !important;
            flex-direction: column !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.75rem !important;
            margin-bottom: 1rem !important;
            background: #fff !important;
            padding: 0.9rem 1rem !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }
          .ant-table-tbody > tr > td {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            border: none !important;
            padding: 0.45rem 0 !important;
            border-bottom: 1px dashed #e5e7eb;
            font-size: 0.9rem !important;
          }
          .ant-table-tbody > tr > td:last-child {
            border-bottom: none !important;
          }
          .ant-table-tbody > tr > td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
            flex: 1;
            text-align: left;
            margin-right: 1rem;
          }
          .ant-table-tbody > tr > td span,
          .ant-table-tbody > tr > td div {
            font-weight: 500;
            text-align: right;
            word-break: break-word;
          }
        }
      `}</style>

      <div className="w-full mx-auto max-w-7xl">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg sm:text-xl">
                My Bookings
              </span>
            </div>
          }
        >
          {loading ? (
            <div className="space-y-4">
              <Skeleton active />
              <Skeleton active />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No bookings found.
            </div>
          ) : (
            <Table
              dataSource={bookings}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 8, showSizeChanger: false }}
              className="rounded-lg bg-white"
            />
          )}
        </Card>
      </div>

      {/* 🔹 Confirmation Dialog */}
      <ConfirmDialog
        open={confirmOpen}
        type="danger"
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking?"
        loading={cancelLoading}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmCancelBooking}
      />
    </div>
  );
}
