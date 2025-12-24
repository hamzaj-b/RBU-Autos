"use client";

import { Plus, RefreshCcw, Pencil, Trash2, FileDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Input,
  Spin,
  Empty,
  message,
  Tooltip,
  Popconfirm,
  Divider,
} from "antd";
import { Button } from "@/components/ui/button";
import AdminAddEmployee from "../../components/Modals/AdminAddEmployee";
import EditEmployeeModal from "../../components/Modals/EditEmployeeModal";
import { useAuth } from "../../context/AuthContext";

export default function StaffManagement() {
  const { token } = useAuth();

  const [clientReady, setClientReady] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => setClientReady(true), []);

  // 🔹 Fetch Employees
  const fetchEmployees = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
        setFiltered(data.employees || []);
        if (data.employees?.length > 0 && !selectedEmployee)
          setSelectedEmployee(data.employees[0]);
      } else message.error(data.error || "Failed to load employees");
    } catch (err) {
      message.error("Network error while loading employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && clientReady) fetchEmployees();
  }, [token, clientReady]);

  // 🔹 Search Filtering
  useEffect(() => {
    if (!search.trim()) setFiltered(employees);
    else {
      const lower = search.toLowerCase();
      setFiltered(
        employees.filter((emp) => emp.fullName.toLowerCase().includes(lower))
      );
    }
  }, [search, employees]);

  // 🔹 Delete Employee
  const handleDelete = async (employeeId) => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/admin/employee/${employeeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Employee deleted successfully!");
        await fetchEmployees();
      } else message.error(data.error || "Failed to delete employee");
    } catch (err) {
      message.error("Error deleting employee");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Auto-refresh after Add
  const handleEmployeeAdded = async () => {
    setIsModalOpen(false);
    await fetchEmployees();
  };

  // 🔹 Handle Edit Click (shows loading state)
  const openEditModal = async (employee) => {
    setEditing(true);
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
    setTimeout(() => setEditing(false), 400);
  };

  if (!clientReady)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen px-3 sm:px-6 py-6 bg-gray-50 text-gray-800">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          Staff Management
        </h1>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
          <Button
            onClick={fetchEmployees}
            variant="outline"
            className="flex items-center justify-center gap-2 text-gray-600 w-full sm:w-auto"
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-theme !text-white hover:bg-blue-bold w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </Button>
        </div>
      </div>

      {/* ===== Add Employee Modal ===== */}
      <AdminAddEmployee
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        fetchEmployees={handleEmployeeAdded}
      />

      {/* ===== Search ===== */}
      <div className="w-full sm:max-w-md mb-6">
        <Input.Search
          placeholder="Search employees by name..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg shadow-sm w-full"
        />
      </div>

      {/* ===== Main Layout ===== */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* ===== Employee List ===== */}
        <div className="w-full lg:w-3/4 bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1 sm:pr-2">
              {filtered.map((employee) => (
                <div
                  key={employee.id}
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedEmployee?.id === employee.id
                      ? "bg-blue-50 border-blue-400"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedEmployee(employee)}
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm">
                      {employee.fullName
                        ?.split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-gray-800 truncate">
                        {employee.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {employee.title || "No title"}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                    <span>
                      Joined {new Date(employee.createdAt).toLocaleDateString()}
                    </span>
                    <span>
                      {employee.User?.[0]?.phone
                        ? `📞 ${employee.User[0].phone}`
                        : "No phone"}
                    </span>
                    <span>{employee.totalLoggedTime || 0}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        employee.hourlyRate
                          ? "bg-gray-100 text-gray-700"
                          : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {employee.hourlyRate
                        ? `$${employee.hourlyRate}/hr`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end sm:justify-start">
                    <Tooltip title="View Sessions">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/sessions/${employee.id}`;
                        }}
                        className="text-purple-600 hover:bg-purple-50"
                      >
                        <FileDownIcon className="w-4 h-4" />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Edit Employee">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(employee);
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        {editing && selectedEmployee?.id === employee.id ? (
                          <Spin size="small" />
                        ) : (
                          <Pencil className="w-4 h-4" />
                        )}
                      </Button>
                    </Tooltip>

                    <Popconfirm
                      title="Delete this employee?"
                      onConfirm={(e) => {
                        e.stopPropagation();
                        handleDelete(employee.id);
                      }}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty description="No employees found" className="py-10" />
          )}
        </div>

        {/* ===== Edit Modal ===== */}
        <EditEmployeeModal
          isOpen={isEditModalOpen}
          editing={editing}
          onClose={() => setIsEditModalOpen(false)}
          employeeId={selectedEmployee?.id}
          onUpdated={async (updated) => {
            await fetchEmployees();
            setSelectedEmployee(updated);
          }}
        />

        {/* ===== Employee Details ===== */}
        <div className="w-full lg:w-1/4 bg-white rounded-xl shadow-lg p-5 flex flex-col items-center text-center border border-gray-100">
          {selectedEmployee ? (
            <>
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-lg shadow-sm">
                {selectedEmployee.fullName
                  ?.split(" ")
                  .map((n) => n[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2)}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-2">
                {selectedEmployee.fullName}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {selectedEmployee.title || "No title assigned"}
              </p>

              <Divider />

              <div className="w-full text-left text-sm text-gray-700 space-y-2">
                <p>
                  <span className="font-medium text-gray-600">Joined:</span>{" "}
                  {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium text-gray-600">Phone:</span>{" "}
                  {selectedEmployee.phone || "Not provided"}
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
            <div className="flex flex-col items-center justify-center text-gray-400">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-lg shadow-sm">
                EM
              </div>
              <p className="mt-2 text-sm">Select an employee to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
