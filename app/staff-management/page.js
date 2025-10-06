"use client";

import { FileDownIcon, Plus } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AdminAddEmployee from "../components/Modals/AdminAddEmployee";
import { useAuth } from "../context/AuthContext";

export default function StaffManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { token } = useAuth(); // Admin token from AuthContext

  const [selectedEmployee, setSelectedEmployee] = useState(null); // To hold the selected employee

  useEffect(() => {
    // Fetch the employees when component mounts
    const fetchEmployees = async () => {
      setLoading(true);
      setMessage(null);

      try {
        const res = await fetch("/api/auth/admin/employee", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`, // Include token in the Authorization header
          },
        });

        const data = await res.json();

        if (res.ok) {
          setEmployees(data.employees);
          console.log("Fetched Employees: ", data.employees);
          setSelectedEmployee(data.employees[0]); // Set the first employee as the default selected
        } else {
          setMessage(`❌ ${data.error || "Failed to fetch employees"}`);
        }
      } catch (error) {
        console.error("API Error:", error);
        setMessage("❌ Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token]); // Trigger on token change

  useEffect(() => {
    // This effect runs when the employees state changes
    if (employees.length > 0 && !selectedEmployee) {
      // Set the first employee as selected when the list is populated
      setSelectedEmployee(employees[0]);
    }
  }, [employees, selectedEmployee]);

  // Handle employee selection onClick
  const handleEmployeeClick = (employee) => {
    setSelectedEmployee(employee); // Update the selected employee with the clicked employee
  };

  return (
    <div className="container mx-auto p-8 text-black h-full">
      <div className="flex justify-end space-x-4">
        <button
          className="flex items-center space-x-2 bg-white text-gray-500 rounded-md px-4 py-2 text-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
        <button className="flex items-center space-x-2 bg-white text-gray-500 rounded-md px-2 py-1 md:px-4 md:py-2 text-sm">
          <FileDownIcon className="w-5 h-5" />
          <span className="hidden md:flex">Export</span>
        </button>
      </div>

      <AdminAddEmployee isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex justify-start gap-10 mt-4">
        <div className="w-3/4 bg-white p-6 h-full rounded-md">
          <div className="flex justify-between items-center mb-4">
            <p className="text-lg font-semibold">Employees</p>
            <p className="text-lg font-semibold pl-10">Date Started</p>
            <p className="text-lg font-semibold">Hourly Rate</p>
          </div>

          {/* Map through the employees and display */}
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="flex justify-between items-center mt-6 cursor-pointer"
              onClick={() => handleEmployeeClick(employee)} // Click to select employee
            >
              <div className="flex justify-start gap-2 items-center">
                <div>
                  <Image
                    src="/profile.png" // Keep image path the same
                    alt="profile image"
                    width={50}
                    height={30}
                  />
                </div>
                <div>
                  <p className="font-medium">{employee?.fullName}</p> {/* Access User data */}
                  <p className="text-sm text-gray-600">{employee?.title}</p> {/* Access User data */}
                </div>
              </div>

              <p className="font-medium mr-2">{new Date(employee.createdAt).toLocaleDateString()}</p>

              <p className="font-medium border border-gray-400 rounded-full px-2 py-1 mr-4">
                {employee?.hourlyRate ? `$${employee.hourlyRate}/hr` : "N/A"}
              </p>
            </div>
          ))}
        </div>

        {/* Right Card: Show the selected employee's data */}
        <div className="w-1/4 bg-white p-6 flex flex-col justify-start items-center h-[80vh] pt-10 rounded-md">
          {selectedEmployee ? (
            <>
              <div>
                <Image
                  src="/profile.png"
                  alt="icon"
                  width={60}
                  height={50}
                  quality={40}
                />
              </div>
              <p className="text-lg font-medium">{selectedEmployee?.fullName}</p>
              <p className="text-sm text-gray-600">{selectedEmployee?.title}</p>
              <p className="text-sm font-medium mt-4">Phone: +112323232</p>
              {/* <p className="text-sm font-medium">Email: {selectedEmployee?.User?.email}</p> */}
            </>
          ) : (
            <p>Select an employee to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
