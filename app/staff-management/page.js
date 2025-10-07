"use client";

import { FileDownIcon, Plus, RefreshCcw } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AdminAddEmployee from "../components/Modals/AdminAddEmployee";
import { useAuth } from "../context/AuthContext";
import { Input, Spin, Empty, message } from "antd";
import { Button } from "@/components/ui/button";

export default function StaffManagement() {
  const { token } = useAuth();

  // UI state
  const [clientReady, setClientReady] = useState(false); // ✅ Prevent SSR style flash
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Wait for client hydration before rendering layout
  useEffect(() => {
    setClientReady(true);
  }, []);

  // ─── Fetch Employees ───────────────────────────────
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/employee", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setEmployees(data.employees || []);
        setFiltered(data.employees || []);
        if (data.employees.length > 0) setSelectedEmployee(data.employees[0]);
      } else {
        message.error(data.error || "Failed to load employees");
      }
    } catch (err) {
      console.error(err);
      message.error("Network error while loading employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && clientReady) fetchEmployees();
  }, [token, clientReady]);

  // ─── Search Filter ─────────────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(employees);
    } else {
      setFiltered(
        employees.filter((emp) =>
          emp.fullName.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, employees]);

  // ─── Employee Selection ────────────────────────────
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee);
  };

  // ─── Export Placeholder ────────────────────────────
  const handleExport = () => {
    message.info("Export feature coming soon 📦");
  };

  // ─── Hydration Guard ───────────────────────────────
  if (!clientReady)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800 transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Staff Management
        </h1>

        <div className="flex gap-3">
          <Button
            onClick={fetchEmployees}
            variant="outline"
            className="flex items-center gap-2 text-gray-600"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>

          <Button
            onClick={handleExport}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:bg-gray-100"
          >
            <FileDownIcon className="w-4 h-4" />
            Export
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white border shadow-xs hover:bg-gray-100 text-white"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <AdminAddEmployee
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Search Bar */}
      <div className="max-w-md mb-6">
        <Input.Search
          placeholder="Search employees by name..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg shadow-sm"
        />
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Section */}
        <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-lg p-6 transition-all">
          <div className="grid grid-cols-3 text-sm font-semibold text-gray-600 border-b pb-2 mb-3">
            <span>Employee</span>
            <span>Date Joined</span>
            <span className="text-right">Hourly Rate</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-2">
              {filtered.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${
                    selectedEmployee?.id === employee.id
                      ? "bg-blue-bold/20 border-blue-bold"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm">
                      {employee.fullName
                        .split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {employee.fullName}
                      </p>
                      <p className="text-xs text-gray-500">{employee.title}</p>
                    </div>
                  </div>

                  <span className="text-sm text-gray-600">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </span>

                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      employee.hourlyRate
                        ? "bg-gray-100 text-gray-700"
                        : "bg-gray-50 text-gray-400"
                    }`}
                  >
                    {employee.hourlyRate
                      ? `₨ ${employee.hourlyRate}/hr`
                      : "N/A"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No employees found" className="py-10" />
          )}
        </div>

        {/* Right Section */}
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-start text-center transition-all">
          {selectedEmployee ? (
            <>
              <div className="w-15 h-15 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm">
                {selectedEmployee.fullName
                  .split(" ")
                  .map((n) => n[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2)}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedEmployee.fullName}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedEmployee.title || "No title assigned"}
              </p>

              <div className="w-full text-left text-sm text-gray-700 space-y-2 border-t pt-4">
                <p>
                  <span className="font-medium text-gray-600">Joined:</span>{" "}
                  {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium text-gray-600">
                    Hourly Rate:
                  </span>{" "}
                  {selectedEmployee.hourlyRate
                    ? `₨ ${selectedEmployee.hourlyRate}/hr`
                    : "N/A"}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Email:</span>{" "}
                  {selectedEmployee.User?.[0]?.email || "Not available"}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Status:</span>{" "}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      selectedEmployee.User?.[0]?.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {selectedEmployee.User?.[0]?.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm">
                {"Employee"
                  .split(" ")
                  .map((n) => n[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2)}
              </div>
              <p>Select an employee to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
