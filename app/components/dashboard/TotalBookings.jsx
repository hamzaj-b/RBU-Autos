"use client";

import React from "react";
import { MoreVertical, Tag } from "lucide-react";
import { Skeleton } from "antd";
import { useRouter } from "next/navigation";

/* --- Micro bar chart (consistent spacing & rounded corners) --- */
function MiniBars({ data = [78, 34, 96, 58], accentIndex = 0 }) {
  const w = 148,
    h = 84;
  const padX = 12,
    barW = 18,
    gap = 20,
    radius = 4;
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
        const fill = isAccent ? "#1B2B45" : "#2A7BAE";
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

/* --- Main Component --- */
export default function WorkCompletedCard({
  title = "Work Completed",
  amount,
  loading = false,
  bars = [78, 36, 98, 60],
  accentIndex = 0,
}) {
  const router = useRouter();
  return (
    <div onClick={() => router.push("/manage-booking")}>
    <div className=" cursor-pointer w-full rounded-[18px] bg-white p-4 sm:p-5 shadow-sm ring-1 ring-gray-200/70 flex flex-col justify-between transition-all hover:shadow-md">
      {/* === Header === */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <Tag className="h-5 w-5 text-blue-500" />
          <div className="text-lg sm:text-[22px] font-bold tracking-tight text-[#0a1733]">
            {title}
          </div>
        </div>

        {/* <button className="grid h-7 sm:h-8 w-7 sm:w-8 place-items-center rounded-full text-[#9AA3AF] hover:bg-gray-50">
          <MoreVertical className="h-4 sm:h-5 w-4 sm:w-5" />
        </button> */}
      </div>

      {/* === Value + Mini Chart === */}
      <div className="mt-3 sm:mt-4 flex items-end justify-between">
        <div className="w-2/3">
          {loading ? (
            <Skeleton.Input
              active
              size="large"
              style={{ width: 50, height: 36, borderRadius: 6 }}
            />
          ) : (
            <div className="text-xl sm:text-[32px] font-black leading-none tracking-tight text-[#0a1733]">
              {amount?.toLocaleString() ?? 0}
            </div>
          )}
        </div>

        {/* Mini Bars */}
        <div className="flex justify-end w-1/3 shrink-0 rounded-2xl bg-white pr-1">
          <MiniBars data={bars} accentIndex={accentIndex} />
        </div>
      </div>
    </div>
    </div>
  );
}
