"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Calendar } from "lucide-react";

// --- Dummy data for one week ---
const data = [
  { day: "24 Jan", p1: 12, p2: 10, p3: 8, p4: 5, n1: -6, n2: -4, n3: -5 },
  { day: "25 Jan", p1: 8, p2: 7, p3: 6, p4: 4, n1: -5, n2: -6, n3: -7 },
  { day: "26 Jan", p1: 0, p2: 0, p3: 0, p4: 0, n1: -7, n2: -5, n3: 0 },
  { day: "27 Jan", p1: 6, p2: 5, p3: 4, p4: 0, n1: -4, n2: -3, n3: -2 },
  { day: "28 Jan", p1: 14, p2: 10, p3: 8, p4: 6, n1: -10, n2: -8, n3: 0 },
  { day: "29 Jan", p1: 9, p2: 7, p3: 0, p4: 0, n1: -6, n2: -5, n3: -4 },
  { day: "30 Jan", p1: 10, p2: 8, p3: 0, p4: 0, n1: -7, n2: -4, n3: 0 },
];

// Color scheme (lime stack up, olive stack down)
const COLORS_POS = ["#bde72c", "#b5ee2e", "#a6f03c", "#92f35a"];
const COLORS_NEG = ["#8b8f2b", "#9aa030", "#aab438"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  const totalPos = payload
    .filter((p) => p.value > 0)
    .reduce((a, b) => a + (b.value || 0), 0);
  const totalNeg = payload
    .filter((p) => p.value < 0)
    .reduce((a, b) => a + (b.value || 0), 0);
  const net = totalPos + totalNeg;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-center shadow-lg ring-1 ring-black/5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-semibold text-[#9AA20C]">
        {net.toFixed(0)}
      </div>
      <div className="text-[10px] text-gray-500">Net</div>
    </div>
  );
};

export default function WeeklyTransactionsCard() {
  return (
    <div className="w-full rounded-[18px] bg-white p-6 shadow-sm ring-1 ring-gray-200/70">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-6">
        <div>
          <div className="text-[22px] font-extrabold leading-tight tracking-tight text-[#0a1733]">
            Weekly Transaction
            <br />
            Summary
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-[#2c3545] shadow-sm hover:bg-gray-50">
          Last 7 month
          <Calendar className="h-4 w-4 text-[#B8BF25]" />
        </button>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 10, left: 0, bottom: 0 }}
            barCategoryGap={60}
            barGap={4}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#9aa3af", fontSize: 13 }}
            />
            <YAxis hide />
            <ReferenceLine y={0} stroke="#d5dadd" strokeWidth={2} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={<CustomTooltip />}
            />

            {/* NEGATIVE stacks */}
            <Bar dataKey="n1" stackId="neg" fill={COLORS_NEG[0]} />
            <Bar dataKey="n2" stackId="neg" fill={COLORS_NEG[1]} />
            <Bar dataKey="n3" stackId="neg" fill={COLORS_NEG[2]} />

            {/* POSITIVE stacks */}
            <Bar dataKey="p1" stackId="pos" fill={COLORS_POS[0]} />
            <Bar dataKey="p2" stackId="pos" fill={COLORS_POS[1]} />
            <Bar dataKey="p3" stackId="pos" fill={COLORS_POS[2]} />
            <Bar dataKey="p4" stackId="pos" fill={COLORS_POS[3]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
