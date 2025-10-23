"use client";
import { Modal, Input } from "antd";
import { Button } from "@/components/ui/button";

export default function CustomerModal({
  open,
  setOpen,
  formData,
  setFormData,
  handleSave,
  loading,
  editingCustomer,
}) {
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
      <div className="space-y-6 mt-4">
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
          </div>
        </div>

        {/* 🚗 Vehicle Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            🚗 Vehicle Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {["make", "model", "variant", "info"].map((key) => (
              <Input
                key={key}
                placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                value={formData.vehicleJson?.[key] || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    vehicleJson: {
                      ...p.vehicleJson,
                      [key]: e.target.value,
                    },
                  }))
                }
              />
            ))}
          </div>
        </div>

        {/* 🏠 Address (Fixed Structured Inputs) */}
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
