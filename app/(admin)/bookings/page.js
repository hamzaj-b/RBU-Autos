"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Select, Input, Button, Card, Tag, Skeleton } from "antd";
import { Plus, Clock, UserPlus, Calendar, Send } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import InviteModal from "@/app/components/app/InviteModal";
import CustomerModal from "@/app/components/app/CustomerModal";


const { TextArea } = Input;

export default function WalkInBookingPage() {
  const { token } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [busyEmployees, setBusyEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [notes, setNotes] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    addressJson: "",
    vehicleJson: { make: "", model: "", variant: "", info: "" },
    notes: "",
  });

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
  };
  const handleAddCustomerModal = () => {
    setModalOpen(false);
  };

  const minutesToHoursString = (minutes) => {
  if (!minutes || isNaN(minutes)) return "0h 0m";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
};

  // 🔹 Fetch Customers & Services
  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
        const [custRes, servRes] = await Promise.all([
          fetch("/api/customers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/services", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [custData, servData] = await Promise.all([
          custRes.json(),
          servRes.json(),
        ]);

        setCustomers(
          custData.customers?.map((c) => ({
            label: `${c.fullName} (${c.User?.[0]?.email || "no email"})`,
            value: c.id,
          })) || []
        );

        setServices(
          servData.data?.map((s) => ({
            label: `${s.name} • (${minutesToHoursString(s.durationMinutes)}) • $ ${s.basePrice})`,
            value: s.id,
            duration: s.durationMinutes,
            price: s.basePrice,
            disabled: !s.isActive, // 👈 disables instead of hiding
          })) || []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load customers or services");
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // 🔹 Auto Calculate Totals
  useEffect(() => {
    const selected = services.filter((s) => selectedServices.includes(s.value));
    const totalDur = selected.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalCost = selected.reduce((sum, s) => sum + (s.price || 0), 0);
    setTotalDuration(totalDur);
    setTotalPrice(totalCost);
  }, [selectedServices, services]);

  // 🔹 Fetch Available Employees
  const fetchAvailableEmployees = async () => {
    if (!token) return;

    try {
      setEmployeeLoading(true);
      const now = new Date().toISOString();
      const res = await fetch(`/api/available-employees?time=${now}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setAvailableEmployees(
        data.availableEmployees.map((e) => ({
          label: e.fullName,
          value: e.id,
        }))
      );
      setBusyEmployees(data.busyEmployees || []);

      // toast.dismiss();
      toast.success("Available employees fetched successfully");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to fetch available employees");
    } finally {
      setEmployeeLoading(false);
    }
  };

  // 🔹 Submit Walk-in Booking
  const handleSubmit = async () => {
    if (!selectedCustomer || selectedServices.length === 0) {
      toast.error("Select a customer and at least one service");
      return;
    }

    try {
      setSubmitLoading(true);

      const startAt = new Date();
      const endAt = new Date(startAt.getTime() + totalDuration * 60000);

      const res = await fetch("/api/bookings/walkin", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer,
          serviceIds: selectedServices,
          startAt,
          endAt,
          directAssignEmployeeId: selectedEmployee || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.dismiss();
      toast.success(data.message || "Walk-in booking created successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error(err.message || "Failed to create booking");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedServices([]);
    setSelectedEmployee(null);
    setNotes("");
    setTotalDuration(0);
    setTotalPrice(0);
  };

  const handleSave = async () => {
    const isEdit = !!editingCustomer;
    if (!formData.fullName || !formData.email) {
      message.warning("Full name and email are required");
      toast.error("Full name and email are required!");
      return;
    }

    try {
      setLoading(true);
      const url = "/api/customers";
      const method =  "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        handleAddCustomerModal();
        toast.success(
          isEdit
            ? "Customer updated successfully!"
            : "Customer created successfully!"
        );
        fetchData();
      } else {
        message.error(data.error || "Operation failed");
        toast.error(data.error || "Failed to save customer!");
      }
    } catch (err) {
      console.error("Save customer error:", err);
      message.error("Unexpected error");
      toast.error("Unexpected error occurred while saving!");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!formData.fullName || !formData.email) {
      message.warning("Full name and email required");
      toast.error("Full name and email required to send invite!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/auth/admin/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: formData.email,
          fullName: formData.fullName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        handleCloseInviteModal();
        toast.success("Invite email sent successfully!");
        fetchData();
      } else {
        message.error(data.error || "Failed to send invite");
        toast.error(data.error || "Failed to send customer invite!");
      }
    } catch (err) {
      console.error("Invite error:", err);
      message.error("Unexpected error");
      toast.error("Unexpected error while sending invite!");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4">
      <div className="flex flex-col md:flex-row items-center md:justify-end gap-2 mb-4">
      <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                fullName: "",
                email: "",
                addressJson: "",
                vehicleJson: { make: "", model: "", variant: "", info: "" },
                notes: "",
              });
              setModalOpen(true);
            }}
            className="bg-blue-theme hover:bg-blue-bold !text-white flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 rounded-md"
            
          >
            <Plus className="w-4 h-4" /> Add Customer
          </button>
          <button
           variant="default"
           onClick={() => {
             setFormData({ fullName: "", email: "" });
             setInviteModalOpen(true);
           }}
           className="bg-amber-500 hover:bg-amber-600 !text-white flex items-center gap-2 w-full sm:w-auto justify-center  px-4 py-2 rounded-md"
         >
           <Send className="w-4 h-4" /> Invite Customer
          </button>
      </div>
      <div className="w-full mx-auto">
        <Card
          className="shadow-lg rounded-2xl border border-gray-100"
          title={
            <div className="flex items-center gap-2 text-[#0f74b2]">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold text-lg">Walk-In Booking</span>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Customer
                </label>
                <Select
                  placeholder="Search or select customer"
                  options={customers}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  className="w-full"
                  size="large"
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    option?.label?.toLowerCase().includes(input.toLowerCase())
                  }
                />
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Services
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

              {/* Duration & Cost */}
              <div className="col-span-1 md:col-span-2 bg-[#f9fbfd] rounded-xl p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">
                      Total Duration(Estimated):{" "}
                      <span className="text-[#0f74b2]">{totalDuration}</span>{" "}
                      min
                    </span>
                  </div>
                  <span className="font-semibold text-[#0f74b2]">
                    Total Price(Estimated): $ {totalPrice}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Notes
                </label>
                <TextArea
                  rows={3}
                  placeholder="Enter notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                />
              </div>

              {/* Employees */}
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2 text-[#0f74b2]">
                    <UserPlus className="w-4 h-4" />
                    Assign Employee
                  </h4>
                  <Button
                    size="small"
                    onClick={fetchAvailableEmployees}
                    type="primary"
                    className="bg-[#0f74b2] hover:bg-blue-800 border-none text-white"
                    loading={employeeLoading}
                  >
                    Check Available Employees
                  </Button>
                </div>

                <Select
                  showSearch
                  placeholder="Select available employee (optional)"
                  options={availableEmployees}
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  allowClear
                  className="w-full"
                  size="large"
                  disabled={employeeLoading}
                />

                {/* Busy Employees */}
                {busyEmployees.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Busy Employees:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {busyEmployees.map((emp) => (
                        <Tag
                          key={emp.id}
                          color="red"
                          className="px-3 py-1 text-xs font-medium"
                        >
                          {emp.fullName} — busy till{" "}
                          {new Date(emp.busyUntil).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="col-span-1 md:col-span-2 flex justify-end mt-4">
                <Button
                  type="primary"
                  size="large"
                  loading={submitLoading}
                  onClick={handleSubmit}
                  className="bg-[#0f74b2] hover:bg-blue-800 rounded-lg font-semibold shadow-md"
                >
                  Create Booking
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <CustomerModal
        open={modalOpen}
        setOpen={setModalOpen}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        editingCustomer={editingCustomer}
        handleSave={handleSave}
      />
      <InviteModal
        open={inviteModalOpen}
        setOpen={setInviteModalOpen}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        handleInvite={handleInvite}
      />
    </div>
  );
}
