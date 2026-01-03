"use client";

import React, { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Skeleton } from "antd";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ServiceReport({
  data = [],
  month = "",
  loading = false,
}) {
  const [total, setTotal] = useState(0);

  const topServices = data.slice(0, 3);

  // 🩵 Updated color palette (brand blue + complementary tones)
  const colors = [
    "#2A7BAE", // Primary Blue
    "#6EC1E4", // Light Sky Blue
    "#1B2B45", // Deep Slate Blue (for contrast)
  ];

  useEffect(() => {
    if (topServices.length > 0) {
      setTotal(topServices.reduce((acc, s) => acc + s.count, 0));
    }
  }, [topServices]);

  const chartData = {
    labels: topServices.map((s) => s.name),
    datasets: [
      {
        data: topServices.map((s) => s.count),
        backgroundColor: colors,
        borderColor: "#fff",
        borderWidth: 2,
        hoverOffset: 12, // slightly larger hover effect
      },
    ],
  };

  const options = {
    cutout: "76%",
    rotation: Math.PI,
    responsive: true,
    plugins: {
      tooltip: {
        backgroundColor: "#1B2B45",
        titleColor: "#fff",
        bodyColor: "#d1d5db",
        padding: 10,
        cornerRadius: 8,
      },
      legend: { display: false },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
    hover: {
      mode: "nearest",
      intersect: true,
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full mx-auto rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200/70 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-center justify-between text-sm font-semibold text-gray-700 mb-3">
        <span className="text-[15px] font-semibold text-gray-800">
          Service Report
        </span>
        <span className="flex items-center gap-1 text-gray-500 text-xs">
          <Calendar className="w-4 h-4 text-[#2A7BAE]" />
          {"All Time"}
        </span>
      </div>

      {/* Chart */}
      <div className="relative flex justify-center items-center h-52">
        {loading ? (
          <Skeleton.Avatar active size={120} shape="circle" />
        ) : topServices.length === 0 ? (
          <p className="text-gray-400 text-sm">No data available</p>
        ) : (
          <>
            <Doughnut data={chartData} options={options} />

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.span
                key={total}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
                className="text-3xl font-bold text-gray-900"
              >
                3
              </motion.span>
              <span className="text-xs text-gray-500 mt-1">Top Services</span>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      {!loading && topServices.length > 0 && (
        <div className="mt-5 space-y-2">
          {topServices.map((s, i) => (
            <motion.div
              whileHover={{ scale: 1.02, x: 4 }}
              transition={{ type: "spring", stiffness: 280, damping: 20 }}
              key={s.name}
              className="flex items-center justify-between text-sm font-medium text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full shadow-sm"
                  style={{
                    backgroundColor: colors[i % colors.length],
                    boxShadow: `0 0 6px ${colors[i % colors.length]}55`,
                  }}
                ></div>
                <span className="font-medium text-gray-800">{s.name}</span>
              </div>
              <span className="font-semibold text-gray-900">{s.count}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
