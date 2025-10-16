"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Modal, Skeleton } from "antd";
import { Calendar, Eye, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

export default function MyBookingsPage() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // 🔹 Fetch my bookings
  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?type=all", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");

      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  // 🔹 Cancel booking (PATCH or DELETE based on type)
  const handleCancel = async (record) => {
    Modal.confirm({
      title: "Cancel this booking?",
      okText: "Yes, Cancel",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setCancelLoading(true);
          const res = await fetch(`/api/bookings/${record.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          toast.success("Booking cancelled successfully");
          fetchBookings();
        } catch (err) {
          console.error(err);
          toast.error(err.message || "Failed to cancel booking");
        } finally {
          setCancelLoading(false);
        }
      },
    });
  };

  // 🔹 Table columns
  const columns = [
    {
      title: "Type",
      dataIndex: "bookingType",
      key: "bookingType",
      render: (v) => <Tag color={v === "WALKIN" ? "blue" : "purple"}>{v}</Tag>,
      width: 100,
    },
    {
      title: "Services",
      dataIndex: "services",
      key: "services",
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
      key: "startAt",
      render: (v) =>
        new Date(v).toLocaleString([], {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      width: 160,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
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
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<Eye size={16} />}
            onClick={() => {
              setSelectedBooking(record.raw || record);
              setDetailModal(true);
            }}
            size="small"
          />
          {(record.status === "PENDING" || record.status === "ACCEPTED") && (
            <Button
              danger
              icon={<XCircle size={16} />}
              size="small"
              loading={cancelLoading}
              onClick={() => handleCancel(record)}
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  const formatDateTime = (v) =>
    v
      ? new Date(v).toLocaleString([], {
          hour: "2-digit",
          minute: "2-digit",
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "—";

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
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
              }}
              className="rounded-lg"
            />
          )}
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        title="Booking Details"
        centered
      >
        {!selectedBooking ? (
          <Skeleton active />
        ) : (
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Type:</strong> {selectedBooking.bookingType || "—"}
            </p>
            <p>
              <strong>Status:</strong> {selectedBooking.status}
            </p>
            <p>
              <strong>Services:</strong>{" "}
              {(selectedBooking.services || []).join(", ") || "—"}
            </p>
            <p>
              <strong>Start:</strong> {formatDateTime(selectedBooking.startAt)}
            </p>
            <p>
              <strong>End:</strong> {formatDateTime(selectedBooking.endAt)}
            </p>
            <p>
              <strong>Duration:</strong> {selectedBooking.totalDuration || "—"}{" "}
              min
            </p>
            <p>
              <strong>Notes:</strong> {selectedBooking.notes || "—"}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {formatDateTime(selectedBooking.createdAt)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
