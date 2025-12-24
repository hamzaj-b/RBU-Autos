"use client";

import { useEffect, useState } from "react";
import { Card, Table, Tag, Button, Skeleton, Empty } from "antd";
import { Calendar, Eye, XCircle, Car } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import ConfirmDialog from "@/app/components/shared/ConfirmModal";

export default function MyBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // ======================= Fetch Bookings =======================
  const fetchBookings = async (page = 1, limit = 10) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/pre?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load bookings");

      // Filter only visible statuses
      const visible = (data.bookings || []).filter((b) =>
        ["PENDING", "ACCEPTED", "CANCELLED"].includes(b.status)
      );

      setBookings(visible);
      setPagination({
        current: data.pagination?.page || page,
        pageSize: data.pagination?.pageSize || limit,
        total: data.pagination?.total || data.total || 0,
      });
    } catch (err) {
      toast.error(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBookings(pagination.current, pagination.pageSize);
  }, [token]);

  // ======================= Handlers =======================
  const handleTableChange = (paginationConfig) => {
    const { current, pageSize } = paginationConfig;
    setPagination((prev) => ({ ...prev, current, pageSize }));
    fetchBookings(current, pageSize);
  };

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
      fetchBookings(pagination.current, pagination.pageSize);
    } catch (err) {
      toast.error(err.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
      setConfirmOpen(false);
      setBookingToCancel(null);
    }
  };

  // ======================= Table Columns =======================
  const columns = [
    // {
    //   title: "Services",
    //   dataIndex: "services",
    //   render: (list) =>
    //     list?.length ? (
    //       list.map((s, i) => (
    //         <Tag key={i} color="blue" className="mb-1 text-xs sm:text-sm">
    //           {s}
    //         </Tag>
    //       ))
    //     ) : (
    //       <span className="text-gray-400 text-sm">—</span>
    //     ),
    //   onCell: () => ({ "data-label": "Services" }),
    // },
    {
      title: "Vehicle",
      dataIndex: "vehicleJson", // ✅ now directly mapped from API
      render: (v) => {
        if (!v || (!v.make && !v.model && !v.regNo))
          return <span className="text-gray-400 text-sm">—</span>;

        return (
          <div className="text-sm text-gray-700 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-gray-800 font-medium">
              <Car size={14} />
              <span>
                {(v.make?.trim() || "Unknown") + (v.model ? ` ${v.model}` : "")}
              </span>
            </div>
            <span className="text-xs text-gray-500 font-medium">
              Reg#: {v.regNo || "N/A"}
            </span>
            {v.year && (
              <span className="text-xs text-gray-400">Year: {v.year}</span>
            )}
          </div>
        );
      },
      onCell: () => ({ "data-label": "Vehicle" }),
    },

    {
      title: "Date / Time",
      dataIndex: "startAt",
      render: (v) => (
        <span className="text-sm font-medium text-gray-700">
          {new Date(v).toLocaleString([], {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
      onCell: () => ({ "data-label": "Date / Time" }),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (v) => {
        const statusMap = {
          PENDING: { color: "gold", label: "Pending" },
          ACCEPTED: { color: "green", label: "Accepted" },
          CANCELLED: { color: "red", label: "Rejected" },
          REJECTED: { color: "red", label: "Rejected" },
        };
        const { color, label } = statusMap[v] || {
          color: "default",
          label: v,
        };
        return (
          <Tag color={color} className="font-medium px-3 py-1 text-sm">
            {label}
          </Tag>
        );
      },
      onCell: () => ({ "data-label": "Status" }),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2 justify-end md:justify-start">
          <Button
            size="small"
            type="default"
            onClick={() => toast.info("Booking details coming soon")}
          >
            <Eye size={16} className="mr-1" />
            View
          </Button>
          {record.status === "PENDING" && (
            <Button
              danger
              size="small"
              icon={<XCircle size={16} />}
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

  // ======================= Responsive Styles =======================
  const responsiveStyle = `
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
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
  `;

  // ======================= Render =======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      <style jsx global>
        {responsiveStyle}
      </style>

      <div className="max-w-7xl mx-auto">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg sm:text-xl">
                My Bookings (Active)
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
            <Empty
              description="No active bookings found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className="py-12"
            />
          ) : (
            <Table
              dataSource={bookings}
              columns={columns}
              rowKey="id"
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: false,
                onChange: handleTableChange,
              }}
              className="rounded-lg bg-white"
            />
          )}
        </Card>
      </div>

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
