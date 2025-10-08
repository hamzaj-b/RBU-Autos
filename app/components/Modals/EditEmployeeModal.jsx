"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input, Switch, Spin, message } from "antd";

export default function EditEmployeeModal({ isOpen, onClose, employeeId, onUpdated }) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    title: "",
    hourlyRate: "",
    isActive: true,
  });

  // Fetch current employee info
  useEffect(() => {
    if (!isOpen || !employeeId) return;

    const fetchEmployee = async () => {
      setFetching(true);
      try {
        const res = await fetch(`/api/auth/admin/employee/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setFormData({
            fullName: data.employee.fullName || "",
            email: data.employee.User?.[0]?.email || "",
            title: data.employee.title || "",
            hourlyRate: data.employee.hourlyRate || "",
            isActive: data.employee.User?.[0]?.isActive ?? true,
          });
        } else {
          message.error(data.error || "Failed to fetch employee");
        }
      } catch (err) {
        console.error(err);
        message.error("Network error while fetching employee");
      } finally {
        setFetching(false);
      }
    };

    fetchEmployee();
  }, [isOpen, employeeId, token]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.fullName || !formData.title || !formData.hourlyRate) {
      return message.warning("Please fill all required fields");
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/admin/employee/${employeeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        message.success("Employee updated successfully!");
        onUpdated && onUpdated(data.employee); // callback to parent
        onClose();
      } else {
        message.error(data.error || "Failed to update employee");
      }
    } catch (err) {
      console.error(err);
      message.error("Network error while updating employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl leading-none"
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Edit Employee
        </h2>

        {fetching ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Full Name</label>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <Input
                name="email"
                value={formData.email}
                disabled
                placeholder="Email"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Title"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Hourly Rate</label>
              <Input
                name="hourlyRate"
                type="number"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="Hourly Rate"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700 font-medium">Active Status</span>
              <Switch
                checked={formData.isActive}
                onChange={(val) => setFormData((prev) => ({ ...prev, isActive: val }))}
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button
                type="button"
                onClick={onClose}
                className="w-1/2 bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="w-1/2 bg-blue-theme text-white hover:bg-blue-bold"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
