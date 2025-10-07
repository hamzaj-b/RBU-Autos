"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import EmployeeWorkOrder from "../components/EmployeeWorkOrder";

export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Fetch open work orders on component mount
  useEffect(() => {
    const fetchWorkOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/workOrders/open"); // your API endpoint
        const data = await res.json();

        if (res.ok) {
          setWorkOrders(data.workOrders); // pass API data
        } else {
          setError(data.error || "Failed to fetch work orders");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkOrders();
  }, []);

  // Filter work orders based on search & status & date
  const filteredData = workOrders.filter((item) => {
    const matchesSearch = item.customerName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesDate =
      (!dateFrom || new Date(item.startAt) >= new Date(dateFrom)) &&
      (!dateTo || new Date(item.startAt) <= new Date(dateTo));

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="container mx-auto p-6 text-black">
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex space-x-4 mb-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search vehicle"
              className="w-full px-14 py-2 md:py-4 rounded-lg bg-gray-100 text-sm md:text-base focus:outline-none focus:border focus:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2 md:top-4 text-gray-500">
              <Search />{" "}
            </span>
          </div>
          <button className="md:py-2 px-2 md:px-4 rounded-lg bg-gray-100 flex items-center text-gray-500">
            <SlidersHorizontal className="w-4" />
            <span className="hidden md:block px-2">Filters</span>
          </button>
        </div>
      </div>

      <div className="p-2 bg-white rounded-lg">
        {loading ? (
          <p className="text-center text-gray-500 py-4">Loading work orders...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-4">{error}</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No open work orders found</p>
        ) : (
          <EmployeeWorkOrder data={filteredData} /> // pass API data here
        )}
      </div>
    </div>
  );
}
