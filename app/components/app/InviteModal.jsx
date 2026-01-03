"use client";

import React, { useEffect, useState } from "react";
import { Modal, Input } from "antd";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function InviteModal({
  open,
  setOpen,
  formData,
  setFormData,
  handleInvite,
  loading,
}) {
  /* -------------------------------
     Local Phone State (UI only)
  -------------------------------- */
  const [phoneValue, setPhoneValue] = useState(formData.phone || "");
  const [phoneError, setPhoneError] = useState("");

  /* -------------------------------
     Sync phone when modal opens / edits
  -------------------------------- */
  useEffect(() => {
    setPhoneValue(formData.phone || "");
  }, [formData.phone]);

  /* -------------------------------
     Invite with STRICT phone validation
  -------------------------------- */
  const onInvite = () => {
    if (!formData.phone) {
      setPhoneError("Phone number is required");
      return;
    }

    // Extract digits only
    const digits = formData.phone.replace(/\D/g, "");

    // CA/US country code = 1 → local digits must be >= 10
    const localLength = digits.length - 1;

    if (localLength < 9) {
      setPhoneError("Please enter a valid phone number (min 9 digits)");
      return;
    }

    setPhoneError("");
    handleInvite(); // ✅ parent already has correct phone
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={550}
      centered
      className="rounded-2xl"
      title={
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-gray-800">
            ✉️ Invite New Customer
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Send a password setup link directly to the customer’s email.
          </p>
        </div>
      }
    >
      <div className="space-y-6 mt-4">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-700 mb-3">
            👤 Customer Information
          </h3>

          {/* Full Name */}
          <label className="text-sm font-medium text-gray-600">Full Name</label>
          <Input
            placeholder="Full Name"
            value={formData.fullName}
            onChange={(e) =>
              setFormData((p) => ({ ...p, fullName: e.target.value }))
            }
          />

          {/* Email */}
          <label className="text-sm font-medium text-gray-600 mt-3 block">
            Email
          </label>
          <Input
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData((p) => ({ ...p, email: e.target.value }))
            }
          />

          {/* ✅ PHONE INPUT (STRICT + SYNCED) */}
          <label className="text-sm font-medium text-gray-600 mt-3 block">
            Phone
          </label>
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
            dropdownStyle={{ zIndex: 2000 }}
            placeholder="Phone number"
          />

          {phoneError && (
            <p className="text-red-500 text-xs mt-1">{phoneError}</p>
          )}
        </div>

        <Button
          onClick={onInvite}
          disabled={loading}
          className={`w-full font-medium py-2.5 rounded-lg shadow-md ${
            loading
              ? "bg-gray-300 text-gray-700"
              : "bg-amber-500 hover:bg-amber-600 text-white!"
          }`}
        >
          <Send className="w-4 h-4 mr-2" />
          {loading ? "Sending Invite..." : "Invite Customer"}
        </Button>
      </div>
    </Modal>
  );
}
