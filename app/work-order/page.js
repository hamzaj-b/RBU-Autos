"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import EmployeeWorkOrder from "../components/EmployeeWorkOrder";
import { useAuth } from "../context/AuthContext";

export default function RepairTracker() {
  const { token } = useAuth(); // ✅ Get token from context

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const fetchWorkOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/workOrders/open", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Include token
          },
        });

        const data = await res.json();

        if (res.ok) {
          console.groupCollapsed("📦 Work Orders API Response");
          console.log("✅ Summary:", data.summary);
          console.log("📊 Pagination:", data.pagination);
          console.table(data.workOrders);
          console.groupEnd();

          setWorkOrders(data.workOrders || []);
        } else {
          console.error("❌ API Error:", data.error);
          setError(data.error || "Failed to fetch work orders");
        }
      } catch (err) {
        console.error("💥 Network Error:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  // ✅ Fetch open work orders only when token is available
  useEffect(() => {
    if (!token) {
      console.warn("⚠️ No token found in context. Skipping fetch.");
      return;
    }

    

    fetchWorkOrders();
  }, [token]); // 🔁 Runs again if token changes (e.g. after login)

  // 🔍 Local filtering
  const filteredData = workOrders.filter((item) => {
    const matchesSearch = item.customerName
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesDate =
      (!dateFrom || new Date(item.startAt) >= new Date(dateFrom)) &&
      (!dateTo || new Date(item.startAt) <= new Date(dateTo));

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="container mx-auto p-6 text-black">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex space-x-4 mb-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search customer..."
              className="w-full px-14 py-2 md:py-4 rounded-lg bg-gray-100 text-sm md:text-base focus:outline-none focus:border focus:border-gray-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2 md:top-4 text-gray-500">
              <Search />
            </span>
          </div>
          <button className="md:py-2 px-2 md:px-4 rounded-lg bg-gray-100 flex items-center text-gray-500">
            <SlidersHorizontal className="w-4" />
            <span className="hidden md:block px-2">Filters</span>
          </button>
        </div>
      </div>

      {/* Work Orders Display */}
      <div className="p-2 bg-white rounded-lg">
        {!token ? (
          <p className="text-center text-yellow-600 py-4">
            Please log in to view work orders.
          </p>
        ) : loading ? (
          <p className="text-center text-gray-500 py-4">Loading work orders...</p>
        ) : error ? (
          <p className="text-center text-red-500 py-4">{error}</p>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            No open work orders found.
          </p>
        ) : (
          <EmployeeWorkOrder data={filteredData} fetchWorkOrders= {fetchWorkOrders} />
        )}
      </div>
    </div>
  );
}
