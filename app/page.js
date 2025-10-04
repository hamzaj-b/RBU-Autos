"use client";
import Image from "next/image";
import React from "react";

import ServiceReport from "./components/dashboard/ServicesChart";
import RecentWorkOrder from "./components/RecentWorkOrder";
import CustomShape from "./components/app/CustomShape";
import { IoEllipsisVertical } from "react-icons/io5";
import { FaRegCalendarAlt } from "react-icons/fa";
import OverallSalesCard from "./components/dashboard/SalesCard";
import WeeklyTransactionsCard from "./components/dashboard/TransactionSummary";
import NewNetIncomeCard from "./components/dashboard/NetIncomeCard";
import TotalBookingsCard from "./components/dashboard/TotalBookings";
import WorkCompletedCard from "./components/dashboard/WorkCompletedCard";
import { useAuth } from "@/app/context/AuthContext";
const page = () => {
  const { user, token, logout, loading } = useAuth();

  console.log("user token:", token);

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
  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* <h1 className="text-2xl font-bold">Welcome {user}</h1> */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NewNetIncomeCard />
          <TotalBookingsCard />
          <WorkCompletedCard />
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <OverallSalesCard />
          </div>

          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
            <ServiceReport />
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-3 bg-white p-2 md:p-6 rounded-lg shadow-md">
            <RecentWorkOrder
              data={dummyData}
              containerWidth="w-full"
              heading="Recent Orders"
            />
          </div>

          {/* <WeeklyTransactionsCard /> */}
        </div>
      </div>
    </>
  );
};

export default page;
