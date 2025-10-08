"use client";

import React from "react";
import Image from "next/image";
import { User, Mail, Phone, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  // Static user data
  const user = {
    fullName: "John Doe",
    email: "johndoe@example.com",
    userType: "ADMIN",
    phone: "+1 123 456 7890",
    address: "123 Main St, City, Country",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 flex flex-col md:flex-row gap-8">
        {/* Left Section - Avatar */}
        <div className="flex flex-col items-center md:w-1/3">
          <div className="w-24 h-24 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-2xl shadow-lg mb-4">
            {user.fullName
              .split(" ")
              .map((n) => n[0]?.toUpperCase())
              .join("")
              .slice(0, 2)}
          </div>
          <h2 className="text-xl font-semibold">{user.fullName}</h2>
          <p className="text-sm text-gray-500">{user.userType}</p>
        </div>

        {/* Right Section - Details */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-gray-500" />
              <span>{user.address}</span>
            </div>
          </div>

          <div className="mt-6">
            <Button
              className="bg-blue-theme hover:bg-blue-bold text-white w-full md:w-auto px-6 py-2"
              onClick={() => alert("Edit Profile clicked")}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
