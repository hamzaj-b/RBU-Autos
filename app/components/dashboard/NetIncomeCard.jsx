"use client";
import React from "react";
import {
  MoreVertical,
  ArrowDown,
  CircleDollarSign,
  ArrowUpDown,
} from "lucide-react";

// Improved SVG micro bar chart with even spacing
function MiniBars({ data = [54, 22, 96, 44], accentIndex = 1 }) {
  const w = 140; // svg width
  const h = 80; // svg height
  const padX = 12;
  const barW = 18;
  const gap = 18;
  const radius = 4;
  const max = Math.max(...data, 1);

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="block overflow-visible"
    >
      {data.map((v, i) => {
        const x = padX + i * (barW + gap);
        const barH = Math.round((v / max) * (h - 12));
        const y = h - barH;
        const isAccent = i === accentIndex;
        const fill = isAccent ? "#0d1426" : "#2A7BAE"; // lime vs navy
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barW}
            height={barH}
            rx={radius}
            ry={radius}
            fill={fill}
          />
        );
      })}
    </svg>
  );
}

const currency = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    n
  );

export default function NewNetIncomeCard({
  title = "New Net Income",
  amount = 8245,
  deltaPct = -0.5,
  bars = [62, 28, 95, 46],
  accentIndex = 1,
}) {
  const down = deltaPct < 0;
  const pctText = `${down ? "-" : "+"}${Math.abs(deltaPct).toLocaleString(
    undefined,
    { maximumFractionDigits: 1 }
  )}%`;

  return (
    <div className="w-full rounded-[18px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200/70 flex flex-col justify-between">
      {/* top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* <img src="/icon2.png" alt="" className="w-5 sm:w-auto" /> */}
          <CircleDollarSign className="h- w- text-blue" />
          <div className="text-lg sm:text-[22px] font-bold tracking-tight text-[#0a1733]">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="grid h-7 sm:h-8 w-7 sm:w-8 place-items-center rounded-full text-[#9AA3AF] hover:bg-gray-50">
            <MoreVertical className="h-4 sm:h-5 w-4 sm:w-5" />
          </button>
        </div>
      </div>

      {/* amount row */}
      <div className="mt-3 sm:mt-4 flex items-end justify-between">
        <div>
          <div className="text-xl sm:text-[32px] font-bold tracking-tight text-[#0a1733]">
            {currency(amount)}
          </div>
        </div>

        {/* mini chart */}
        <div className="shrink-0 rounded-2xl bg-white pr-1">
          <MiniBars data={bars} accentIndex={accentIndex} />
        </div>
      </div>
    </div>
  );
}
