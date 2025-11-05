"use client";
import { Modal, Input } from "antd";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import React from "react";

export default function CustomerModal({
  open,
  setOpen,
  formData,
  setFormData,
  handleSave,
  loading,
  editingCustomer,
}) {
  // Ensure vehicleJson is an array
  const vehicles = Array.isArray(formData.vehicleJson)
    ? formData.vehicleJson
    : [formData.vehicleJson || { make: "", model: "", variant: "", info: "" , color: "" }];

  // ✅ Add another vehicle block
  const addVehicle = () => {
    setFormData((p) => ({
      ...p,
      vehicleJson: [
        ...(Array.isArray(p.vehicleJson) ? p.vehicleJson : []),
        { make: "", model: "", variant: "", info: "" , color: "" },
      ],
    }));
  };

  // ✅ Remove a specific vehicle
  const removeVehicle = (index) => {
    setFormData((p) => ({
      ...p,
      vehicleJson: p.vehicleJson.filter((_, i) => i !== index),
    }));
  };

  // ✅ Update specific vehicle field
  const handleVehicleChange = (index, key, value) => {
    setFormData((p) => ({
      ...p,
      vehicleJson: p.vehicleJson.map((veh, i) =>
        i === index ? { ...veh, [key]: value } : veh
      ),
    }));
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={700}
      centered
      className="rounded-2xl overflow-hidden"
      title={
        <div className="text-xl font-semibold text-gray-800 flex flex-col">
          {editingCustomer ? "Edit Customer" : "Add New Customer"}
          <span className="text-sm font-normal text-gray-500">
            {editingCustomer
              ? "Update existing details"
              : "Create a new profile"}
          </span>
        </div>
      }
    >
      <div className="space-y-6 mt-4 h-[80vh] overflow-y-auto">
        {/* 👤 Basic Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            👤 Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, fullName: e.target.value }))
              }
            />
            <Input
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
            />
            <Input
              placeholder="Phone number"
              value={formData.number}
              onChange={(e) =>
                setFormData((p) => ({ ...p, number: e.target.value }))
              }
            />
          </div>
        </div>

        {/* 🚗 Vehicle Info (Dynamic Sections) */}
        {vehicles.map((vehicle, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm relative"
          >
            <h3 className="text-base font-semibold text-gray-700 mb-3 flex justify-between items-center">
              🚗 Vehicle Details {vehicles.length > 1 && `#${index + 1}`}
              {vehicles.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVehicle(index)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove Vehicle"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {["make", "model", "variant", "info" , "color"].map((key) => (
                <Input
                  key={key}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                  value={vehicle[key] || ""}
                  onChange={(e) =>
                    handleVehicleChange(index, key, e.target.value)
                  }
                />
              ))}
            </div>
          </div>
        ))}

        {/* ➕ Add Another Vehicle */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={addVehicle}
            variant="outline"
            className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <PlusCircle size={18} /> Add Another Vehicle
          </Button>
        </div>

        {/* 🏠 Address */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            🏠 Address
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="City"
              value={formData.addressJson?.city || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  addressJson: { ...p.addressJson, city: e.target.value },
                }))
              }
            />
            <Input
              placeholder="Street"
              value={formData.addressJson?.street || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  addressJson: { ...p.addressJson, street: e.target.value },
                }))
              }
            />
            <Input
              placeholder="House / Apartment"
              value={formData.addressJson?.house || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  addressJson: { ...p.addressJson, house: e.target.value },
                }))
              }
            />
            <Input
              placeholder="State / Region"
              value={formData.addressJson?.state || ""}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  addressJson: { ...p.addressJson, state: e.target.value },
                }))
              }
            />
          </div>
        </div>

        {/* 📝 Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            📝 Notes
          </h3>
          <Input.TextArea
            rows={3}
            placeholder="Add any additional notes..."
            value={formData.notes}
            onChange={(e) =>
              setFormData((p) => ({ ...p, notes: e.target.value }))
            }
          />
        </div>

        {/* 💾 Save */}
        <Button
          onClick={handleSave}
          disabled={loading}
          className={`w-full font-medium py-2.5 rounded-lg shadow-md ${
            loading
              ? "bg-gray-300 text-gray-700"
              : "bg-blue-theme hover:bg-blue-bold !text-white"
          }`}
        >
          {loading
            ? "Saving..."
            : editingCustomer
            ? "Update Customer"
            : "Create Customer"}
        </Button>
      </div>
    </Modal>
  );
}
