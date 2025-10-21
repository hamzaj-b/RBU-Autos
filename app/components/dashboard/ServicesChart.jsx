"use client";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Skeleton } from "antd";
import { Calendar } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ServiceReport({
  data = [],
  month = "",
  loading = false,
}) {
  // Extract top 3 services safely
  const topServices = data.slice(0, 3);

  const chartData = {
    labels: topServices.map((s) => s.name),
    datasets: [
      {
        data: topServices.map((s) => s.count),
        backgroundColor: ["#F9D84D", "#2A7BAE", "#0d1426"],
        borderColor: ["#F9D84D", "#2A7BAE", "#0d1426"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    cutout: "75%",
    responsive: true,
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
    },
    rotation: Math.PI, // half circle
  };

  return (
    <div className="w-full mx-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200/70 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
        <span>Service Report</span>
        <span className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-4 h-4 text-blue-500" />
          {month || "—"}
        </span>
      </div>

      {/* Chart Area */}
      <div className="mt-4 flex justify-center items-center h-48">
        {loading ? (
          <Skeleton.Avatar active size={120} shape="circle" />
        ) : topServices.length === 0 ? (
          <p className="text-gray-400 text-sm">No data available</p>
        ) : (
          <Doughnut data={chartData} options={options} />
        )}
      </div>

      {/* Legend */}
      {!loading && topServices.length > 0 && (
        <div className="mt-5 space-y-2">
          {topServices.map((s, i) => {
            const colors = ["#F9D84D", "#2A7BAE", "#0d1426"];
            return (
              <div
                key={s.name}
                className="flex items-center justify-between text-xs text-gray-600"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  ></div>
                  <span className="font-medium">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{s.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Button */}
      <button
        disabled={loading}
        className="!mt-5 w-full py-2 text-sm font-medium bg-[#2A7BAE] !text-white rounded-md hover:bg-[#246b97] transition disabled:opacity-60"
      >
        {loading ? "Loading..." : "View More"}
      </button>
    </div>
  );
}
