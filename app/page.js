"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

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
import { Spin } from "antd";
const page = () => {
  const { user, token } = useAuth();

  console.log("user token:", token);
 console.log ("user" , user);
   const [workOrders, setWorkOrders] = useState([]);
   const [loading, setLoading] = useState(false);
 
   console.log("Token is", token);
 
   // 🧠 Fetch WorkOrders API call
   const fetchWorkOrders = async () => {
     try {
       setLoading(true);
 
       const params = new URLSearchParams({
         limit: 5,
         sortOrder: "desc",
       });
 
       const res = await fetch(`/api/workOrders/open`, {
         headers: { Authorization: `Bearer ${token}` },
       });
 
       const data = await res.json();
       if (!res.ok) throw new Error(data.error || "Failed to fetch work orders");
      console.log("work order data", data);
       setWorkOrders(data.workOrders || []);
     } catch (err) {
       console.error("Error fetching work orders:", err);
     } finally {
       setLoading(false);
     }
   };

   useEffect(() => {
      fetchWorkOrders();
    }, []);
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

        {loading ? (
          <div className="text-center py-10 text-gray-500">
            <Spin size="large" />
          </div>
        ) : workOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No work orders found.
          </div>
        ) : (
          <RecentWorkOrder
            data={workOrders.map((wo) => ({
              id: wo.id,
              customer: wo.customerName || "Unknown",
              image: "/user1.png",
              orderDate:
                wo.bookingTime?.split(" - ")[0] ||
                new Date(wo.createdAt).toLocaleDateString(),
              orderTime: wo.bookingTime?.split(" - ")[1] || "",
              status: wo.status,
            }))}
            containerWidth="w-full"
          />
        )}
      </div>

          {/* <WeeklyTransactionsCard /> */}
        </div>
      </div>
    </>
  );
};

export default page;
