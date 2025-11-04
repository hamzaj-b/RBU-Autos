"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Select,
  Skeleton,
  Card,
  Input,
  Divider,
} from "antd";
import {
  CheckCircle,
  XCircle,
  Calendar,
  UserCheck,
  RefreshCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

export default function PreBookingsPage() {
  const { token } = useAuth();

  // State
  const [preBookings, setPreBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [actionModal, setActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [note, setNote] = useState("");
  const [busyEmployees, setBusyEmployees] = useState([]); // [{ id, fullName, busyUntil... }]

  // Debounce search
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => fetchBookings(), 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, statusFilter]);

  const minutesToHoursString = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};
  // Fetch Pre-Bookings
  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: "PREBOOKING",
        status: statusFilter === "all" ? "" : statusFilter,
        search: searchTerm || "",
      });

      const res = await fetch(`/api/bookings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPreBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to fetch pre-bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  // Fetch Available Employees for Approval
  const fetchAvailableEmployees = async (startAt, duration) => {
    if (!token) return;
    try {
      setEmployeeLoading(true);
      setEmployees([]);
      setBusyEmployees([]);
      setEmployeeId(null); // ensure no stale employee remains selected

      const params = new URLSearchParams({
        startAt,
        duration: String(duration),
      });

      const res = await fetch(`/api/available-employees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load availability");

      if (!mountedRef.current) return;

      const avail = (data.availableEmployees || []).map((e) => ({
        label: e.fullName,
        value: e.id,
      }));
      setEmployees(avail);

      const busy = (data.busyEmployees || []).map((b) => ({
        id: b.id,
        fullName: b.fullName,
        busyFrom: b.busyFrom || b.busyUntil ? b.busyFrom : null,
        busyUntil: b.busyUntil,
        title: b.title,
      }));
      setBusyEmployees(busy);
      toast.success("Employee availability loaded");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to load available employees");
    } finally {
      if (!mountedRef.current) return;
      setEmployeeLoading(false);
    }
  };

  // Approve or Reject
  const handleAction = async () => {
    if (!selectedBooking) return;
    setLoading(true);
    try {
      const body =
        actionType === "APPROVE"
          ? { action: "APPROVE", employeeId, notes: note }
          : { action: "REJECT", notes: note };

      const res = await fetch(`/api/bookings/pre/${selectedBooking.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setActionModal(false);
      fetchBookings();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update booking");
    } finally {
      setLoading(false);
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (v) => <span className="font-medium">{v}</span>,
    },
    {
      title: "Services",
      dataIndex: "services",
      key: "services",
      render: (list) =>
        list.map((s, i) => (
          <Tag key={i} color="blue">
            {s}
          </Tag>
        )),
    },
    {
      title: "Start Time",
      dataIndex: "startAt",
      key: "startAt",
      render: (v) =>
        new Date(v).toLocaleString([], {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    {
      title: "Duration",
      dataIndex: "totalDuration",
      key: "duration",
      render: (v) => `${minutesToHoursString(v) || 0}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag
          color={v === "PENDING" ? "gold" : v === "ACCEPTED" ? "green" : "red"}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              className="!text-white !bg-blue-theme"
              icon={<CheckCircle size={16} />}
              onClick={() => {
                setSelectedBooking(record.raw || record);
                setActionType("APPROVE");
                setActionModal(true);
                setNote("");
                fetchAvailableEmployees(record.startAt, record.totalDuration);
              }}
            >
              Approve
            </Button>
            <Button
              danger
              icon={<XCircle size={16} />}
              onClick={() => {
                setSelectedBooking(record.raw || record);
                setActionType("REJECT");
                setActionModal(true);
                setNote("");
              }}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 sm:p-6">
      <style jsx global>{`
        /* 📱 Mobile card layout for AntD table */
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
            flex-direction: row !important;
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
            flex: 1;
            text-align: right;
            word-break: break-word;
          }
        }
      `}</style>

      <div className="w-full mx-auto max-w-7xl">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2] flex-wrap">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">Pre-Bookings</span>
            </div>
          }
        >
          {/* 🔹 Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <Input
              placeholder="Search by customer or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 border-gray-200 rounded-lg"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={fetchBookings}
                className="border-[#0f74b2] text-[#0f74b2] flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCcw
                  size={16}
                  className={`${loading ? "animate-spin" : ""}`}
                />
                <span className="ml-2">Refresh</span>
              </Button>
            </div>
          </div>

          {/* 🔹 Table or Loader */}
          {loading ? (
            <Skeleton active />
          ) : (
            <Table
              dataSource={preBookings}
              columns={columns.map((col) => ({
                ...col,
                onCell: () => ({ "data-label": col.title }),
              }))}
              rowKey="id"
              pagination={false}
              className="rounded-lg bg-white"
            />
          )}
        </Card>
      </div>

      {/* 🔹 Action Modal */}
      <Modal
        open={actionModal}
        title={
          loading
            ? actionType === "APPROVE"
              ? "Approving..."
              : "Rejecting..."
            : actionType === "APPROVE"
            ? "Approve Pre-Booking"
            : "Reject Pre-Booking"
        }
        okText={
          loading
            ? actionType === "APPROVE"
              ? "Approving..."
              : "Rejecting..."
            : actionType === "APPROVE"
            ? "Approve & Assign"
            : "Reject"
        }
        onOk={handleAction}
        onCancel={() => setActionModal(false)}
        confirmLoading={employeeLoading}
        okButtonProps={{
          disabled: actionType === "APPROVE" && !employeeId,
        }}
        centered
        className="!max-w-lg sm:!max-w-xl"
        bodyStyle={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        <div className="space-y-3">
          {actionType === "APPROVE" && (
            <>
              <label className="block text-sm font-medium text-gray-700">
                Assign Employee
              </label>
              <Select
                options={employees}
                placeholder="Select available employee"
                onChange={setEmployeeId}
                value={employeeId}
                className="w-full"
                loading={employeeLoading}
              />
              <Divider className="my-4" />
              <div className="text-sm font-medium text-gray-700 mb-1">
                Busy Employees
              </div>
              {employeeLoading ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : busyEmployees.length === 0 ? (
                <div className="text-xs text-gray-500">None in this window</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {busyEmployees.map((emp) => (
                    <Tag key={emp.id} color="red">
                      {emp.fullName} — busy till{" "}
                      {emp.busyUntil
                        ? new Date(emp.busyUntil).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </Tag>
                  ))}
                </div>
              )}
            </>
          )}

          <label className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <Input.TextArea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add note (optional)"
          />
        </div>
      </Modal>
    </div>
  );
}
