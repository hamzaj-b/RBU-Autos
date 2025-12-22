"use client";

import { useEffect, useState } from "react";
import { Card, Select, Input, Button, DatePicker, Skeleton } from "antd";
import { Calendar, Clock, ClipboardEdit, Car } from "lucide-react";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAuth } from "@/app/context/AuthContext";

dayjs.extend(customParseFormat);
const { TextArea } = Input;

export default function CustomerPreBookingPage() {
  const { token, user } = useAuth();

  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [businessSettings, setBusinessSettings] = useState(null);

  const minutesToHoursString = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // 🔹 Fetch services, settings, and vehicles
  useEffect(() => {
    if (!token || !user?.customerId) return;

    const fetchData = async () => {
      try {
        const [servRes, settingsRes, customerRes] = await Promise.all([
          fetch("/api/services?limit=all", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/business-settings", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/customers/${user.customerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [servData, settingsData, customerData] = await Promise.all([
          servRes.json(),
          settingsRes.json(),
          customerRes.json(),
        ]);

        if (!servRes.ok)
          throw new Error(servData.error || "Failed to load services");
        if (!settingsRes.ok)
          throw new Error(settingsData.error || "Failed to load settings");
        if (!customerRes.ok)
          throw new Error(customerData.error || "Failed to load customer info");

        // Services
        setServices(
          servData.data
            ?.filter((s) => s.isActive)
            .map((s) => ({
              label: `${s.name} • (${minutesToHoursString(s.durationMinutes)})`,
              value: s.id,
              duration: s.durationMinutes,
              price: s.basePrice,
            })) || []
        );

        // Settings
        setBusinessSettings(settingsData.settings?.[0] || null);

        // Vehicles
        const customer =
          customerData.customer || customerData.profile || customerData;
        const vehicleList = Array.isArray(customer?.vehicleJson)
          ? customer.vehicleJson
          : [customer?.vehicleJson].filter(Boolean);
        setVehicles(vehicleList || []);
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load data");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [token, user?.customerId]);

  // 🔹 Totals
  useEffect(() => {
    const selected = services.filter((s) => selectedServices.includes(s.value));
    setTotalDuration(selected.reduce((sum, s) => sum + (s.duration || 0), 0));
    setTotalPrice(selected.reduce((sum, s) => sum + (s.price || 0), 0));
  }, [selectedServices, services]);

  // 🔹 Submit booking
  const handleSubmit = async () => {
    if (!selectedServices.length)
      return toast.error("Please select at least one service");
    if (!selectedDate)
      return toast.error("Please select a booking date and time");
    if (!selectedVehicle)
      return toast.error("Please select a vehicle for this booking");

    try {
      setSubmitLoading(true);
      const startAt = selectedDate.toDate();
      const now = new Date();
      if (startAt <= now) {
        toast.error("Booking time must be in the future");
        setSubmitLoading(false);
        return;
      }

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
          toast.error(`Garage opens at ${open.format("hh:mm A")}`);
          setSubmitLoading(false);
          return;
        }
        if (endTime.isAfter(close)) {
          toast.error(`Service must finish before ${close.format("hh:mm A")}`);
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
          vehicleJson: selectedVehicle,
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
    setSelectedVehicle(null);
    setSelectedDate(null);
    setNotes("");
    setTotalDuration(0);
    setTotalPrice(0);
  };

  const disabledDate = (current) =>
    current && current < dayjs().endOf("day").subtract(1, "day");

  // =================== UI ===================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4">
      <div className="mx-auto">
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
            <>
              <div className=" space-y-6">
                {/* 🚗 Vehicle Selection */}
                <div className="flex flex-col md:flex-row w-full gap-2">
                  <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Select Vehicle
                    </label>
                    <Select
                      placeholder="Select your vehicle"
                      options={vehicles.map((v, idx) => ({
                        label: `${v.make || "Unknown"} ${v.model || ""} ${v.year ? `(${v.year})` : ""
                          } — ${v.regNo || "N/A"}`,
                        value: idx,
                      }))}
                      value={
                        selectedVehicle
                          ? vehicles.findIndex(
                            (v) => v.vin === selectedVehicle.vin
                          )
                          : null
                      }
                      onChange={(idx) => setSelectedVehicle(vehicles[idx])}
                      size="large"
                      className="w-full"
                    />
                  </div>

                  {/* 🧾 Services */}
                  <div className="w-full md:w-1/2 ">
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
                        option?.label
                          ?.toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    />
                  </div>
                </div>

                {/* 🗓 Date & Time */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Select Date & Time
                  </label>
                  
                  {/* <DatePicker
                    showTime={{
                      format: "hh:mm A",
                      use12Hours: true,
                      hideDisabledOptions: true,
                    }}
                    format="YYYY-MM-DD hh:mm A"
                    className="w-full"
                    size="large"
                    value={selectedDate}
                    disabledDate={disabledDate}
                    onChange={setSelectedDate}
                    placeholder="Choose date and time"
                  /> */}

                </div>

                {/* Notes */}
                <div className="col-span-1 sm:col-span-2">
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
              </div>

              {/* ====== Summary Section ====== */}
              <div className="mt-6 bg-[#f9fbfd] rounded-xl p-4 border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">
                    Duration:{" "}
                    <span className="text-[#0f74b2]">
                      {minutesToHoursString(totalDuration)}
                    </span>
                  </span>
                </div>
                {/* <div className="font-semibold text-[#0f74b2] text-base sm:text-lg">
                  Total: ${totalPrice}
                </div> */}
              </div>

              {/* Garage Timings */}
              {businessSettings && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600">
                  <ClipboardEdit className="inline w-4 h-4 mr-1 text-[#0f74b2]" />
                  Garage Timings:{" "}
                  <span className="font-medium">
                    {businessSettings.openTime} — {businessSettings.closeTime}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end mt-8">
                <Button
                  type="primary"
                  size="large"
                  loading={submitLoading}
                  onClick={handleSubmit}
                  className="bg-[#0f74b2] hover:bg-blue-800 rounded-lg font-semibold shadow-md w-full sm:w-auto"
                >
                  Confirm Pre-Booking
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
