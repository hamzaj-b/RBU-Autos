"use client";
import React, { useEffect, useState } from "react";
import { Spin, message } from "antd";

import { useAuth } from "@/app/context/AuthContext";

import NewNetIncomeCard from "./components/dashboard/NetIncomeCard";
import TotalBookingsCard from "./components/dashboard/TotalBookings";
import WorkCompletedCard from "./components/dashboard/WorkCompletedCard";
import OverallSalesCard from "./components/dashboard/SalesCard";
import ServiceReport from "./components/dashboard/ServicesChart";
import RecentWorkOrder from "./components/RecentWorkOrder";
import { getCurrentLocation } from "@/lib/getCurrentLocation";

export default function DashboardPage() {
  const { token } = useAuth();

  const [overview, setOverview] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [serviceReport, setServiceReport] = useState(null);
  const [workOrders, setWorkOrders] = useState([]);

  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingSales, setLoadingSales] = useState(false);
  const [loadingServiceReport, setLoadingServiceReport] = useState(false);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);

  const [selectedRange, setSelectedRange] = useState("6M");

  // === 1️⃣ Overview API ===
  const fetchOverview = async () => {
    if (!token) return;
    try {
      setLoadingOverview(true);
      const res = await fetch("/api/dashboard/overview", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch overview");
      setOverview(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load overview data");
    } finally {
      setLoadingOverview(false);
    }
  };

  // === 2️⃣ Sales API ===
  const fetchSales = async (range = "6M") => {
    if (!token) return;
    try {
      setLoadingSales(true);
      const res = await fetch(`/api/dashboard/sales?months=${range}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch sales data");
      setSalesData(data.data || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to load sales data");
    } finally {
      setLoadingSales(false);
    }
  };

  // === 3️⃣ Service Report API ===
  const fetchServiceReport = async () => {
    if (!token) return;
    try {
      setLoadingServiceReport(true);
      const res = await fetch("/api/dashboard/service-report", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch service report");
      setServiceReport(data);
    } catch (err) {
      console.error(err);
      message.error("Failed to load service report");
    } finally {
      setLoadingServiceReport(false);
    }
  };

  // === 4️⃣ Recent Work Orders API ===
  const fetchWorkOrders = async () => {
    if (!token) return;
    try {
      setLoadingWorkOrders(true);

      // Fetch all work orders
      const res = await fetch(`/api/workOrders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to fetch recent work orders");

      // Filter out completed work orders
      const completedWorkOrders = data.workOrders.filter(
        (workOrder) => workOrder.status === "COMPLETED"
      );

      // Limit to only the first 5 completed work orders
      const filteredWorkOrders = completedWorkOrders.slice(0, 5);

      setWorkOrders(filteredWorkOrders); // Set the filtered work orders
    } catch (err) {
      console.error(err);
      message.error("Failed to load recent work orders");
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  // === 🚀 Initial Load (runs ONCE when token is ready) ===
  useEffect(() => {
    if (token) {
      fetchOverview();
      fetchServiceReport();
      fetchWorkOrders();
      fetchSales(selectedRange); // load default 6M data once
    }
  }, [token]);

  // === 🔁 Re-run ONLY Sales API when range changes ===
  useEffect(() => {
    if (token) {
      fetchSales(selectedRange);
    }
  }, [selectedRange]); // ✅ only triggers when range changes

  return (
    <div className="min-h-screen bg-gray-100">
      {/* === Top Cards === */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <NewNetIncomeCard
          title="Total Revenue"
          amount={overview?.totalRevenue}
          loading={loadingOverview}
        />
        <TotalBookingsCard
          title="Total Bookings"
          amount={overview?.totalBookings}
          loading={loadingOverview}
        />
        <WorkCompletedCard
          title="Work Orders Completed"
          amount={overview?.workCompleted}
          loading={loadingOverview}
        />
      </div>

      {/* === Sales & Service Report === */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <OverallSalesCard
            data={salesData}
            loading={loadingSales}
            onRangeChange={setSelectedRange}
            activeRange={selectedRange}
          />
        </div>

        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-6">
          <ServiceReport
            data={serviceReport?.topServices || []}
            month={serviceReport?.month}
            loading={loadingServiceReport}
          />
        </div>
      </div>

      {/* === Recent Work Orders === */}
      <div className="p-6">
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          {loadingWorkOrders ? (
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
      </div>
    </div>
  );
}
