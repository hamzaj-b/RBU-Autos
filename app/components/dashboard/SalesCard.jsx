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
import { Calendar, TrendingUp, Download } from "lucide-react";

/** --- Demo data (12 months so ranges work) --- */
const fullData = [
  { month: "Jan", organic: 42000, professional: 47000 },
  { month: "Feb", organic: 51000, professional: 44000 },
  { month: "Mar", organic: 49000, professional: 50000 },
  { month: "Apr", organic: 52657, professional: 46000 },
  { month: "May", organic: 31000, professional: 40000 },
  { month: "Jun", organic: 37000, professional: 36000 },
  { month: "Jul", organic: 41000, professional: 39000 },
  { month: "Aug", organic: 45500, professional: 42000 },
  { month: "Sep", organic: 48000, professional: 46000 },
  { month: "Oct", organic: 50500, professional: 47000 },
  { month: "Nov", organic: 52000, professional: 53000 },
  { month: "Dec", organic: 54000, professional: 56000 },
];

const currency = (n) =>
  `£${Math.round(n).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

const sum = (arr, k1, k2) =>
  arr.reduce(
    (acc, d) => acc + (k1 ? d[k1] || 0 : 0) + (k2 ? d[k2] || 0 : 0),
    0
  );

const LegendDot = ({ color }) => (
  <span
    className="inline-block h-2.5 w-2.5 rounded-full"
    style={{ backgroundColor: color }}
  />
);

/** Tooltip that also informs hoverIndex */
function CustomTooltip({ active, payload, label, data, setHoverIndex, show }) {
  if (!active || !payload || !payload.length) {
    setHoverIndex(null);
    return null;
  }

  const i = data.findIndex((d) => d.month === label);
  if (i !== -1) setHoverIndex(i);

  const rows = [
    show.professional && payload.find((p) => p.dataKey === "professional"),
    show.organic && payload.find((p) => p.dataKey === "organic"),
  ].filter(Boolean);

  const net = rows.reduce((acc, p) => acc + (p?.value || 0), 0);

  return (
    <div className="rounded-2xl bg-white px-3.5 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
      <div className="text-[13px] font-semibold text-[#0a1733]">
        {currency(net)} <span className="text-gray-500 font-normal">net</span>
      </div>
      <div className="mt-1 space-y-1">
        {rows.map((p) => (
          <div
            key={p.dataKey}
            className="flex items-center justify-between gap-6 text-[12px]"
          >
            <span className="inline-flex items-center gap-2 text-gray-600">
              <LegendDot color={p.stroke} />
              {p.dataKey === "professional" ? "Professional" : "Organic"}
            </span>
            <span className="font-medium text-[#0a1733]">
              {currency(p.value || 0)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 text-[11px] text-gray-500 text-right">{label}</div>
    </div>
  );
}

/** Export helper */
function exportCsv(rows) {
  const header = ["Month", "Organic", "Professional"].join(",");
  const body = rows
    .map((r) => [r.month, r.organic ?? "", r.professional ?? ""].join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "overall_sales.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function OverallSalesCard() {
  /** Ranges */
  const rangeOptions = [
    { key: "3M", size: 3, label: "Last 3 months" },
    { key: "6M", size: 6, label: "Last 6 months" },
    { key: "YTD", size: new Date().getMonth() + 1, label: "YTD" }, // Jan..current month
    { key: "12M", size: 12, label: "Last 12 months" },
  ];

  const [rangeKey, setRangeKey] = React.useState("6M");
  const activeRange =
    rangeOptions.find((r) => r.key === rangeKey) || rangeOptions[1];
  const [hoverIndex, setHoverIndex] = React.useState(null);
  const [show, setShow] = React.useState({ organic: true, professional: true });

  /** Slice data based on range */
  const data = React.useMemo(() => {
    const size = Math.max(1, Math.min(activeRange.size, fullData.length));
    return fullData.slice(-size);
  }, [activeRange.size]);

  /** Totals + vs previous window */
  const totalNow = sum(
    data,
    show.organic ? "organic" : null,
    show.professional ? "professional" : null
  );

  const prevWindow = React.useMemo(() => {
    const size = data.length;
    const start = Math.max(0, fullData.length - size * 2);
    const end = fullData.length - size;
    return fullData.slice(start, end);
  }, [data.length]);

  const totalPrev = sum(
    prevWindow,
    show.organic ? "organic" : null,
    show.professional ? "professional" : null
  );

  const pct =
    totalPrev > 0
      ? (((totalNow - totalPrev) / totalPrev) * 100).toFixed(1)
      : "—";

  const loading = false; // hook in real loading if needed
  const isEmpty =
    !data || data.length === 0 || (!show.organic && !show.professional);

  return (
    <div className="w-full rounded-[18px]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-gray-500">Overall sales</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <div className="text-[30px] sm:text-[34px] font-extrabold leading-none tracking-tight text-[#0a1733]">
              {currency(totalNow)}
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                typeof pct === "string" || parseFloat(pct) >= 0
                  ? "bg-[#dcf2fc] text-[#0a7acb]"
                  : "bg-red-50 text-red-600"
              }`}
              title={`${activeRange.label} vs previous window`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {typeof pct === "string" ? pct : `${pct}%`}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Legend toggles */}
          <div className="flex items-center gap-4 text-[14px] font-medium text-[#74828f]">
            <button
              onClick={() => setShow((s) => ({ ...s, organic: !s.organic }))}
              className={`inline-flex items-center gap-2 transition ${
                show.organic ? "opacity-100" : "opacity-40"
              } hover:opacity-100`}
              aria-pressed={show.organic}
              title="Toggle Organic"
            >
              <LegendDot color="#3bb5ff" /> Organic
            </button>
            <button
              onClick={() =>
                setShow((s) => ({ ...s, professional: !s.professional }))
              }
              className={`inline-flex items-center gap-2 transition ${
                show.professional ? "opacity-100" : "opacity-40"
              } hover:opacity-100`}
              aria-pressed={show.professional}
              title="Toggle Professional"
            >
              <LegendDot color="#164a6a" /> Professional
            </button>
          </div>

          {/* Range pills */}
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
            {rangeOptions.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-lg transition ${
                  rangeKey === r.key
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
            // onClick={() => exportCsv(data)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-[#2c3545] shadow-sm hover:bg-gray-50"
            title="Export CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          {/* Static label (kept from your design) */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-[12px] font-medium text-[#2c3545] shadow-sm">
            {activeRange.label}
            <Calendar className="h-4 w-4 text-[#0a7acb]" />
          </div>
        </div>
      </div>

      {/* Chart / Empty / Loading */}
      <div className="relative mt-5 h-72 w-full">
        {loading ? (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            Loading…
          </div>
        ) : isEmpty ? (
          <div className="absolute inset-0 grid place-items-center text-gray-500">
            No data to display
          </div>
        ) : (
          <>
            {/* Backdrop columns */}
            <div
              className="pointer-events-none absolute inset-0 z-0 grid gap-3 px-1 sm:gap-5 sm:px-2"
              style={{
                gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
              }}
            >
              {data.map((_, i) => (
                <div
                  key={i}
                  className="mx-auto h-full w-full max-w-[64px] rounded-2xl ring-1 ring-[#cfe8f6] transition-all duration-200"
                  style={{
                    background:
                      hoverIndex === i
                        ? "linear-gradient(180deg, rgba(59,181,255,0.25) 0%, rgba(220,242,252,0.9) 60%, rgba(255,255,255,0.0) 100%)"
                        : "rgba(220,242,252,0.6)",
                  }}
                />
              ))}
            </div>

            {/* Chart */}
            <div className="relative z-10 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  onMouseLeave={() => setHoverIndex(null)}
                  margin={{ top: 10, right: 40, left: 0, bottom: 6 }}
                >
                  <defs>
                    <linearGradient id="organic" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#3bb5ff"
                        stopOpacity={0.28}
                      />
                      <stop offset="100%" stopColor="#3bb5ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pro" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="#164a6a"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#164a6a" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  {/* Hide internal X ticks to avoid duplicate months */}
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={false}
                  />
                  <YAxis
                    domain={["dataMin - 2000", "dataMax + 2000"]}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9aa3af", fontSize: 12 }}
                  />

                  <Tooltip
                    content={(props) => (
                      <CustomTooltip
                        {...props}
                        data={data}
                        setHoverIndex={setHoverIndex}
                        show={show}
                      />
                    )}
                    cursor={{ stroke: "#e5e7eb" }}
                  />

                  {/* Series (conditional render via legend toggles) */}
                  {show.professional && (
                    <Area
                      type="monotone"
                      dataKey="professional"
                      stroke="#164a6a"
                      fill="url(#pro)"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "#164a6a" }}
                    />
                  )}

                  {show.organic && (
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
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      {/* Single month row (only place months appear) */}
      {!isEmpty && (
        <div
          className="mt-2 grid"
          style={{
            gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
          }}
        >
          {data.map((d, i) => (
            <span
              key={d.month}
              className={`px-1 text-center text-[12px] text-[#6b7280] transition ${
                hoverIndex === i ? "font-semibold text-[#0a1733]" : ""
              }`}
            >
              {d.month}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
