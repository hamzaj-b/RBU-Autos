"use client";
import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Eye, EyeOff } from "lucide-react"; // 👁️ Import icons

// ✅ Helper function: builds the API payload
const buildEmployeePayload = ({
  token,
  firstName,
  lastName,
  email,
  password,
  title,
  hourlyRate,
  phoneNumber, // ✅ Added phone number
}) => {
  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
  return {
    token,
    email,
    password,
    fullName,
    title,
    phoneNumber,
    hourlyRate: Number(hourlyRate),
  };
};

export default function AdminAddEmployee({ isOpen, onClose, fetchEmployees }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // ✅ New state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // ✅ Toggle state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { token } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // ✅ Build payload using helper
      const payload = buildEmployeePayload({
        token,
        firstName,
        lastName,
        email,
        password,
        title,
        hourlyRate,
        phoneNumber,
      });

      const res = await fetch("/api/auth/admin/employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (res.ok) {
        setMessage("✅ Employee created!");
        onClose();
        fetchEmployees();
        // Reset fields
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setTitle("");
        setHourlyRate("");
        setPhoneNumber("");
      } else {
        setMessage(`❌ ${data.error || "Failed to create employee"}`);
      }
    } catch (error) {
      console.error("API Error:", error);
      setMessage("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        {/* ✖ Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Add New Employee
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ✅ First Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ Last Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ Phone Number */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              pattern="[0-9+\s()-]*"
              placeholder="e.g. +44 7123 456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* ✅ Password with Eye Toggle */}
          <div className="relative">
            <label className="block text-gray-700 font-medium mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[32px] md:top-[30px] text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Hourly Rate
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {message && (
            <p
              className={`text-center text-sm ${
                message.startsWith("✅") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          <div className="flex justify-end gap-4 w-full mt-6">
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
              className="px-4 py-2 w-1/2 bg-blue-bold !text-white rounded-lg hover:bg-blue-theme disabled:opacity-50 transition"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
