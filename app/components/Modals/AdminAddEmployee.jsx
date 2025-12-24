"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Loader2,
} from "lucide-react";
import { message } from "antd";

export default function AdminAddEmployee({ isOpen, onClose, fetchEmployees }) {
  const { token } = useAuth();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    hourlyRate: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

    try {
      const res = await fetch("/api/auth/admin/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName,
          email: form.email,
          password: form.password,
          phone: form.phone, // ✅ Only user table stores phone
          title: form.title,
          hourlyRate: Number(form.hourlyRate),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        message.success("✅ Employee created successfully!");
        fetchEmployees?.();
        onClose();

        // Reset form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          title: "",
          hourlyRate: "",
          password: "",
        });
      } else {
        message.error(data.error || "Failed to create employee");
      }
    } catch (err) {
      message.error("Network error while adding employee");
    } finally {
      setLoading(false);
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
          Add New Employee
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* First Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              First Name
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <User size={16} className="text-gray-400 mr-2" />
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Last Name
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <User size={16} className="text-gray-400 mr-2" />
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Phone Number
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <Phone size={16} className="text-gray-400 mr-2" />
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 300 1234567"
                pattern="[0-9+\s()-]*"
                required
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Email */}
          <div className="col-span-2">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <Mail size={16} className="text-gray-400 mr-2" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="col-span-2 relative">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Password
            </label>
            <div className="flex items-center border rounded-lg px-3 relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
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
          </div>

          {/* Title */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Title
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <Briefcase size={16} className="text-gray-400 mr-2" />
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Hourly Rate
            </label>
            <div className="flex items-center border rounded-lg px-3">
              <DollarSign size={16} className="text-gray-400 mr-2" />
              <input
                type="number"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                min="0"
                required
                className="w-full py-2 focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="col-span-2 flex justify-end gap-4 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 w-1/2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 w-1/2 bg-blue-bold text-white rounded-lg hover:bg-blue-theme disabled:opacity-50 flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4" /> Creating...
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
