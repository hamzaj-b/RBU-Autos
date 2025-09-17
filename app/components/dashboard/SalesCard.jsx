"use client";
import React from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Calendar, TrendingUp } from "lucide-react";

const fullData = [
  { month: "Jan", organic: 42000, professional: 47000 },
  { month: "Feb", organic: 51000, professional: 44000 },
  { month: "Mar", organic: 49000, professional: 50000 },
  { month: "Apr", organic: 52657, professional: 46000 },
  { month: "May", organic: 31000, professional: 40000 },
  { month: "Jun", organic: 37000, professional: 36000 },
  { month: "Jul", organic: 41000, professional: 39000 },
];

const currency = (n) =>
  `£${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const LegendDot = ({ color }) => (
  <span
    className="inline-block h-2.5 w-2.5 rounded-full"
    style={{ backgroundColor: color }}
  />
);

/** Drive hoverIndex from tooltip so the correct column highlights */
function CustomTooltip({
  active,
  payload,
  label,
  data,
  setHoverIndex,
}) {
  if (!active || !payload || !payload.length) {
    setHoverIndex(null);
    return null;
  }

  // Find the hovered index using the label (month)
  const i = data.findIndex((d) => d.month === label);
  if (i !== -1) setHoverIndex(i);

  const net = payload.reduce((acc, p) => acc + (p.value || 0), 0);

  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-[0_12px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
      <div className="text-[13px] font-semibold text-blue">
        {currency(net)}
      </div>
      <div className="text-[11px] text-gray-500 -mt-0.5">Net sales</div>
    </div>
  );
}

export default function OverallSalesCard() {
  const [range] = React.useState(7);
  const [hoverIndex, setHoverIndex] = React.useState(null);
  const data = React.useMemo(() => fullData.slice(-range), [range]);

  return (
    <div className="w-full rounded-[18px]">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-sm font-medium text-gray-500">Overall sales</div>
          <div className="mt-1 flex items-center gap-3">
            <div className="text-[34px] font-extrabold leading-none tracking-tight text-[#0a1733]">
              £56,345.98
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#dcf2fc] px-2.5 py-1 text-xs font-semibold text-blue">
              <TrendingUp className="h-3.5 w-3.5" /> 23.5%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-[15px] font-medium text-[#74828f]">
            <span className="inline-flex items-center gap-2">
              <LegendDot color="#3bb5ff" /> Organic
            </span>
            <span className="inline-flex items-center gap-2">
              <LegendDot color="#164a6a" /> Professional
            </span>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-medium text-[#2c3545] shadow-sm hover:bg-gray-50">
            Last 7 month
            <Calendar className="h-4 w-4 text-blue" />
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="relative mt-5 h-72 w-full">
        {/* Backdrop columns underneath chart */}
        <div
          className="pointer-events-none absolute inset-0 z-0 grid gap-5 px-2"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          }}
        >
          {data.map((_, i) => (
            <div
              key={i}
              className="mx-auto h-full w-full max-w-[64px] rounded-2xl transition-all duration-200"
              style={{
                // green-500 -> green-100 gradient on the hovered column
                background:
                  hoverIndex === i
                    ? "linear-gradient(180deg, rgba(59, 181, 255,1) 0%, rgba(220, 242, 252,1) 55%, rgba(240,253,244,0.00) 100%)"
                    : "rgba(220, 242, 252,1)", // base mint column
              }}
            />
          ))}
        </div>

        {/* Chart sits above the backdrop */}
        <div className="relative z-10 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              onMouseLeave={() => setHoverIndex(null)}
              margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Organic (yellow line) */}
                <linearGradient id="organic" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3bb5ff" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#3bb5ff" stopOpacity={0} />
                </linearGradient>
                {/* Professional (green area) */}
                <linearGradient id="pro" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#164a6a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#164a6a" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aa3af", fontSize: 13 }}
              />
              <YAxis
                domain={[30000, 60000]}
                ticks={[30000, 40000, 50000, 60000]}
                tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                width={40}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9aa3af", fontSize: 13 }}
              />

              {/* Tooltip drives hoverIndex */}
              <Tooltip
                content={(props) => (
                  <CustomTooltip
                    {...props}
                    data={data}
                    setHoverIndex={setHoverIndex}
                  />
                )}
                cursor={{ stroke: "#e5e7eb" }}
              />

              {/* Professional (green) */}
              <Area
                type="monotone"
                dataKey="professional"
                stroke="#164a6a"
                fill="url(#pro)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: "#164a6a" }}
              />

              {/* Organic (yellow) */}
              <Line
                type="monotone"
                dataKey="organic"
                stroke="#3bb5ff"
                strokeWidth={3}
                dot={{ r: 0 }}
                activeDot={{
                  r: 6,
                  fill: "#fff",
                  stroke: "#3bb5ff",
                  strokeWidth: 3,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-2 flex justify-between px-2 text-[13px] text-[#9aa3af]">
        {data.map((d) => (
          <span key={d.month} className="w-8 text-center">
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}
