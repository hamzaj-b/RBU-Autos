"use client";

import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Select from "react-select";
import { Modal, Spin, message } from "antd";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

const localizer = momentLocalizer(moment);

export default function BookingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: null,
    service: null,
    employee: null,
    slot: null,
    notes: "",
  });

  // ✅ using token directly from context
  const { token } = useAuth();

  // ─── Fetch Customers ──────────────────────────────
  const fetchCustomers = async () => {
    if (!token) return;
    const res = await fetch("/api/customers", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setCustomers(
      data.customers?.map((c) => ({ label: c.fullName, value: c.id })) || []
    );
  };

  // ─── Fetch Services ───────────────────────────────
  const fetchServices = async () => {
    if (!token) return;
    const res = await fetch("/api/services", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setServices(data.data?.map((s) => ({ label: s.name, value: s.id })) || []);
  };

  // ─── Fetch Employees ──────────────────────────────
  const fetchEmployees = async () => {
    if (!token) return;
    const res = await fetch("/api/auth/admin/employee", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = await res.json();
    setEmployees(
      data.employees?.map((e) => ({ label: e.fullName, value: e.id })) || []
    );
  };

  // ─── Fetch Slots ─────────────────────────────────
  const fetchSlots = async (date) => {
    setLoading(true);
    try {
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

  // ─── Fetch Bookings to show on calendar ──────────
  const fetchBookings = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/bookings", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();

      const mapped =
        data.bookings?.map((b) => ({
          title: `${b.serviceName} (${b.customerName})`,
          start: new Date(b.startAt),
          end: new Date(b.endAt),
          status: b.workOrder?.status || b.status, // prefer WorkOrder status
        })) || [];
      setEvents(mapped);
    } catch (err) {
      console.error("Fetch bookings error:", err);
    }
  };

  // ─── On Calendar Date Click ──────────────────────
  const handleSelectDate = (slotInfo) => {
    const date = moment(slotInfo.start).format("YYYY-MM-DD");
    if (moment(date).isBefore(moment().format("YYYY-MM-DD"))) {
      message.warning("Cannot create booking in the past.");
      return;
    }

    setSelectedDate(date);
    setModalOpen(true);
    fetchSlots(date);
  };

  // ─── Create Booking ───────────────────────────────
  const handleCreateBooking = async () => {
    if (!token) {
      message.error("Not authenticated. Please sign in again.");
      return;
    }

    if (!formData.customer || !formData.service || !formData.slot) {
      return message.warning("Please select all required fields.");
    }

    try {
      setLoading(true);

      const payload = {
        customerId: formData.customer.value,
        serviceId: formData.service.value,
        startAt: formData.slot.start,
        endAt: formData.slot.end,
        notes: formData.notes,
      };

      if (formData.employee?.value) {
        payload.directAssignEmployeeId = formData.employee.value;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        message.success(
          formData.employee
            ? "✅ Booking created and assigned successfully!"
            : "✅ Booking successfully created!"
        );
        setModalOpen(false);
        setFormData({
          customer: null,
          service: null,
          employee: null,
          slot: null,
          notes: "",
        });

        // ✅ Refresh calendar after creation
        fetchBookings();
      } else {
        message.error(data.error || "Failed to create booking.");
      }
    } catch (err) {
      console.error("Booking creation failed:", err);
      message.error("Something went wrong while creating booking.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "—";
    const raw = isoString.replace("Z", "");
    const [hour, minute] = raw.slice(11, 16).split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHour = ((h + 11) % 12) + 1;
    return `${formattedHour}:${minute} ${ampm}`;
  };

  useEffect(() => {
    if (!token) return;
    fetchCustomers();
    fetchServices();
    fetchEmployees();
    fetchBookings();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-blue-bold flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-bold" />
          Booking Calendar
        </h1>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <Calendar
          localizer={localizer}
          selectable
          onSelectSlot={handleSelectDate}
          events={events}
          style={{ height: 650 }}
          popup
          views={["month", "week", "day"]}
          eventPropGetter={(event) => ({
            // ✅ color by WorkOrder status: DONE / CANCELLED / else
            style: {
              backgroundColor:
                event.status === "CANCELLED"
                  ? "#f87171" // red
                  : event.status === "DONE"
                  ? "#10b981" // green
                  : "#2563eb", // blue
              color: "#fff",
              borderRadius: "8px",
            },
          })}
          // ✅ Hover Styling
          dayPropGetter={() => ({
            style: { transition: "background-color 0.2s" },
            onMouseEnter: (e) => {
              e.currentTarget.style.backgroundColor = "#f3f4f6";
            },
            onMouseLeave: (e) => {
              e.currentTarget.style.backgroundColor = "";
            },
          })}
        />
      </div>

      {/* Booking Modal */}
      <Modal
        open={modalOpen}
        title={
          <div className="text-xl font-semibold text-gray-800">
            Create Booking —{" "}
            <span className="text-blue-600">{selectedDate}</span>
          </div>
        }
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={650}
        className="rounded-xl"
      >
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6 p-2">
            {/* Time Slot */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Select Time Slot
              </label>
              <Select
                isLoading={loading}
                placeholder="Choose a time slot"
                options={slots.map((s) => ({
                  value: s,
                  label: `${formatTime(s.start)} - ${formatTime(s.end)} (${
                    s.capacity
                  } available)`,
                  isDisabled: s.capacity <= 0,
                }))}
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, slot: option.value }))
                }
              />
              {formData.slot && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected:{" "}
                  <strong>
                    {formatTime(formData.slot.start)} -{" "}
                    {formatTime(formData.slot.end)}
                  </strong>
                </p>
              )}
            </div>

            {/* Customer + Service + Employee */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Customer
                </label>
                <Select
                  options={customers}
                  value={formData.customer}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, customer: val }))
                  }
                  placeholder="Select customer..."
                  isSearchable
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Service
                </label>
                <Select
                  options={services}
                  value={formData.service}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, service: val }))
                  }
                  placeholder="Select service..."
                  isSearchable
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Assign Employee (optional)
                </label>
                <Select
                  options={employees}
                  value={formData.employee}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, employee: val }))
                  }
                  placeholder="Select employee..."
                  isClearable
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Add notes..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                className="text-sm min-h-[90px]"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                onClick={handleCreateBooking}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-sm rounded-lg shadow-md transition-all"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Booking"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
