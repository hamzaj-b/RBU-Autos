"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  Briefcase,
  DollarSign,
  KeyRound,
} from "lucide-react";
import { message, Spin } from "antd";

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employeeId,
  onUpdated,
}) {
  const { token } = useAuth();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingMain, setSavingMain] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔹 Fetch employee details
  useEffect(() => {
    if (!employeeId || !isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/auth/admin/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          const [first, last] = (data.employee.fullName || "").split(" ");
          setForm({
            ...data.employee,
            firstName: first || "",
            lastName: last || "",
            phoneNumber: data.employee.User?.[0]?.phone || "", // ✅ Phone now from User
            password: "",
          });
        } else message.error(data.error || "Failed to fetch employee");
      } catch {
        message.error("Error fetching employee details");
      } finally {
        setLoading(false);
      }
    })();
  }, [employeeId, isOpen, token]);

  if (!isOpen) return null;

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  // 🔹 Save employee details (PUT)
  const handleSave = async (e) => {
    e.preventDefault();
    setSavingMain(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    try {
      const res = await fetch(`/api/auth/admin/employee/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          title: form.title,
          phone: form.phoneNumber, // ✅ Send phone to backend (User table)
          hourlyRate: Number(form.hourlyRate),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success("✅ Employee details updated successfully!");
        onUpdated?.(data.employee);
        onClose();
      } else message.error(data.error || "Failed to update employee");
    } catch {
      message.error("Network error while saving employee");
    } finally {
      setSavingMain(false);
    }
  };

  // 🔹 Change password
  const handlePasswordChange = async () => {
    if (!form.password) return message.warning("Please enter a new password");
    setSavingPassword(true);
    try {
      const res = await fetch(
        `/api/auth/admin/employee/${employeeId}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password: form.password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        message.success("🔐 Password updated successfully!");
        setForm((p) => ({ ...p, password: "" }));
      } else message.error(data.error || "Failed to update password");
    } catch {
      message.error("Error updating password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Edit Employee
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500">
            <Spin size="large" />
            <p className="mt-3 text-sm">Loading employee details...</p>
          </div>
        ) : form ? (
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* First Name */}
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                First Name
              </label>
              <div className="flex items-center border rounded-lg px-3">
                <User size={16} className="text-gray-400 mr-2" />
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Last Name */}
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Last Name
              </label>
              <div className="flex items-center border rounded-lg px-3">
                <User size={16} className="text-gray-400 mr-2" />
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Phone Number
              </label>
              <div className="flex items-center border rounded-lg px-3">
                <Phone size={16} className="text-gray-400 mr-2" />
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. +1 300 1234567"
                  className="w-full py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div className="col-span-2">
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Email
              </label>
              <div className="flex items-center border rounded-lg px-3 bg-gray-50">
                <Mail size={16} className="text-gray-400 mr-2" />
                <input
                  readOnly
                  value={form.User?.[0]?.email || form.email || ""}
                  className="w-full py-2 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Title
              </label>
              <div className="flex items-center border rounded-lg px-3">
                <Briefcase size={16} className="text-gray-400 mr-2" />
                <input
                  name="title"
                  value={form.title || ""}
                  onChange={handleChange}
                  className="w-full py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Hourly Rate
              </label>
              <div className="flex items-center border rounded-lg px-3">
                <DollarSign size={16} className="text-gray-400 mr-2" />
                <input
                  type="number"
                  name="hourlyRate"
                  value={form.hourlyRate || ""}
                  onChange={handleChange}
                  className="w-full py-2 focus:outline-none"
                />
              </div>
            </div>

            {/* Password Reset */}
            <div className="col-span-2 mt-3 border-t pt-3">
              <label className="text-sm text-gray-600 font-medium mb-1 block">
                Reset / Change Password
              </label>
              <div className="relative flex items-center border rounded-lg px-3">
                <KeyRound size={16} className="text-gray-400 mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className="w-full py-2 focus:outline-none pr-8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                onClick={handlePasswordChange}
                disabled={savingPassword}
                className="!mt-2 px-3 py-1.5 text-sm bg-blue-bold !text-white rounded-md hover:bg-blue-theme disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <Spin size="small" /> <span>Updating...</span>
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end gap-4 mt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 w-1/2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingMain}
                className="px-4 py-2 w-1/2 bg-blue-bold !text-white rounded-lg hover:bg-blue-theme disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingMain ? (
                  <>
                    <Spin size="small" /> <span>Saving...</span>
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-10 text-gray-500">
            Unable to load employee data.
          </div>
        )}
      </div>
    </div>
  );
}
