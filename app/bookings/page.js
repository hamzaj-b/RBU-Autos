"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Select from "react-select";
import { Modal, Spin, message, Tag, Divider } from "antd";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const localizer = momentLocalizer(moment);

export default function BookingPage() {
  // ─── State ────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [slots, setSlots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer: null,
    services: [],
    employee: null,
    slot: null,
    notes: "",
  });

  const { token } = useAuth();

  // ─── Fetch Helpers ────────────────────────────────
  const fetchCustomers = async () => {
    const res = await fetch("/api/customers", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setCustomers(
      data.customers?.map((c) => ({ label: c.fullName, value: c.id })) || []
    );
  };

  const fetchServices = async () => {
    const res = await fetch("/api/services", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setServices(data.data?.map((s) => ({ label: s.name, value: s.id })) || []);
  };

  const fetchEmployees = async () => {
    const res = await fetch("/api/auth/admin/employee", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    setEmployees(
      data.employees?.map((e) => ({ label: e.fullName, value: e.id })) || []
    );
  };

  const fetchSlots = async (date) => {
    try {
      setLoading(true);
      const res = await fetch("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error("Slot fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    const mapped =
      data.bookings?.map((b) => ({
        id: b.id,
        title: `${b.customerName} — ${b.services.join(", ")}`,
        start: new Date(b.startAt),
        end: new Date(b.endAt),
        status: b.status,
        raw: b,
      })) || [];
    setEvents(mapped);
  };

  // ─── Calendar Handlers ────────────────────────────
  const handleSelectDate = async (slotInfo) => {
    const date = moment(slotInfo.start).format("YYYY-MM-DD");
    if (moment(date).isBefore(moment().format("YYYY-MM-DD"))) {
      message.warning("Cannot create booking in the past.");
      return;
    }
    setSelectedDate(date);
    setEditMode(false);
    setViewMode(false);
    await fetchSlots(date);
    setModalOpen(true);
  };

  const handleEventClick = async (event) => {
    setSelectedBooking(event.raw);
    setViewMode(true);
    setEditMode(false);
    setModalOpen(true);
  };

  // ─── Booking CRUD ────────────────────────────────
  const handleCreateOrUpdateBooking = async () => {
    if (!formData.customer || !formData.services.length || !formData.slot) {
      message.warning("Please select customer, services and time slot.");
      return;
    }

    const payload = {
      customerId: formData.customer.value,
      serviceIds: formData.services.map((s) => s.value),
      startAt: formData.slot.start,
      endAt: formData.slot.end,
      notes: formData.notes,
    };
    if (formData.employee?.value)
      payload.directAssignEmployeeId = formData.employee.value;

    const url = editMode
      ? `/api/bookings/${selectedBooking.id}`
      : "/api/bookings";
    const method = editMode ? "PUT" : "POST";

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        message.success(
          editMode
            ? "✅ Booking updated successfully!"
            : "✅ Booking created successfully!"
        );
        setModalOpen(false);
        fetchBookings();
      } else {
        message.error(data.error || "Failed to save booking.");
      }
    } catch (err) {
      console.error("Booking save error:", err);
      message.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers ─────────────────────────────────────
  const formatTime = (isoString) => {
    const raw = isoString.replace("Z", "");
    const [hour, minute] = raw.slice(11, 16).split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHour = ((h + 11) % 12) + 1;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  // ─── Mount ───────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetchCustomers();
    fetchServices();
    fetchEmployees();
    fetchBookings();
  }, [token]);

  // ─── UI ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <CalendarDays className="w-8 h-8 text-blue-600" />
          Booking Calendar
        </h1>
        <Button
          onClick={() => fetchBookings()}
          className="bg-blue-600 text-white"
        >
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow p-4 border">
        <Calendar
          localizer={localizer}
          selectable
          onSelectSlot={handleSelectDate}
          onSelectEvent={handleEventClick}
          events={events}
          style={{ height: 650 }}
          popup
          views={["month", "week", "day"]}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor:
                event.status === "CANCELLED"
                  ? "#f87171"
                  : event.status === "DONE"
                  ? "#10b981"
                  : "#2563eb",
              color: "#fff",
              borderRadius: "8px",
            },
          })}
        />
      </div>

      {/* ─── Modal ───────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={700}
        className="rounded-xl"
        destroyOnClose
        title={
          viewMode
            ? `Booking Details`
            : editMode
            ? "Edit Booking"
            : `Create Booking — ${selectedDate}`
        }
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : viewMode && selectedBooking ? (
          <div className="space-y-3">
            <p>
              <strong>Customer:</strong> {selectedBooking.customerName}
            </p>
            <p>
              <strong>Services:</strong>{" "}
              {selectedBooking.services?.join(", ") || "N/A"}
            </p>
            <p>
              <strong>Employee:</strong>{" "}
              {selectedBooking.employeeName || "Unassigned"}
            </p>
            <p>
              <strong>Time:</strong> {formatTime(selectedBooking.startAt)} -{" "}
              {formatTime(selectedBooking.endAt)}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Tag
                color={
                  selectedBooking.status === "CANCELLED"
                    ? "red"
                    : selectedBooking.status === "DONE"
                    ? "green"
                    : "blue"
                }
              >
                {selectedBooking.status}
              </Tag>
            </p>
            <p>
              <strong>Notes:</strong> {selectedBooking.notes || "—"}
            </p>
            <Divider />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setEditMode(true);
                  setViewMode(false);
                  setModalOpen(true);
                  setFormData({
                    customer: customers.find(
                      (c) => c.value === selectedBooking.raw.customerId
                    ),
                    services: services.filter((s) =>
                      selectedBooking.raw.bookingServices?.some(
                        (bs) => bs.service.id === s.value
                      )
                    ),
                    employee: employees.find(
                      (e) =>
                        e.label === selectedBooking.employeeName ||
                        e.value === selectedBooking.raw.workOrder?.employeeId
                    ),
                    slot: {
                      start: selectedBooking.startAt,
                      end: selectedBooking.endAt,
                    },
                    notes: selectedBooking.notes || "",
                  });
                }}
                className="bg-blue-600 text-white"
              >
                Edit
              </Button>
              <Button onClick={() => setModalOpen(false)}>Close</Button>
            </div>
          </div>
        ) : (
          // ─── Create/Edit Form ───────────────────────────
          <div className="space-y-5">
            <div>
              <label className="font-medium">Time Slot</label>
              <Select
                placeholder="Select time slot"
                options={slots.map((s) => ({
                  value: s,
                  label: `${formatTime(s.start)} - ${formatTime(s.end)} (${
                    s.capacity
                  } available)`,
                  isDisabled: s.capacity <= 0,
                }))}
                onChange={(opt) =>
                  setFormData((p) => ({ ...p, slot: opt.value }))
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-medium">Customer</label>
                <Select
                  options={customers}
                  value={formData.customer}
                  onChange={(v) => setFormData((p) => ({ ...p, customer: v }))}
                />
              </div>

              <div>
                <label className="font-medium">Employee (optional)</label>
                <Select
                  options={employees}
                  value={formData.employee}
                  onChange={(v) => setFormData((p) => ({ ...p, employee: v }))}
                  isClearable
                />
              </div>
            </div>
            <div>
              <label className="font-medium">Services</label>
              <Select
                isMulti
                options={services}
                value={formData.services}
                onChange={(v) => setFormData((p) => ({ ...p, services: v }))}
              />
            </div>

            <div>
              <label className="font-medium">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
              />
            </div>

            <Button
              onClick={handleCreateOrUpdateBooking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editMode ? "Update Booking" : "Create Booking"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
