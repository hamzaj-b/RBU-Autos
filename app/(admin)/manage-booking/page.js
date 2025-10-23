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
    setSelectedBooking(record.raw || record);
    setEditNotes(record.notes || "");
    setEditStatus(record.status);
    setEditModal(true);
  };

  const saveEdit = async () => {
    if (!selectedBooking?.id) return; // Ensure the selected booking has an id
    try {
      // Prepare the request payload
      const payload = {
        notes: editNotes,    // Notes to be updated
        startAt: editStartAt, // Start time to be updated
        endAt: editEndAt,    // End time to be updated
        serviceIds: editServiceIds, // Services to be updated
      };
  
      // Send PUT request to update the booking
      const res = await fetch(`/api/bookings/walkin/${selectedBooking.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",  // Ensure content type is application/json
        },
        body: JSON.stringify(payload),  // Sending the updated notes, startAt, endAt, and serviceIds in the body
      });
  
      const data = await res.json();  // Parse the response
  
      if (!res.ok) throw new Error(data.error || "Failed to update booking.");  // Handle any API errors
  
      toast.success("Booking updated");  // Show success toast
      setEditModal(false);  // Close the edit modal
      fetchBookings();  // Fetch updated bookings
    } catch (err) {
      toast.error(err.message || "Something went wrong");  // Show error message if request fails
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="w-full mx-auto">
        <Card
          bordered={false}
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
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
              <FiltersBar />
              <Table
                dataSource={bookings}
                columns={columns}
                loading={loading}
                rowKey="id"
                scroll={{ x: 900 }}
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
                className="rounded-lg"
              />
            </>
          )}
        </Card>
      </div>
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
            <p>
              <strong>Services:</strong>{" "}
              {(
                selectedBooking.bookingServices?.map(
                  (bs) => bs.service?.name
                ) ||
                selectedBooking.services ||
                []
              ).join(", ") || "—"}
            </p>
            <p>
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

      {/* Edit Modal */}
      <Modal
  open={editModal}
  onCancel={() => setEditModal(false)}
  onOk={saveEdit}
  okText="Save Changes"
  title="Edit Booking"
  confirmLoading={loading}
>
  <div className="space-y-3">
    {/* Editable Notes */}
    <label className="block text-sm font-medium text-gray-700">Notes</label>
    <Input.TextArea
      rows={3}
      value={editNotes}
      onChange={(e) => setEditNotes(e.target.value)}
      placeholder="Update notes..."
    />

    {/* Editable Start and End Time */}
    <div className="flex space-x-3">
      <div className="w-1/2">
        <label className="block text-sm font-medium text-gray-700">Start Time</label>
        <DatePicker
          showTime
          value={editStartAt}
          onChange={(date) => setEditStartAt(date)}
          className="w-full"
        />
      </div>
      <div className="w-1/2">
        <label className="block text-sm font-medium text-gray-700">End Time</label>
        <DatePicker
          showTime
          value={editEndAt}
          onChange={(date) => setEditEndAt(date)}
          className="w-full"
        />
      </div>
    </div>

    {/* Editable Services
    <label className="block text-sm font-medium text-gray-700">Services</label>
    <Select
      mode="multiple"
      value={editServiceIds}
      onChange={setEditServiceIds}
      className="w-full"
      options={allServicesOptions} // Assuming you have an array of service options
    /> */}
  </div>
</Modal>

    </div>
  );
}
