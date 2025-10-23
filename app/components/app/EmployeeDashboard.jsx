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

export default function EmployeeDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

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
      {/* ✅ Responsive Table + Text Wrap Fix */}
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
            word-wrap: break-word !important;
            white-space: normal !important;
          }
          table td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #4b5563;
            margin-right: 0.5rem;
          }
        }
      `}</style>

      {/* 👤 Employee Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border border-gray-100">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <UserCircle2 className="text-blue-600 flex-shrink-0" size={50} />
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">
              {employee.fullName}
            </h2>
            <p className="text-gray-500 text-sm sm:text-base break-words">
              {employee.title || "Employee"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
          <Tag color="green" className="text-xs sm:text-sm whitespace-nowrap">
            Active
          </Tag>
          <div className="text-gray-600 text-sm sm:text-base whitespace-nowrap">
            Hourly Rate:{" "}
            <span className="font-semibold text-blue-700">
              ${employee.hourlyRate || 0}/hr
            </span>
          </div>
        </div>
      </div>

      {/* 📊 Stat Summary */}
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

      {/* 📈 Weekly Chart */}
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

      {/* 🕓 Recent Orders */}
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
                    <td
                      className="py-2 px-3 sm:px-4 text-gray-800 break-words"
                      data-label="Customer"
                    >
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
                    <td
                      className="py-2 px-3 sm:px-4 text-gray-700 break-words"
                      data-label="Services"
                    >
                      {wo.services?.length ? wo.services.join(", ") : "—"}
                    </td>
                    <td
                      className="py-2 px-3 sm:px-4 text-gray-600 whitespace-nowrap"
                      data-label="Closed At"
                    >
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

// ✅ Reusable Stat Card
function StatCard({ icon, title, value, color = "text-gray-800" }) {
  return (
    <Card
      className="rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
      bodyStyle={{ padding: "14px 16px" }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="truncate">
          <p className="text-xs sm:text-sm text-gray-500 break-words">
            {title}
          </p>
          <h2 className={`text-lg sm:text-xl font-bold ${color} break-words`}>
            {value}
          </h2>
        </div>
        <div className="text-gray-400 flex-shrink-0">{icon}</div>
      </div>
    </Card>
  );
}
