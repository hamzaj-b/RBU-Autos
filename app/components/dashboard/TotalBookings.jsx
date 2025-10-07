"use client";
import React from "react";
import { ArrowUpDown, MoreVertical, ShoppingCart } from "lucide-react";

// --- micro bar chart (kept consistent so last bar never clips)
function MiniBars({ data = [48, 26, 84, 52], accentIndex = 2 }) {
  const w = 148,
    h = 84;
  const padX = 12,
    barW = 18,
    gap = 20,
    radius = 6;
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
        const fill = isAccent ? "#0D1426" : "#2A7BAE"; // lime accent, navy base
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

export default function NewBookingsCard({
  title = "Total Bookings",
  amount = 256,
  deltaPct = "+1.0%",
  bars = [58, 30, 92, 50],
  accentIndex = 2,
}) {
  return (
    <div className="w-full rounded-[18px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200/70 flex flex-col justify-between">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <ShoppingCart className="h-6 w-6 text-blue" />
          <div className="text-lg sm:text-[22px] font-bold tracking-tight text-[#0a1733]">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-full text-[#9AA3AF] hover:bg-gray-50">
            <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* metric + spark bars */}
      <div className="mt-3 sm:mt-4 flex items-end justify-between">
        <div>
          <div className="text-xl sm:text-[32px] font-black leading-none tracking-tight text-[#0a1733]">
            {amount}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-white pr-1">
          <MiniBars data={bars} accentIndex={accentIndex} />
        </div>
      </div>
    </div>
  );
}
