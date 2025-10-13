"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Home,
  Edit2,
  Car,
  NotebookIcon,
  PersonStandingIcon,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Input, message, Spin } from "antd";

export default function ProfilePage() {
  const { user, token } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [adminData, setAdminData] = useState(null);
console.log("PRofile user" , user);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    createdAt: "",
  });

  // ==================================================
  // 👤 CUSTOMER PROFILE FETCH
  // ==================================================
  useEffect(() => {
    const fetchCustomer = async () => {
      if (user?.userType === "CUSTOMER" && token) {
        try {
          setLoading(true);
          const res = await fetch(`/api/customers/${user.customerId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setCustomerData(data.customer);
            setFormData({
              fullName: data.customer.fullName,
              email: data.customer.User?.[0]?.email,
              createdAt: data.customer.User?.[0]?.createdAt,
              phone: data.customer.phone || "",
              address: data.customer.addressJson || "",
              notes: data.customer.notes || "",
            });
          } else {
            message.error(data.error || "Failed to fetch customer data");
          }
        } catch (err) {
          console.error(err);
          message.error("Error fetching customer data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCustomer();
  }, [user, token]);

  // ==================================================
  // 👷 EMPLOYEE PROFILE FETCH
  // ==================================================
  useEffect(() => {
    const fetchEmployee = async () => {
      if (user?.userType === "EMPLOYEE" && token) {
        try {
          setLoading(true);
          const res = await fetch(`/api/auth/admin/employee`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            setEmployeeData(data.employee);
          } else {
            message.error(data.error || "Failed to fetch employee profile");
          }
        } catch (err) {
          console.error("Error fetching employee:", err);
          message.error("Error fetching employee profile");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchEmployee();
  }, [user, token]);

  // ==================================================
  // 👑 ADMIN PROFILE FETCH
  // ==================================================
  useEffect(() => {
    const fetchAdmin = async () => {
      if (user?.userType === "ADMIN" && token) {
        try {
          setLoading(true);
          const res = await fetch(`/api/auth/admin/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) {
            // here assuming admin has same structure as employee
            setAdminData(data.admin);
            setFormData({
              fullName: data.employee.fullName,
              email: data.employee.User?.email,
              phone: data.employee.phone || "",
              address: data.employee.address || "",
              notes: data.employee.notes || "",
              createdAt: data.employee.User?.createdAt || "",
            });
          } else {
            message.error(data.error || "Failed to fetch admin data");
          }
        } catch (err) {
          console.error(err);
          message.error("Error fetching admin profile");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAdmin();
  }, [user, token]);

  // ==================================================
  // 📝 Handle input changes
  // ==================================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ==================================================
  // 💾 Save profile (Admin & Customer)
  // ==================================================
  const handleSave = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      if (user?.userType === "CUSTOMER") endpoint = `/api/customers/${customerData.id}`;
      if (user?.userType === "ADMIN") endpoint = `/api/auth/admin/${adminData.id}`; // change if you have a dedicated PUT endpoint

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        message.success("Profile updated successfully!");
        setIsEditing(false);
      } else {
        message.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error(err);
      message.error("Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // ⏳ Loading spinner
  // ==================================================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // ==================================================
  // 👑 ADMIN VIEW (Editable same as CUSTOMER)
  // ==================================================
  if (user?.userType === "ADMIN" && adminData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
          {/* Left Section */}
          <div className="flex flex-col items-center md:w-1/3 space-y-2">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-600 to-blue-400 text-white font-semibold text-2xl shadow-xl mb-4">
              {formData.fullName
                ?.split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-800">{adminData.email}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ADMIN</p>
          </div>

          {/* Right Section */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-center gap-4">
                <PersonStandingIcon className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.fullName}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.phone}</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center gap-4">
                <Home className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.address}</span>
                )}
              </div>

              {/* Notes */}
              <div className="flex items-center gap-4">
                <NotebookIcon className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.notes}</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-blue-theme !text-white hover:bg-blue-bold"
                  >
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-theme !text-white hover:bg-blue-bold"
                >
                  <Edit2 className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // 👷 EMPLOYEE VIEW (Read-only)
  // ==================================================
  console.log("EMployeeData", employeeData);
  // ==================================================
  // 👷 EMPLOYEE VIEW
  // ==================================================
  if (user?.userType === "EMPLOYEE") {
    if (!employeeData) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
          {/* Left Section - Avatar */}
          <div className="flex flex-col items-center md:w-1/3 space-y-2">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 !text-white font-semibold text-2xl shadow-xl mb-4">
              {employeeData.fullName
                ?.split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-500">{employeeData.User?.[0]?.email}</span>
            </div>
            <p className="text-lg text-gray-500 mt-1">{employeeData?.title}</p>
          </div>

          {/* Right Section - Details */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <PersonStandingIcon className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-medium text-gray-800">{employeeData.fullName}</span>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-medium text-gray-800">
                  {employeeData.phone || "No phone provided"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Home className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-medium text-gray-800">
                  {employeeData.address || "No address provided"}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-gray-600" />
                <span className="text-lg font-medium text-gray-800">
                  Total Logged Hours:{" "}
                  <span className="font-semibold text-emerald-700">
                    {employeeData.totalLoggedHours} hrs
                  </span>
                </span>
              </div>

              {/* Session History */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-gray-600" />
                  Recent Sessions
                </h3>
                <div className="space-y-2">
                  {employeeData.Sessions?.length > 0 ? (
                    employeeData.Sessions.slice(0, 5).map((s) => (
                      <div
                        key={s.id}
                        className="flex justify-between items-center text-sm border-b py-1 text-gray-600"
                      >
                        <span>{new Date(s.loginAt).toLocaleString()}</span>
                        <span>
                          {s.logoutAt ? new Date(s.logoutAt).toLocaleString() : "Active"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No sessions found.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ❌ No Edit button */}
            <div className="text-sm text-gray-400 italic">
              (Employee profiles are read-only)
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // 👤 CUSTOMER VIEW (Editable)
  // ==================================================
  if (user?.userType === "CUSTOMER" && customerData) {
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
          {/* Left Section - Avatar */}
          <div className="flex flex-col items-center md:w-1/3 space-y-2">
            <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-600 to-blue-400 text-white font-semibold text-2xl shadow-xl mb-4">
              {formData.fullName
                ?.split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-800">{formData.email}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{user?.userType}</p>
          </div>

          {/* Right Section - Details */}
          <div className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Full Name */}
              <div className="flex items-center gap-4">
                <PersonStandingIcon className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.fullName}</span>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.phone}</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center gap-4">
                <Home className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Address"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.address}</span>
                )}
              </div>

              {/* Vehicle */}
              <div className="flex items-center gap-4">
                <Car className="w-6 h-6 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={handleChange}
                    placeholder="Vehicle"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.vehicle}</span>
                )}
              </div>

              {/* Notes */}
              <div className="flex items-center gap-4">
                <NotebookIcon className="w-5 h-5 text-gray-600" />
                {isEditing ? (
                  <Input
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Notes"
                    className="w-full"
                  />
                ) : (
                  <span className="text-lg font-medium text-gray-800">{formData.notes}</span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-blue-theme !text-white hover:bg-blue-bold"
                  >
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-theme !text-white hover:bg-blue-bold"
                >
                  <Edit2 className="w-5 h-5 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
  }

  return null;
}
