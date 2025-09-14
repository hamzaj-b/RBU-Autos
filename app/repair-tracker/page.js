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
            className={`px-4 py-2 rounded-full text-yellow-bold ${
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
        {/* <h2 className="text-lg p-4 text-gray-500 font-semibold mb-4">
          Recent Work Order
        </h2>
        <div className="grid grid-cols-5 gap-4 bg-gray-200 rounded-2xl py-4 px-4 mx-2 font-medium text-gray-600 mb-2">
          <span>No</span>
          <span>Customer</span>
          <span>Order Date</span>
          <span>Status</span>
          <span>Assign</span>
        </div>
        {filteredData.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-5 gap-4 py-2 mx-6 border-b border-gray-200"
          >
            <span>{item.id}</span>
            <span className="flex items-center gap-2">
              <img src={item.image} width={50} alt="" />
              {item.customer}
            </span>
            <span className="flex flex-col">
              {item.orderDate}
              <span className="text-gray-500">{item.orderTime}</span>
            </span>
            <span
              className={`px-4 py-1 rounded-full items-center justify-center flex ${
                item.status === "Completed"
                  ? "bg-green-100 text-yellow-bold"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {item.status}
            </span>
            <input
              type="text"
              placeholder="Select Employee"
              className="p-1 rounded-lg border border-gray-300"
            />
          </div>
        ))} */}
      </div>
    </div>
  );
}
