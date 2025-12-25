"use client";

import React, { useEffect, useState } from "react";
import { Modal, Input } from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";

export default function CustomerModal({
  open,
  setOpen,
  formData,
  setFormData,
  handleSave,
  loading,
  editingCustomer,
}) {
  /* -------------------------------
     Local Phone State (UI only)
  -------------------------------- */
  const [phoneValue, setPhoneValue] = useState(formData.phone || "");
  const [phoneError, setPhoneError] = useState("");

  /* -------------------------------
     Sync phone when editing
  -------------------------------- */
  useEffect(() => {
    setPhoneValue(formData.phone || "");
  }, [formData.phone]);

  /* -------------------------------
     Vehicles
  -------------------------------- */
  const vehicles = Array.isArray(formData.vehicleJson)
    ? formData.vehicleJson
    : [
        formData.vehicleJson || {
          make: "",
          model: "",
          variant: "",
          year: "",
          vin: "",
          color: "",
          info: "",
        },
      ];

  const addVehicle = () => {
    setFormData((p) => ({
      ...p,
      vehicleJson: [
        ...(Array.isArray(p.vehicleJson) ? p.vehicleJson : []),
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
    }));
  };

  const removeVehicle = (index) => {
    setFormData((p) => ({
      ...p,
      vehicleJson: p.vehicleJson.filter((_, i) => i !== index),
    }));
  };

  const handleVehicleChange = (index, key, value) => {
    setFormData((p) => ({
      ...p,
      vehicleJson: p.vehicleJson.map((v, i) =>
        i === index ? { ...v, [key]: value } : v
      ),
    }));
  };

  /* -------------------------------
     Save with STRICT phone validation
  -------------------------------- */
  const onSave = () => {
    if (!formData.phone) {
      setPhoneError("Phone number is required");
      return;
    }

    // Extract digits only
    const digits = formData.phone.replace(/\D/g, "");

    // Remove country code digits (for CA/US = 1)
    // Minimum local length = 10 digits
    const localLength = digits.length - 1;

    if (localLength < 9) {
      setPhoneError("Please enter a valid phone number (min 9 digits)");
      return;
    }

    setPhoneError("");
    handleSave();
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={700}
      centered
      title={
        <div className="text-xl font-semibold">
          {editingCustomer ? "Edit Customer" : "Add New Customer"}
        </div>
      }
    >
      <div className="space-y-6 mt-4 overflow-y-auto">
        {/* 👤 Basic Info */}
        <div className="bg-gray-50 border rounded-xl p-4">
          <h3 className="font-semibold mb-3">👤 Basic Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, firstName: e.target.value }))
              }
            />

            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData((p) => ({ ...p, lastName: e.target.value }))
              }
            />

            <Input
              placeholder="Email"
              value={formData.email}
              onChange={(e) =>
                setFormData((p) => ({ ...p, email: e.target.value }))
              }
            />

            {/* ✅ PHONE INPUT (Strict validation) */}
            <div>
              <PhoneInput
                country="ca"
                enableSearch
                value={phoneValue}
                onChange={(value, country) => {
                  setPhoneValue(value);
                  setPhoneError("");

                  const local = value.slice(country.dialCode.length);

                  setFormData((p) => ({
                    ...p,
                    phone: local
                      ? `+${country.dialCode} ${local}`
                      : `+${country.dialCode}`,
                  }));
                }}
                inputStyle={{
                  width: "100%",
                  height: "40px",
                }}
                containerStyle={{ width: "100%" }}
                placeholder="Phone number"
              />

              {phoneError && (
                <p className="text-red-500 text-xs mt-1">{phoneError}</p>
              )}
            </div>
          </div>
        </div>

        {/* 🚗 Vehicles */}
        {vehicles.map((vehicle, index) => (
          <div key={index} className="bg-gray-50 border rounded-xl p-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">
                🚗 Vehicle {vehicles.length > 1 && `#${index + 1}`}
              </h3>
              {vehicles.length > 1 && (
                <Trash2
                  size={18}
                  className="text-red-500 cursor-pointer"
                  onClick={() => removeVehicle(index)}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {["make", "model", "variant", "year", "vin", "color", "info"].map(
                (key) => (
                  <Input
                    key={key}
                    placeholder={key.toUpperCase()}
                    value={vehicle[key] || ""}
                    onChange={(e) =>
                      handleVehicleChange(index, key, e.target.value)
                    }
                  />
                )
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button variant="outline" onClick={addVehicle}>
            <PlusCircle size={16} /> Add Vehicle
          </Button>
        </div>

        {/* 💾 Save */}
        <Button
          onClick={onSave}
          disabled={loading}
          className="w-full bg-blue-theme hover:bg-blue-bold !text-white"
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
