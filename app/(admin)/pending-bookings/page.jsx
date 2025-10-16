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
      render: (v) => `${v || 0} min`,
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
              type="primary"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="w-full mx-auto">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">Pre-Bookings</span>
            </div>
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search by customer or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 border-gray-200 rounded-lg"
            />
            <Button
              onClick={fetchBookings}
              className="border-[#0f74b2] text-[#0f74b2]"
              disabled={loading}
            >
              <RefreshCcw
                size={16}
                className={`${loading ? "animate-spin" : ""}`}
              />{" "}
              Refresh
            </Button>
          </div>

          {loading ? (
            <Skeleton active />
          ) : (
            <Table
              dataSource={preBookings}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
          )}
        </Card>
      </div>

      {/* Action Modal */}
      <Modal
        open={actionModal}
        title={
          actionType === "APPROVE"
            ? "Approve Pre-Booking"
            : "Reject Pre-Booking"
        }
        okText={actionType === "APPROVE" ? "Approve & Assign" : "Reject"}
        onOk={handleAction}
        onCancel={() => setActionModal(false)}
        confirmLoading={employeeLoading}
        okButtonProps={{
          disabled: actionType === "APPROVE" && !employeeId,
        }}
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
            </>
          )}
          <Divider className="my-4" />
          {actionType === "APPROVE" && (
            <>
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
