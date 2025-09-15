"use client";
import React from "react";
import { MoreVertical } from "lucide-react";

// --- tiny stacked avatars (uses your local assets like your other card)
function Avatars() {
  return (
    <div className="flex -space-x-2">
      <img
        src="/profile.png"
        alt="u1"
        className="h-6 w-6 rounded-full ring-2 ring-white"
      />
      <img
        src="/user1.png"
        alt="u2"
        className="h-6 w-6 rounded-full ring-2 ring-white"
      />
      <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#B8BF25] px-1 text-[11px] font-semibold text-white ring-2 ring-white">
        25+
      </span>
    </div>
  );
}

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
        const fill = isAccent ? "#B8BF25" : "#0D1426"; // lime accent, navy base
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
    <div className="w-full rounded-[18px] bg-white p-5 shadow-sm ring-1 ring-gray-200/70 flex flex-col justify-between">
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* use your cart icon image to match design */}
          <img
            src="/icon3.png"
            alt="bookings"
            className="h-10 w-10 object-contain"
          />
          <div className="text-[22px] font-bold tracking-tight text-[#0a1733]">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Avatars />
          <button className="grid h-8 w-8 place-items-center rounded-full text-[#9AA3AF] hover:bg-gray-50">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* metric + spark bars */}
      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="text-[32px] font-black leading-none tracking-tight text-[#0a1733]">
            {amount}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[15px]">
            <img src="/previous.png" width={18} alt="" />
            <span className="text-[#9AA20C] font-semibold">{deltaPct}</span>
            <span className="text-[#8f97a3]">from last week</span>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl bg-white pr-1">
          <MiniBars data={bars} accentIndex={accentIndex} />
        </div>
      </div>
    </div>
  );
}
