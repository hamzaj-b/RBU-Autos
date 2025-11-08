"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Popconfirm,
  Skeleton,
  Card,
  DatePicker,
} from "antd";
import { Eye, Edit2, Trash2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import dayjs from "dayjs";

 const minutesToHoursString = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};
const { Search } = Input;

// 🔹 Debounce hook (pure and safe)
function useDebouncedValue(value, delay = 600) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

export default function BookingsPage() {
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  const [filters, setFilters] = useState({
    status: "all",
    type: "all",
  });

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 600);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [detailModal, setDetailModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editStartAt, setEditStartAt] = useState("");
  const [editEndAt, setEditEndAt] = useState("");
  const [editServiceIds, setEditServiceIds] = useState([]);
  const statusTagColor = useMemo(
    () => ({
      PENDING: "default",
      ACCEPTED: "gold",
      DONE: "green",
      CANCELLED: "red",
    }),
    []
  );

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

  // 🔹 Fetch Bookings
  const fetchBookings = useCallback(
    async (signal) => {
      if (!token) return;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(pagination.page),
          limit: String(pagination.limit),
          sortOrder: "desc",
        });

        if (debouncedSearch) params.append("search", debouncedSearch.trim());
        if (filters.status !== "all") params.append("status", filters.status);
        if (filters.type !== "all")
          params.append("type", filters.type.toUpperCase());

        const res = await fetch(`/api/bookings?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
          signal,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch bookings");
        console.log("booking manage data" , data);
        setBookings(data.bookings || []);
        setPagination((prev) => ({
          ...prev,
          total: data.total || 0,
        }));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          toast.dismiss();
          toast.error(err.message || "Failed to fetch bookings");
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    [
      token,
      debouncedSearch,
      filters.status,
      filters.type,
      pagination.page,
      pagination.limit,
    ]
  );

  // 🔹 Debounced + cancellable useEffect
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      await fetchBookings(controller.signal);
    })();

    // Cleanup cancels previous requests
    return () => controller.abort();
  }, [fetchBookings]);

  // 🔹 CRUD Helpers
  const viewBooking = async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch booking.");
      setSelectedBooking(data.booking);
      setDetailModal(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    }
  };

  const openEdit = (record) => {
    setSelectedBooking(record || record.raw);
    setEditNotes(record.notes || "");
    setEditStatus(record.status);
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!selectedBooking?.id) return; // Ensure the selected booking has an id
    try {
      // Prepare the request payload
      const payload = {
  notes: editNotes,
  startAt: editStartAt?.second(0).toISOString(),
  endAt: editEndAt?.second(0).toISOString(),
  serviceIds: editServiceIds,
};


      // Send PUT request to update the booking
      const res = await fetch(`/api/bookings/walkin/${selectedBooking.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", // Ensure content type is application/json
        },
        body: JSON.stringify(payload), // Sending the updated notes, startAt, endAt, and serviceIds in the body
      });

      const data = await res.json(); // Parse the response

      if (!res.ok) throw new Error(data.error || "Failed to update booking."); // Handle any API errors

      toast.success("Booking updated"); // Show success toast
      setEditModal(false); // Close the edit modal
      fetchBookings(); // Fetch updated bookings
    } catch (err) {
      toast.error(err.message || "Something went wrong"); // Show error message if request fails
    }
  };

  const deleteBooking = async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete booking.");

      toast.success("Booking deleted");
      setPagination((p) => {
        const remaining = bookings.length - 1;
        const newPage = remaining === 0 && p.page > 1 ? p.page - 1 : p.page;
        return { ...p, page: newPage };
      });
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🔹 Table Columns
  const columns = [
    {
      title: "Type",
      dataIndex: "bookingType",
      key: "bookingType",
      width: 120,
      render: (t) => (
        <Tag color={t === "WALKIN" ? "blue" : "purple"}>
          {t === "WALKIN" ? "Walk-In" : "Pre-Booking"}
        </Tag>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name) => (
        <span className="font-medium text-gray-800">{name || "N/A"}</span>
      ),
    },
    {
      title: "Services",
      dataIndex: "services",
      key: "services",
      render: (services) =>
        (services || []).map((s, i) => (
          <Tag key={`${s}-${i}`} color="blue">
            {s}
          </Tag>
        )),
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      width: 160,
      render: (name) => (
        <span className="text-gray-700">{name || "Unassigned"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status) => (
        <Tag color={statusTagColor[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Start",
      dataIndex: "startAt",
      key: "startAt",
      width: 160,
      render: (v) => formatDateTime(v),
    },
    {
      title: "End",
      dataIndex: "endAt",
      key: "endAt",
      width: 160,
      render: (v) => formatDateTime(v),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button
            icon={<Edit2 size={16} />}
            onClick={() => openEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Delete booking?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteBooking(record.id)}
          >
            <Button icon={<Trash2 size={16} />} size="small" danger />
          </Popconfirm>
        </div>
      ),
    },
  ];

  // 🔹 Filters Bar
  const FiltersBar = () => (
    <div className="flex flex-wrap gap-3 items-center mb-4">
      <Search
        placeholder="Search by customer, service, notes…"
        allowClear
        value={searchInput}
        onChange={(e) => {
          setSearchInput(e.target.value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        className="w-64"
      />
      <Select
        value={filters.status}
        onChange={(v) => {
          setFilters((f) => ({ ...f, status: v }));
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        style={{ width: 160 }}
        options={[
          { value: "all", label: "All Status" },
          { value: "PENDING", label: "Pending" },
          { value: "ACCEPTED", label: "Accepted" },
          { value: "DONE", label: "Done" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />
      <Select
        value={filters.type}
        onChange={(v) => {
          setFilters((f) => ({ ...f, type: v }));
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        style={{ width: 160 }}
        options={[
          { value: "all", label: "All Types" },
          { value: "WALKIN", label: "Walk-In" },
          { value: "PREBOOKING", label: "Pre-Booking" },
        ]}
      />
    </div>
  );

  // 🔹 Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      <style jsx global>{`
        /* ✅ Responsive improvements — keep headers visible */
        @media (max-width: 640px) {
          .ant-table {
            width: 100%;
            overflow-x: auto !important;
            display: block !important;
          }

          .ant-table-container {
            overflow-x: auto !important;
          }

          .ant-table-thead > tr > th {
            background: #f9fafb !important;
            color: #374151 !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            font-size: 0.9rem !important;
            padding: 0.5rem 0.75rem !important;
          }

          .ant-table-tbody > tr > td {
            font-size: 0.85rem !important;
            white-space: nowrap !important;
            padding: 0.5rem 0.75rem !important;
            border-bottom: 1px solid #f1f1f1 !important;
          }

          .ant-table-tbody > tr:hover {
            background-color: #f9fafb !important;
          }
        }
      `}</style>

      <div className="w-full mx-auto max-w-7xl">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2] flex-wrap">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">Bookings</span>
            </div>
          }
        >
          {initialLoading ? (
            <div className="space-y-4">
              <Skeleton active />
              <Skeleton active />
            </div>
          ) : (
            <>
              {/* ✅ Responsive Filter Bar */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="w-full sm:w-auto">
                  <FiltersBar />
                </div>
              </div>

              {/* ✅ Responsive Scroll Table */}
              <div className="overflow-x-auto rounded-lg bg-white border border-gray-100">
                <Table
                  dataSource={bookings}
                  columns={columns}
                  loading={loading}
                  rowKey="id"
                  pagination={{
                    current: pagination.page,
                    pageSize: pagination.limit,
                    total: pagination.total,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50"],
                    onChange: (page, pageSize) =>
                      setPagination({
                        page,
                        limit: pageSize,
                        total: pagination.total,
                      }),
                  }}
                  className="min-w-[900px]"
                />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ✅ Booking Details Modal */}
      <Modal
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={null}
        title="Booking Details"
        centered
        className="!max-w-lg sm:!max-w-xl"
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {!selectedBooking ? (
          <Skeleton active />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-gray-700">
            <p>
              <strong>Type:</strong> {selectedBooking.bookingType || "—"}
            </p>
            <p>
              <strong>Customer:</strong>{" "}
              {selectedBooking.customer?.fullName ||
                selectedBooking.customerName ||
                "N/A"}
            </p>
            <p>
              <strong>Employee:</strong>{" "}
              {selectedBooking.workOrder?.employee?.fullName ||
                selectedBooking.employeeName ||
                "Unassigned"}
            </p>
            <p>
              <strong>Status:</strong> {selectedBooking.status}
            </p>
            <p className="sm:col-span-2">
              <strong>Services:</strong>{" "}
              {(
                selectedBooking.bookingServices?.map(
                  (bs) => bs.service?.name
                ) ||
                selectedBooking.services ||
                []
              ).join(", ") || "—"}
            </p>
            <p className="sm:col-span-2">
              <strong>Notes:</strong> {selectedBooking.notes || "—"}
            </p>
            <p>
              <strong>Start:</strong> {formatDateTime(selectedBooking.startAt)}
            </p>
            <p>
              <strong>End:</strong> {formatDateTime(selectedBooking.endAt)}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {formatDateTime(selectedBooking.createdAt)}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {formatDateTime(selectedBooking.updatedAt)}
            </p>
          </div>
        )}
      </Modal>

      {/* ✅ Edit Booking Modal */}
     <Modal
  open={editModal}
  onCancel={() => setEditModal(false)}
  onOk={saveEdit}
  okText="Save Changes"
  title="Edit Booking"
  confirmLoading={loading}
  centered
  className="!max-w-lg sm:!max-w-xl"
  bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
  afterOpenChange={(open) => {
    if (open && selectedBooking) {
      // Pre-fill values when modal opens
      setEditNotes(selectedBooking.notes || "");
      setEditStartAt(selectedBooking.startAt ? dayjs(selectedBooking.startAt) : dayjs(selectedBooking.createdAt));
      setEditEndAt(selectedBooking.endAt ? dayjs(selectedBooking.endAt) : dayjs(selectedBooking.updatedAt));
    }
  }}
>
  <div className="space-y-4">
    {/* Notice for non-pending bookings */}
    {selectedBooking?.status && selectedBooking.status !== "PENDING" && (
      <p className="text-sm border border-red-300 text-red-700 py-2 px-4 bg-red-100 rounded-md">
        The booking status is {selectedBooking.status}, please do not change details.
      </p>
    )}

    {/* Notes */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Notes
      </label>
      <Input.TextArea
        rows={3}
        value={editNotes}
        onChange={(e) => setEditNotes(e.target.value)}
        placeholder="Update notes..."
        className="w-full"
      />
    </div>
<div className="flex items-center py-2 justify-between "> <p className="text-gray-700 font-bold">Total Time:</p>
<p className="text-gray-700 bg-blue-theme/10 rounded-full border border-blue-theme/60 px-4 ">{minutesToHoursString(selectedBooking?.totalDuration) ||
  "N/A"}</p>
 </div> 
    {/* Start/End Time */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Start Time
        </label>
        <DatePicker
          showTime={{
            use12Hours: true,
            format: "hh:mm A", // 12-hour + AM/PM toggle
          }}
          format="YYYY-MM-DD hh:mm A"
          value={editStartAt}
          onChange={(date) => setEditStartAt(date)}
          className="w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          End Time
        </label>
         <DatePicker
          showTime={{
            use12Hours: true,
            format: "hh:mm A",
          }}
          format="YYYY-MM-DD hh:mm A"
          value={editEndAt}
          onChange={(date) => setEditEndAt(date)}
          className="w-full"
        />
      </div>
    </div>
  </div>
</Modal>

    </div>
  );
}
