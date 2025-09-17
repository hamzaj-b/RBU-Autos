"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import RecentWorkOrder from "../components/RecentWorkOrder";

export default function RepairTracker() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dummyData = [
    {
      id: "01",
      customer: "Shirt Creme",
      image: "/user1.png",
      orderDate: "March 24, 2022",
      orderTime: "09:20 AM",
      status: "Completed",
    },
    {
      id: "02",
      customer: "Shirt Creme",
      image: "/user1.png",
      orderDate: "March 24, 2022",
      orderTime: "09:20 AM",
      status: "Pending",
    },
    {
      id: "03",
      customer: "#A4064B",
      image: "/user1.png",
      orderDate: "March 24, 2022",
      orderTime: "09:20 AM",
      status: "Pending",
    },
  ];

  const filteredData = dummyData.filter((item) => {
    const matchesSearch = item.customer
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesDate =
      (!dateFrom || new Date(item.orderDate) >= new Date(dateFrom)) &&
      (!dateTo || new Date(item.orderDate) <= new Date(dateTo));
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="container mx-auto p-8 text-black">
      <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex space-x-4 mb-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search vehicle"
              className="w-full px-10 py-4 rounded-lg bg-gray-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-4 text-gray-500">
              <Search />{" "}
            </span>
          </div>
          <button className="p-2 px-4 rounded-lg bg-gray-100 flex items-center text-gray-500">
            <SlidersHorizontal />
            Filters
          </button>
        </div>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded-full text-green-800 ${
              statusFilter === "Completed" ? "bg-green-400" : "bg-green-100"
            }`}
            onClick={() => setStatusFilter("Completed")}
          >
            Completed Work
          </button>
          <button
            className={`px-4 py-2 rounded-full text-yellow-600 ${
              statusFilter === "Pending" ? "bg-yellow-400" : "bg-yellow-100"
            }`}
            onClick={() => setStatusFilter("Pending")}
          >
            Pending Work
          </button>
          <input
            type="date"
            className="p-2 rounded-lg border border-gray-300"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <input
            type="date"
            className="p-2 rounded-lg border border-gray-300"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>
      <div className="bg-white p-2 rounded-lg">
        <RecentWorkOrder data={dummyData} containerWidth="w-full" />
      </div>
    </div>
  );
}
