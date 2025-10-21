"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Calendar, TrendingUp, Download } from "lucide-react";
import { Skeleton } from "antd";

// Currency formatter
const currency = (n) =>
  `$ ${Math.round(n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
  })}`;

// Smart tick formatter for Y axis
const formatTicks = (v) => {
  const n = Number(v) || 0;
  if (Math.abs(n) < 1000) return `${n}`;
  return `${Math.round(n / 1000)}k`;
};

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value || 0;
  return (
    <div className="rounded-xl bg-white px-3 py-2 shadow-md ring-1 ring-black/5">
      <div className="text-sm font-semibold text-[#0a1733]">
        {currency(value)}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default function OverallSalesCard({
  data = [], // [{ month: "Jan", sales: 12345 }, ...]
  loading = false,
  onRangeChange,
  activeRange = "6M",
}) {
  const rangeOptions = [
    { key: "3M", label: "Last 3 months" },
    { key: "6M", label: "Last 6 months" },
    { key: "9M", label: "Last 9 months" },
    { key: "12M", label: "Last 12 months" },
  ];

  // Total & simple growth (placeholder)
  const totalSales = useMemo(
    () => (data || []).reduce((sum, d) => sum + (Number(d.sales) || 0), 0),
    [data]
  );

  // Handle empty / all-zero datasets
  const allZero =
    !data?.length || data.every((d) => (Number(d.sales) || 0) === 0);

  // Hover coloring
  const [hoverIndex, setHoverIndex] = React.useState(null);
  const barColors = ["#3bb5ff", "#2A7BAE", "#0a7acb", "#164a6a", "#5cc8ff"];

  return (
    <div className="w-full rounded-[18px] bg-white p-5 sm:p-6 shadow-sm ring-1 ring-gray-200/70 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">Monthly Sales</div>
          {loading ? (
            <Skeleton.Input
              active
              size="large"
              style={{ width: 160, height: 42, borderRadius: 8, marginTop: 4 }}
            />
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div className="text-[30px] sm:text-[34px] font-extrabold leading-none tracking-tight text-[#0a1733]">
                {currency(totalSales)}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Range */}
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {rangeOptions.map((r) => (
              <button
                key={r.key}
                onClick={() => onRangeChange?.(r.key)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition ${
                  activeRange === r.key
                    ? "bg-[#0a7acb]/10 text-[#0a7acb]"
                    : "text-[#2c3545] hover:bg-gray-50"
                }`}
                title={r.label}
              >
                {r.key}
              </button>
            ))}
          </div>

          {/* Export */}
          <button
            onClick={() => {
              const header = ["Month", "Sales"].join(",");
              const body = (data || [])
                .map((r) => [r.month, r.sales ?? ""].join(","))
                .join("\n");
              const blob = new Blob([`${header}\n${body}`], {
                type: "text/csv;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "monthly_sales.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-[#2c3545] shadow-sm hover:bg-gray-50"
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          {/* Static label */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-[#2c3545] shadow-sm">
            {rangeOptions.find((r) => r.key === activeRange)?.label}
            <Calendar className="h-4 w-4 text-[#0a7acb]" />
          </div>
        </div>
      </div>

      {/* Chart / Empty / Loading */}
      <div className="relative mt-6 h-72 w-full">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : !data?.length ? (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            No sales data available
          </div>
        ) : allZero ? (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            No revenue recorded in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 18, right: 26, left: 6, bottom: 6 }}
              onMouseLeave={() => setHoverIndex(null)}
              barCategoryGap="28%" // spacing between categories
              barGap={8} // gap between bars (single series)
            >
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aa3af", fontSize: 12 }}
              />
              <YAxis
                domain={[0, (max) => (Number(max) || 0) * 1.15]} // 15% headroom
                allowDecimals={false}
                tickFormatter={formatTicks}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aa3af", fontSize: 12 }}
                width={40}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f5f7fa" }}
              />
              <Bar
                dataKey="sales"
                radius={[8, 8, 0, 0]}
                barSize={38}
                animationDuration={500}
                animationEasing="ease-in-out"
              >
                {data.map((_, i) => (
                  <Cell
                    key={`bar-${i}`}
                    fill={
                      i === hoverIndex
                        ? "#0a7acb"
                        : barColors[i % barColors.length]
                    }
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
