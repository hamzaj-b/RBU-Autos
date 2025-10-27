"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Spin, Empty, message, Pagination, Alert } from "antd";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCcw, MapPin } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function EmployeeSessionsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useParams();

  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
  });
  const [loading, setLoading] = useState(false);

  const fetchSessions = async (page = 1) => {
    if (!id || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${id}?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
        setPagination(data.pagination || {});
      } else {
        message.error(data.error || "Failed to load sessions");
      }
    } catch (err) {
      console.error(err);
      message.error("Network error while loading sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(1);
  }, [id, token]);

  return (
    <div className="min-h-screen  px-3 sm:px-6 py-6 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/staff-management")}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Employee Sessions
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchSessions(pagination.page)}
          className="flex items-center gap-2 text-gray-600"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {/* Enhanced Info Banner */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 flex-shrink-0">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>

          {/* Text */}
          <div className="flex-1 text-gray-700 text-sm sm:text-base leading-relaxed">
            <p className="font-semibold text-blue-800 mb-1">
              Location Precision Notice
            </p>
            <p>
              The displayed locations are approximate and may not reflect the
              exact position of the employee at login/logout time.
            </p>
            <p className="mt-2">
              For precise coordinates, visit{" "}
              <a
                href="https://www.latlong.net/Show-Latitude-Longitude.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-medium underline hover:text-blue-900 transition"
              >
                latlong.net
              </a>{" "}
              and enter the <strong>latitude</strong> and{" "}
              <strong>longitude</strong> values shown in the table below.
            </p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 transition-all duration-300">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : sessions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-left">
                    <th className="p-3 border-b">#</th>
                    <th className="p-3 border-b">Login Time</th>
                    <th className="p-3 border-b">Logout Time</th>
                    <th className="p-3 border-b">Duration</th>
                    <th className="p-3 border-b">Source</th>
                    <th className="p-3 border-b">Location</th>
                    <th className="p-3 border-b text-center">Latitude</th>
                    <th className="p-3 border-b text-center">Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <tr
                      key={s.id}
                      className="hover:bg-gray-50 border-b last:border-0 transition"
                    >
                      <td className="p-3 text-gray-600">
                        {(pagination.page - 1) * pagination.limit + i + 1}
                      </td>
                      <td className="p-3 text-gray-800 font-medium">
                        {new Date(s.loginAt).toLocaleString()}
                      </td>
                      <td className="p-3 text-gray-700">
                        {s.logoutAt
                          ? new Date(s.logoutAt).toLocaleString()
                          : "🟢 Active"}
                      </td>
                      <td className="p-3 text-gray-700">{s.duration}</td>
                      <td className="p-3 text-gray-600">{s.source || "N/A"}</td>
                      <td className="p-3 text-gray-700">
                        {s.location || "Unknown"}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {s.latitude ? s.latitude.toFixed(5) : "—"}
                      </td>
                      <td className="p-3 text-center text-gray-600">
                        {s.longitude ? s.longitude.toFixed(5) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center mt-6">
              <Pagination
                current={pagination.page}
                pageSize={pagination.limit}
                total={pagination.total}
                onChange={(page) => fetchSessions(page)}
                showSizeChanger={false}
              />
            </div>
          </>
        ) : (
          <Empty description="No session history found" className="py-12" />
        )}
      </div>

      {/* Responsive footer note */}
      <div className="text-center text-xs text-gray-500 mt-6">
        Showing session logs with approximate geolocation data.
      </div>
    </div>
  );
}
