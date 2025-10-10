"use client";

import React, { useEffect, useState } from "react";
import { Mail, Phone, Home, Edit2, Car, NotebookIcon, PersonStandingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "../context/AuthContext";
import { Input, Switch, message } from "antd";

export default function ProfilePage() {
  const { user, token } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    vehicle: "",
    notes: "",
    isActive: true,
    createdAt: "",
  });

  useEffect(() => {
    // Fetch customer profile if the user is a customer
    const fetchCustomer = async () => {
      if (user?.userType === "CUSTOMER" && token) {
        try {
          const res = await fetch(`/api/customers/${user.customerId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (res.ok) {
            setCustomerData(data.customer);
            setFormData({
              fullName: data.customer.fullName,
              email: data.customer.User?.[0].email,
              createdAt: data.customer.User?.[0].createdAt,
              phone: data.customer.phone || "No phone number provided", // fallback
              address: data.customer.addressJson || "No address provided", // fallback
              vehicle: data.customer.vehicleJson || "No vehicle information provided", // fallback
              notes: data.customer.notes || "No notes available", // fallback
              isActive: data.customer.isActive,
            });
          } else {
            console.error(data.error || "Failed to fetch customer data");
          }
        } catch (err) {
          console.error("Error fetching customer:", err);
        }
      }
    };

    fetchCustomer();
  }, [user, token]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle saving the updated customer profile
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/customers/${customerData.id}`, {
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
        setIsEditing(false); // Close the editing form
      } else {
        message.error(data.error || "Failed to update profile");
      }
    } catch (err) {
      message.error("Error saving customer profile:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800">
      {user?.userType === "CUSTOMER"? (
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-8">
        {/* Left Section - Avatar */}
        <div className="flex flex-col items-center md:w-1/3 space-y-2">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-2xl shadow-xl mb-4">
            {formData.fullName
              .split(" ")
              .map((n) => n[0]?.toUpperCase())
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className=" font-medium text-gray-800">{formData.email}</span>
            </div>
          <p className="text-sm text-gray-500 mt-1">{user?.userType}</p>
        </div>

        {/* Right Section - Details */}
        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Email */}
            {/* Phone */}
            <div className="flex items-center gap-4">
              <PersonStandingIcon className="w-5 h-5 text-gray-600" />
              {isEditing ? (
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="w-full"
                />
              ) : (
                <span className="text-lg font-medium text-gray-800">{formData.fullName}</span>
              )}
            </div>
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
            <Car className="w-6 h-6 text-gray-600"/>
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
            <NotebookIcon className="w-5 h-5 text-gray-600"/>
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

          <div className="flex gap-4">
            {isEditing ? (
              <>
                <Button onClick={handleSave} className="bg-blue-theme !text-white hover:bg-blue-bold">
                  Save Changes
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} disabled={user?.userType !== "CUSTOMER"} className="bg-blue-theme !text-white hover:bg-blue-bold">
                <Edit2 className="w-5 h-5 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>): (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 flex flex-col md:flex-row gap-8"> 
        <h1 className="text-2xl font-bold">
          BSDK Mehnat kar or admin ban tb dheki a kr 
        </h1>
        </div>
      )
      }
    </div>
  );
}
