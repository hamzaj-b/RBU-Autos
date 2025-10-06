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
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: null,
    service: null,
    slot: null,
    notes: "",
  });

  const { user, token, logout } = useAuth();

  // ─── Fetch Customers ──────────────────────────────
  const fetchCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(
      data.customers?.map((c) => ({
        label: c.fullName,
        value: c.id,
      })) || []
    );
  };

  // ─── Fetch Services ───────────────────────────────
  const fetchServices = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(
      data.data?.map((s) => ({
        label: s.name,
        value: s.id,
      })) || []
    );
  };

  console.log("Services are:", services);

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

  // ─── On Calendar Date Click ──────────────────────
  const handleSelectDate = (slotInfo) => {
    const date = moment(slotInfo.start).format("YYYY-MM-DD");
    setSelectedDate(date);
    setModalOpen(true);
    fetchSlots(date);
  };

  // ─── Create Booking ───────────────────────────────
  const handleCreateBooking = async () => {
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
        message.success("✅ Booking successfully created!");
        setModalOpen(false);
        setFormData({ customer: null, service: null, slot: null, notes: "" });
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
    // Remove “Z” so browser doesn’t convert UTC → local
    const raw = isoString.replace("Z", "");
    const [hour, minute] = raw.slice(11, 16).split(":");
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHour = ((h + 11) % 12) + 1;
    return `${formattedHour}:${minute} ${ampm}`;
  };
  const slotOptions = slots.map((s) => ({
    value: s.start,
    label: `${formatTime(s.start)} - ${formatTime(s.end)} (${
      s.capacity
    } available)`,
    isDisabled: s.capacity <= 0,
  }));

  useEffect(() => {
    fetchCustomers();
    fetchServices();
  }, []);

  console.log("slots", slots);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-blue-bold flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-blue-bold" />
          Booking Calendar
        </h1>
      </div>

      {/* Calendar Container */}
      <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
        <Calendar
          localizer={localizer}
          onSelectSlot={handleSelectDate}
          selectable
          style={{ height: 650 }}
          popup
          views={["month", "week", "day"]}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#2563eb",
              color: "#fff",
              borderRadius: "8px",
            },
          })}
        />
      </div>

      {/* Modal for Booking Form */}
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
            {/* Slot Dropdown */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Select Time Slot
              </label>
              <Select
                isLoading={loading}
                placeholder="Choose a time slot"
                options={slots.map((s) => ({
                  value: s, // ✅ store full slot object
                  label: `${formatTime(s.start)} - ${formatTime(s.end)} (${
                    s.capacity
                  } available)`,
                  isDisabled: s.capacity <= 0,
                }))}
                onChange={(option) =>
                  setFormData((prev) => ({ ...prev, slot: option.value }))
                }
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#E5E7EB",
                    borderRadius: "0.5rem",
                    minHeight: "42px",
                    boxShadow: "none",
                  }),
                  option: (base, { isDisabled }) => ({
                    ...base,
                    backgroundColor: isDisabled ? "#F9FAFB" : "white",
                    color: isDisabled ? "#9CA3AF" : "#111827",
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  }),
                }}
              />
              {formData.slot && (
                <p className="text-sm text-gray-500 mt-2">
                  You selected:{" "}
                  <strong>
                    {formatTime(formData.slot.start)} -{" "}
                    {formatTime(formData.slot.end)}
                  </strong>
                </p>
              )}
            </div>

            {/* Customer & Service Dropdowns */}
            <div className="w-full flex gap-2">
              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Customer
                </label>
                <Select
                  options={customers}
                  value={formData.customer}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, customer: val }))
                  }
                  placeholder="Search or select customer..."
                  className="text-sm"
                  isSearchable
                />
              </div>

              <div className="w-1/2">
                <label className="block text-gray-700 font-medium mb-2">
                  Select Service
                </label>
                <Select
                  options={services}
                  value={formData.service}
                  onChange={(val) =>
                    setFormData((p) => ({ ...p, service: val }))
                  }
                  placeholder="Search or select service..."
                  className="text-sm"
                  isSearchable
                />
              </div>
            </div>

            {/* Notes Field */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Notes (optional)
              </label>
              <Textarea
                placeholder="Add additional notes for this booking..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, notes: e.target.value }))
                }
                className="text-sm min-h-[90px]"
              />
            </div>

            {/* Submit Button */}
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
