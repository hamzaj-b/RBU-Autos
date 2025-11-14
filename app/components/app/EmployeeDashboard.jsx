"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Card, Spin, Tag } from "antd";
import {
  Briefcase,
  Clock,
  CheckCircle,
  Wrench,
  Activity,
  UserCircle2,
  CircleStop,
  Play,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import useReverseGeocode from "@/hooks/useReverseGeocode";

// ========================================================================
//  EMPLOYEE DASHBOARD
// ========================================================================
export default function EmployeeDashboard() {
  const { token, sessionId, setSessionId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [sessionLoading, setSessionLoading] = useState(false);
  const [stopLoading, setStopLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Auto reverse geolocation hook
  const location = useReverseGeocode();

  // Fetch employee dashboard data
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/dashboard/employee", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Restore existing session
  useEffect(() => {
    if (sessionId) setSessionStarted(true);
  }, [sessionId]);

  // START SESSION — now calling employeeSession/start
  const startSession = async () => {
    if (!token) return;
    if (!location.address) return;

    setSessionLoading(true);

    try {
      const res = await fetch("/api/employeeSession/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          source: "web",
          location: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Save sessionId globally
      setSessionId(json.session.id);
      localStorage.setItem("sessionId", json.session.id);

      setSessionStarted(true);
    } catch (err) {
      console.error("Session start failed:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  // STOP SESSION — calling /api/employeeSession/stop
  const stopSession = async () => {
    if (!token || !sessionId) return;

    setStopLoading(true);

    try {
      const res = await fetch("/api/employeeSession/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          source: "web",
          latitude: location.latitude,
          longitude: location.longitude,
          location: location.address,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Clear global session
      localStorage.removeItem("sessionId");
      setSessionId(null);
      setSessionStarted(false);
    } catch (err) {
      console.error("Stop session failed:", err);
    } finally {
      setStopLoading(false);
    }
  };

  // Loading screen
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  if (!data)
    return (
      <div className="text-center text-gray-500 py-20">
        No data found for this employee.
      </div>
    );

  const { employee, stats, recentOrders, last7Days } = data;

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen overflow-x-hidden">
      {/* GLOBAL STYLE FIXES */}
      <style jsx global>{`
        html,
        body {
          overflow-x: hidden !important;
        }
        td,
        th,
        h2,
        h3,
        p,
        span {
          white-space: normal !important;
          word-wrap: break-word !important;
        }
        @media (max-width: 640px) {
          table {
            width: 100% !important;
            table-layout: fixed !important;
          }
          table thead {
            display: none !important;
          }
          table tr {
            display: flex !important;
            flex-direction: column !important;
            margin-bottom: 1rem !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.75rem !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            padding: 0.75rem !important;
            background: #fff;
          }
          table td {
            display: flex !important;
            justify-content: space-between !important;
            border: none !important;
            padding: 0.25rem 0 !important;
            font-size: 0.9rem;
          }
          table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #4b5563;
            margin-right: 0.5rem;
          }
        }
      `}</style>

      {/* EMPLOYEE INFO + SESSION CONTROLS */}
      <div className="bg-white rounded-xl shadow-sm p-5 sm:p-7 border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row justify-between gap-6">
          {/* LEFT: Employee Profile */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-lg shadow-sm">
              {employee.fullName
                ?.split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2)}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                {employee.fullName}
              </h2>

              <p className="text-gray-500 text-sm sm:text-base mt-1">
                {employee.title || "Employee"}
              </p>

              <div className="mt-2">
                <Tag
                  color="green"
                  className="px-3 py-1 text-xs rounded-md font-medium"
                >
                  Active Employee
                </Tag>
              </div>
            </div>
          </div>

          {/* RIGHT: Session Actions */}
          <div className="flex flex-col items-end justify-center gap-3 w-full sm:w-auto">
            {/* Section Title */}
            <span className="text-gray-700 text-sm font-semibold tracking-wide flex items-center gap-2">
              <Clock className="text-blue-600" size={18} />
              Work Session
            </span>

            {/* Buttons */}
            <div className="flex gap-3 mt-1">
              {/* START SESSION */}
              <Button
                disabled={
                  sessionStarted ||
                  sessionLoading ||
                  location.loading ||
                  !!location.error
                }
                onClick={startSession}
                className="bg-blue-theme hover:bg-blue-bold !text-white px-5 py-2 rounded-lg shadow-sm disabled:opacity-40 transition-all"
              >
                <Play className="w-4 h-4" />
                {sessionLoading
                  ? "Starting..."
                  : sessionStarted
                  ? "Session Started"
                  : "Start Session"}
              </Button>

              {/* STOP SESSION */}
              <Button
                disabled={
                  !sessionStarted ||
                  stopLoading ||
                  location.loading ||
                  !!location.error
                }
                onClick={stopSession}
                className="bg-gradient-to-bl from-red-600 to-rose-800 hover:bg-red-700 !text-white px-5 py-2 rounded-lg shadow-sm disabled:opacity-40 transition-all"
              >
                <CircleStop className="w-4 h-4" />
                {stopLoading ? "Stopping..." : "Stop Session"}
              </Button>
            </div>

            {/* SESSION STATUS TEXT */}
            <div className="flex items-center gap-2 mt-1">
              {location.loading ? (
                <p className="text-gray-400 text-xs">
                  Detecting your location…
                </p>
              ) : location.error ? (
                <p className="text-red-500 text-xs">⚠ {location.error}</p>
              ) : (
                <p className="text-gray-500 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                  {sessionStarted ? "Session Active" : "No Active Session"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
        <StatCard
          icon={<Briefcase className="w-5 h-5" />}
          title="Total Orders"
          value={stats.totalOrders}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          title="Completed"
          value={stats.completed}
          color="text-emerald-600"
        />
        <StatCard
          icon={<Wrench className="w-5 h-5" />}
          title="In Progress"
          value={stats.inProgress}
          color="text-indigo-600"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          title="Hours Worked"
          value={(stats.totalHours || 0).toFixed(1)}
          color="text-amber-600"
        />
      </div>

      {/* WEEKLY CHART */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity className="text-blue-600" size={20} />
          Weekly Performance
        </h3>

        <div className="w-full h-[240px] sm:h-[300px] overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={last7Days}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0f74b2"
                strokeWidth={2}
                name="Completed Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Clock className="text-blue-600" size={20} />
          Recent Work Orders
        </h3>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent work orders.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600">
                  <th className="py-2 px-3 sm:px-4">Customer</th>
                  <th className="py-2 px-3 sm:px-4">Status</th>
                  <th className="py-2 px-3 sm:px-4">Services</th>
                  <th className="py-2 px-3 sm:px-4">Closed At</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((wo) => (
                  <tr
                    key={wo.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="py-2 px-3 sm:px-4" data-label="Customer">
                      {wo.customerName || "—"}
                    </td>
                    <td className="py-2 px-3 sm:px-4" data-label="Status">
                      <Tag
                        color={
                          wo.status === "COMPLETED" || wo.status === "DONE"
                            ? "green"
                            : wo.status === "IN_PROGRESS"
                            ? "blue"
                            : "default"
                        }
                      >
                        {wo.status === "DONE" ? "COMPLETED" : wo.status}
                      </Tag>
                    </td>
                    <td className="py-2 px-3 sm:px-4" data-label="Services">
                      {wo.services?.length ? wo.services.join(", ") : "—"}
                    </td>
                    <td className="py-2 px-3 sm:px-4" data-label="Closed At">
                      {wo.closedAt
                        ? new Date(wo.closedAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================================================
//  REUSABLE STAT CARD
// ========================================================================
function StatCard({ icon, title, value, color = "text-gray-800" }) {
  return (
    <Card
      className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
      bodyStyle={{ padding: "14px 16px" }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="truncate">
          <p className="text-xs sm:text-sm text-gray-500">{title}</p>
          <h2 className={`text-lg sm:text-xl font-bold ${color}`}>{value}</h2>
        </div>
        <div className="text-gray-400 flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
}
