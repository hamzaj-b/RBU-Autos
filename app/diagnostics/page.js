// app/components/CustomerInteraction.tsx
"use client";
import React, { useState } from "react";

const CustomerInteraction = () => {
  const [activeTab, setActiveTab] = useState("interaction");

  // Mock data for interactions
  const interactions = [
    {
      name: "John Doe",
      phone: "123-456-7890",
      interaction: "Call",
      date: "2021-09-20 10:30 AM",
      summary: "Discussed upcoming service appointment",
    },
    {
      name: "John Doe",
      phone: "123-456-7890",
      interaction: "Call",
      date: "2021-09-20 10:30 AM",
      summary: "Discussed upcoming service appointment",
    },
    {
      name: "John Doe",
      phone: "123-456-7890",
      interaction: "Call",
      date: "2021-09-20 10:30 AM",
      summary: "Discussed upcoming service appointment",
    },
  ];

  // Mock data for services history (you can expand this)
  const servicesHistory = [
    {
      service: "Oil Change",
      date: "2021-09-15",
      status: "Completed",
    },
    {
      service: "Tire Rotation",
      date: "2021-08-20",
      status: "Completed",
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="w-full bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar with Tabs */}
          <div className="w-full md:w-64 bg-gray-200 p-4 border-r border-gray-300">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("interaction")}
                className={`w-full px-4 py-3 text-left font-semibold transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-bold focus:ring-opacity-50 ${
                  activeTab === "interaction"
                    ? "text-black bg-blue-theme"
                    : "text-gray-800 bg-white hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Customer Interaction
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`w-full px-4 py-3 text-left font-semibold transition-colors rounded-md focus:outline-none focus:ring-2 focus:ring-blue-bold focus:ring-opacity-50 ${
                  activeTab === "services"
                    ? "text-black bg-blue-theme"
                    : "text-gray-800 bg-white hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Services History
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 space-y-4">
            {activeTab === "interaction" && (
              <>
                {interactions.map((interaction, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 p-5 rounded-md shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {interaction.name}
                        </h3>
                        <p className="text-sm text-gray-700">
                          Phone: {interaction.phone}
                        </p>
                        <p className="text-sm text-gray-700">
                          Interaction: {interaction.interaction}
                        </p>
                        <p className="text-sm text-gray-700">
                          Date: {interaction.date}
                        </p>
                        <p className="text-sm text-gray-700">
                          Summary: {interaction.summary}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-theme hover:bg-blue-bold text-black font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-bold focus:ring-opacity-50">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {activeTab === "services" && (
              <div className="space-y-4">
                {servicesHistory.map((service, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 p-5 rounded-md shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {service.service}
                        </h3>
                        <p className="text-sm text-gray-700">
                          Date: {service.date}
                        </p>
                        <p className="text-sm text-gray-700">
                          Status: {service.status}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-blue-theme hover:bg-blue-bold text-black font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-bold focus:ring-opacity-50">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInteraction;
