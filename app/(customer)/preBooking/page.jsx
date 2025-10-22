"use client";

import { useEffect, useState } from "react";
import { Card, Select, Input, Button, DatePicker, Skeleton, Tag } from "antd";
import { Calendar, Clock, ClipboardEdit } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAuth } from "@/app/context/AuthContext";

dayjs.extend(customParseFormat);
const { TextArea } = Input;

export default function CustomerPreBookingPage() {
  const { token } = useAuth();

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [businessSettings, setBusinessSettings] = useState(null);

  // 🔹 Fetch Services & Business Settings
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [servRes, settingsRes] = await Promise.all([
          fetch("/api/services", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/business-settings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [servData, settingsData] = await Promise.all([
          servRes.json(),
          settingsRes.json(),
        ]);

        setServices(
          servData.data?.map((s) => ({
            label: `${s.name} (${s.durationMinutes}m • $ ${s.basePrice})`,
            value: s.id,
            duration: s.durationMinutes,
            price: s.basePrice,
          })) || []
        );

        setBusinessSettings(settingsData.settings?.[0] || null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load services or settings");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 🔹 Auto-calculate total duration & price
  useEffect(() => {
    const selected = services.filter((s) => selectedServices.includes(s.value));
    const totalDur = selected.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalCost = selected.reduce((sum, s) => sum + (s.price || 0), 0);
    setTotalDuration(totalDur);
    setTotalPrice(totalCost);
  }, [selectedServices, services]);

  // 🔹 Handle Submit
  const handleSubmit = async () => {
    if (!selectedServices.length) {
      toast.error("Please select at least one service");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a booking date and time");
      return;
    }

    try {
      setSubmitLoading(true);

      const startAt = selectedDate.toDate();
      const now = new Date();
      if (startAt <= now) {
        toast.error("Booking time must be in the future");
        setSubmitLoading(false);
        return;
      }

      // Check garage hours
      if (businessSettings) {
        const { openTime, closeTime, allowCustomerBooking } = businessSettings;
        if (!allowCustomerBooking) {
          toast.error("Online booking is currently disabled");
          setSubmitLoading(false);
          return;
        }

        const [openHour, openMin] = openTime.split(":").map(Number);
        const [closeHour, closeMin] = closeTime.split(":").map(Number);

        const open = dayjs(selectedDate).hour(openHour).minute(openMin);
        const close = dayjs(selectedDate).hour(closeHour).minute(closeMin);
        const endTime = selectedDate.add(totalDuration, "minute");

        if (selectedDate.isBefore(open)) {
          toast.error("Garage opens at " + open.format("hh:mm A"));
          setSubmitLoading(false);
          return;
        }

        if (endTime.isAfter(close)) {
          toast.error("Service must finish before " + close.format("hh:mm A"));
          setSubmitLoading(false);
          return;
        }
      }

      const res = await fetch("/api/bookings/pre", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceIds: selectedServices,
          startAt: selectedDate.toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "Pre-booking created successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create pre-booking");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedServices([]);
    setSelectedDate(null);
    setNotes("");
    setTotalDuration(0);
    setTotalPrice(0);
  };

  // 🔹 Disable past dates in DatePicker
  const disabledDate = (current) =>
    current && current < dayjs().endOf("day").subtract(1, "day");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">Create Pre-Booking</span>
            </div>
          }
        >
          {pageLoading ? (
            <div className="space-y-6">
              <Skeleton.Input active block />
              <Skeleton.Input active block />
              <Skeleton.Input active block />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Services */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Select Services
                </label>
                <Select
                  mode="multiple"
                  placeholder="Search and select services"
                  options={services}
                  value={selectedServices}
                  onChange={setSelectedServices}
                  className="w-full"
                  size="large"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>

              {/* Booking Date + Time */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Select Date & Time
                </label>
                <DatePicker
                  showTime={{ format: "HH:mm" }}
                  format="YYYY-MM-DD HH:mm"
                  className="w-full"
                  size="large"
                  value={selectedDate}
                  disabledDate={disabledDate}
                  onChange={setSelectedDate}
                  placeholder="Choose date and time"
                />
              </div>

              {/* Duration & Price */}
              <div className="bg-[#f9fbfd] rounded-xl p-4 border border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    Duration:{" "}
                    <span className="text-[#0f74b2]">{totalDuration}</span> min
                  </span>
                </div>
                <div className="font-semibold text-[#0f74b2]">
                  Total: $ {totalPrice}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Notes (optional)
                </label>
                <TextArea
                  rows={3}
                  placeholder="Any additional notes for your booking"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* Info */}
              {businessSettings && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600">
                  <ClipboardEdit className="inline w-4 h-4 mr-1 text-[#0f74b2]" />
                  Garage Timings:{" "}
                  <span className="font-medium">
                    {businessSettings.openTime} — {businessSettings.closeTime}
                  </span>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  type="primary"
                  size="large"
                  loading={submitLoading}
                  onClick={handleSubmit}
                  className="bg-[#0f74b2] hover:bg-blue-800 rounded-lg font-semibold shadow-md"
                >
                  Confirm Pre-Booking
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
