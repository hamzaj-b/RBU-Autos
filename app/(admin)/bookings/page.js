"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Select, Input, Button, Card, Tag, Skeleton, Modal } from "antd";
import { Plus, Clock, UserPlus, Calendar, Car } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import CustomerModal from "@/app/components/app/CustomerModal";

const { TextArea } = Input;

export default function WalkInBookingPage() {
  const { token } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
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

  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    addressJson: {},
    vehicleJson: [
      {
        make: "",
        model: "",
        variant: "",
        year: "",
        vin: "",
        color: "",
        info: "",
      },
    ],
    notes: "",
  });

  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    variant: "",
    year: "",
    vin: "",
    color: "",
    info: "",
  });

  const minutesToHoursString = (minutes) => {
    if (!minutes || isNaN(minutes)) return "0h 0m";
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  // 🔹 Fetch Customers & Services
  const fetchData = async () => {
    if (!token) return;
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
          label: `${c.fullName} (${c.User?.[0]?.email || "no email"}) (${
            c.User?.[0]?.phone || "no number"
          })`,
          value: c.id,
          vehicles: Array.isArray(c.vehicleJson)
            ? c.vehicleJson
            : [c.vehicleJson],
        })) || []
      );

      setServices(
        servData.data?.map((s) => ({
          label: `${s.name} • (${minutesToHoursString(s.durationMinutes)}) • $${
            s.basePrice
          }`,
          value: s.id,
          duration: s.durationMinutes,
          price: s.basePrice,
          disabled: !s.isActive,
        })) || []
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers or services");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // 🔹 When customer selected → show their vehicles
  useEffect(() => {
    if (!selectedCustomer) {
      setCustomerVehicles([]);
      setSelectedVehicle(null);
      return;
    }

    const found = customers.find((c) => c.value === selectedCustomer);
    setCustomerVehicles(found?.vehicles || []);
  }, [selectedCustomer, customers]);

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
        data.availableEmployees.map((e) => ({ label: e.fullName, value: e.id }))
      );
      setBusyEmployees(data.busyEmployees || []);
      toast.success("Available employees fetched");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch employees");
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || selectedServices.length === 0) {
      toast.error("Select a customer and at least one service");
      return;
    }

    // 🧩 Extract selected vehicle object (if any)
    const vehicleObject =
      customerVehicles &&
      selectedVehicle !== undefined &&
      selectedVehicle !== null
        ? customerVehicles[selectedVehicle]
        : null;

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
          selectedVehicle: vehicleObject, // ✅ backend expects this key
          startAt,
          endAt,
          directAssignEmployeeId: selectedEmployee || null,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || "Booking created successfully!");
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create booking");
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedServices([]);
    setSelectedEmployee(null);
    setSelectedVehicle(null);
    setNotes("");
    setTotalDuration(0);
    setTotalPrice(0);
  };

  // 🔹 Add new vehicle for customer
  const handleAddVehicle = async () => {
    if (!selectedCustomer) {
      toast.error("Select a customer first");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/customers/${selectedCustomer}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleJson: [...customerVehicles, newVehicle],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Vehicle added successfully");
      setVehicleModalOpen(false);
      // Update customer list in memory
      const updatedList = customers.map((c) =>
        c.value === selectedCustomer
          ? { ...c, vehicles: [...(c.vehicles || []), newVehicle] }
          : c
      );
      setCustomers(updatedList);
      setCustomerVehicles([...customerVehicles, newVehicle]);
      setNewVehicle({
        make: "",
        model: "",
        variant: "",
        year: "",
        vin: "",
        color: "",
        info: "",
      });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add vehicle");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Add New Customer
  const handleSaveCustomer = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("First name, last name, and email are required!");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        fullName: `${formData.firstName} ${formData.lastName}`.trim(),
      };

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Customer added successfully!");

      // Refresh dropdown instantly
      const newCustomer = {
        label: `${payload.fullName} (${payload.email}) (${
          payload.phone || "no number"
        })`,
        value: data.profile.id,
        vehicles: payload.vehicleJson,
      };

      setCustomers((prev) => [newCustomer, ...prev]);
      setSelectedCustomer(newCustomer.value);
      setCustomerModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-10 px-4">
      {/* Header Buttons */}
      <div className="flex flex-col md:flex-row items-center md:justify-end gap-2 mb-4">
        <button
          onClick={() => setCustomerModalOpen(true)}
          className="bg-blue-theme hover:bg-blue-bold !text-white flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 rounded-md"
        >
          <Plus className="w-4 h-4" /> Add New Customer
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
            <Skeleton active />
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

              {/* Vehicle */}
              {customerVehicles?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Select Vehicle
                  </label>
                  <div className="flex gap-2">
                    <Select
                      placeholder="Select vehicle"
                      options={customerVehicles.map((v, idx) => ({
                        label: `${v.make} ${v.model} ${
                          v.variant ? `(${v.variant})` : ""
                        } - ${v.year || "N/A"}`,
                        value: idx,
                      }))}
                      value={selectedVehicle}
                      onChange={setSelectedVehicle}
                      className="flex-1"
                      size="large"
                    />
                    <Button
                      type="default"
                      onClick={() => setVehicleModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Car className="w-4 h-4" /> Add Vehicle
                    </Button>
                  </div>
                </div>
              )}

              {/* Services */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Services
                </label>
                <Select
                  mode="multiple"
                  placeholder="Select services"
                  options={services}
                  value={selectedServices}
                  onChange={setSelectedServices}
                  className="w-full"
                  size="large"
                  showSearch
                  allowClear
                />
              </div>

              {/* Duration & Price */}
              <div className="md:col-span-2 bg-[#f9fbfd] rounded-xl p-4 border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between gap-2">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Duration:{" "}
                    <span className="text-blue-600">
                      {minutesToHoursString(totalDuration)}
                    </span>
                  </span>
                  <span className="font-semibold text-[#0f74b2]">
                    Total: ${totalPrice}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Notes
                </label>
                <TextArea
                  rows={3}
                  placeholder="Add notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Employees */}
              <div className="md:col-span-2">
                <div className="flex justify-between mb-2">
                  <h4 className="font-semibold flex items-center gap-2 text-[#0f74b2]">
                    <UserPlus className="w-4 h-4" /> Assign Employee
                  </h4>
                  <Button
                    onClick={fetchAvailableEmployees}
                    type="primary"
                    className="bg-[#0f74b2]"
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
                {busyEmployees.length > 0 && (
                  <div className="mt-3 border-t pt-2">
                    <p className="text-sm text-gray-500">Busy Employees:</p>
                    <div className="flex flex-wrap gap-2">
                      {busyEmployees.map((emp) => (
                        <Tag key={emp.id} color="red">
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
              <div className="md:col-span-2 flex justify-end mt-4">
                <Button
                  type="primary"
                  size="large"
                  loading={submitLoading}
                  onClick={handleSubmit}
                  className="bg-[#0f74b2]"
                >
                  Create Booking
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* === Modals === */}
      <CustomerModal
        open={customerModalOpen}
        setOpen={setCustomerModalOpen}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        handleSave={handleSaveCustomer}
      />

      {/* Add Vehicle Modal */}
      <Modal
        open={vehicleModalOpen}
        onCancel={() => setVehicleModalOpen(false)}
        onOk={handleAddVehicle}
        confirmLoading={loading}
        title="Add Vehicle to Customer"
        okText="Save Vehicle"
      >
        <div className="grid grid-cols-2 gap-3 mt-3">
          {["make", "model", "variant", "year", "vin", "color", "info"].map(
            (key) => (
              <Input
                key={key}
                placeholder={key.toUpperCase()}
                value={newVehicle[key]}
                onChange={(e) =>
                  setNewVehicle((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            )
          )}
        </div>
      </Modal>
    </div>
  );
}
