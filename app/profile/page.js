"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Home,
  NotebookIcon,
  PersonStandingIcon,
  Edit2,
  Clock,
  LogOut,
  Car,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, message, Spin, Switch, Card } from "antd";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    password: "",
    isActive: true,
    vehicle: { make: "", year: "", model: "", regNo: "" },
  });

  // =====================================================
  // 🔹 Fetch Profile Based on Role
  // =====================================================
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !token) return;
      try {
        setLoading(true);
        let url = "";
        if (user.userType === "CUSTOMER")
          url = `/api/customers/${user.customerId}`;
        else if (user.userType === "EMPLOYEE") url = `/api/auth/admin/employee`;
        else if (user.userType === "ADMIN") url = `/api/auth/admin/${user.id}`;

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch profile");

        const base =
          user.userType === "CUSTOMER"
            ? data.customer
            : user.userType === "EMPLOYEE"
            ? data.employee
            : data.admin;

        setProfileData(base);

        // Fill form
        setFormData({
          fullName: base.fullName || "",
          email: base.email || base.User?.[0]?.email || base.User?.email || "",
          phone: base.phone || "",
          address:
            base.address || base.addressJson?.raw || base.addressJson || "",
          notes: base.notes || "",
          isActive: base.isActive ?? true,
          vehicle: base.vehicleJson
            ? JSON.parse(JSON.stringify(base.vehicleJson))
            : { make: "", year: "", model: "", regNo: "" },
        });
      } catch (err) {
        console.error(err);
        message.error(err.message || "Error loading profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user, token]);

  // =====================================================
  // 📝 Handle Input Changes
  // =====================================================
  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleVehicleChange = (field, value) =>
    setFormData((prev) => ({
      ...prev,
      vehicle: { ...prev.vehicle, [field]: value },
    }));

  // =====================================================
  // 💾 Save (Admin & Customer)
  // =====================================================
  const handleSave = async () => {
    try {
      setLoading(true);
      let endpoint = "";
      let payload = {};

      if (user.userType === "CUSTOMER") {
        endpoint = `/api/customers/${profileData.id}`;
        payload = {
          fullName: formData.fullName,
          addressJson: { raw: formData.address },
          vehicleJson: formData.vehicle,
          notes: formData.notes,
        };
      } else if (user.userType === "ADMIN") {
        endpoint = `/api/auth/admin/${profileData.id}`;
        payload = {
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined,
          isActive: formData.isActive,
        };
      }

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      message.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );

  if (!profileData) return null;

  const isEditable = ["CUSTOMER", "ADMIN"].includes(user?.userType);

  // =====================================================
  // 🌟 UI START
  // =====================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 md:w-20 h-16 md:h-20 flex items-center justify-center rounded-full bg-blue-theme text-white font-bold text-lg md:text-2xl shadow-lg p-1">
              {formData.fullName
                ?.split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2) || "Admin"}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {formData.fullName}
              </h2>
              <p className="text-gray-500 text-sm">{user.userType}</p>
            </div>
          </div>

          {isEditable && (
            <div className="flex gap-3 mt-4 md:mt-0">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    className="bg-blue-bold !text-white"
                  >
                    Save
                  </Button>
                  <Button
                    className="!text-white  "
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-bold !text-white"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          )}
        </div>

        {/* ADMIN FIELDS */}
        {user.userType === "ADMIN" && (
          <Card title="Admin Details" bordered={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                addonBefore={<Mail />}
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
              <Input
                addonBefore={<Phone />}
                placeholder="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
              />
              <Input.Password
                addonBefore={<KeyRound />}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </Card>
        )}

        {/* CUSTOMER FIELDS */}
        {user.userType === "CUSTOMER" && (
          <>
            <Card title="🏠 Personal Details" bordered={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  addonBefore={<PersonStandingIcon />}
                  name="fullName"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <Input
                  addonBefore={<Home />}
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </Card>

            <Card
              title={
                <span className="flex items-center gap-2">
                  🚗 Vehicle Details
                </span>
              }
              bordered={false}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Make"
                  value={formData.vehicle.make}
                  onChange={(e) => handleVehicleChange("make", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  placeholder="Year"
                  value={formData.vehicle.year}
                  onChange={(e) => handleVehicleChange("year", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  placeholder="Model"
                  value={formData.vehicle.model}
                  onChange={(e) => handleVehicleChange("model", e.target.value)}
                  disabled={!isEditing}
                />
                <Input
                  placeholder="Reg. No"
                  value={formData.vehicle.regNo}
                  onChange={(e) => handleVehicleChange("regNo", e.target.value)}
                  disabled={!isEditing}
                />
              </div>
            </Card>
          </>
        )}

        {/* EMPLOYEE FIELDS */}
        {user.userType === "EMPLOYEE" && (
          <Card title="👷 Employee Summary" bordered={false}>
            <div className="space-y-4 text-gray-700">
              <p>
                <b>Name:</b> {profileData.fullName}
              </p>
              <p>
                <b>Title:</b> {profileData.title}
              </p>
              <p>
                <b>Hourly Rate:</b> $ {profileData.hourlyRate}/hr
              </p>
              <p>
                <b>Total Logged Hours:</b> {profileData.totalLoggedHours || 0}{" "}
                hrs
              </p>

              <div className="mt-4">
                <h4 className="font-semibold mb-2">Recent Sessions:</h4>
                {profileData.Sessions?.length ? (
                  profileData.Sessions.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between text-sm border-b py-1"
                    >
                      <span>{new Date(s.loginAt).toLocaleString()}</span>
                      <span>
                        {s.logoutAt
                          ? new Date(s.logoutAt).toLocaleString()
                          : "Active"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No session history found.
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
