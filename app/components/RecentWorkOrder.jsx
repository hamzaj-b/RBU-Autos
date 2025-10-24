import React from "react";
import { Printer, Eye } from "lucide-react";

const RecentWorkOrder = ({
  data,
  containerWidth = "w-full",
  heading = "Recent Work Orders",
}) => {
  return (
    <div className={`${containerWidth}`}>
      {/* Section Heading */}
      <h2 className="text-lg sm:text-xl md:text-2xl px-3 sm:px-4 py-2 sm:py-3 text-gray-700 font-semibold mb-3 sm:mb-5 tracking-tight flex items-center justify-between">
        {heading}
        <span className="text-sm text-gray-400 font-normal hidden sm:inline">
          ({data.length || 0})
        </span>
      </h2>

      <div className="space-y-3 sm:space-y-4 px-2 sm:px-3">
        {data.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300"
          >
            <div className="p-4 sm:p-5">
              {/* Header: Avatar + Customer Info + Status */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Avatar + Name + Time */}
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-bold text-base sm:text-lg shadow-sm">
                    {item.customer
                      ?.split(" ")
                      .map((n) => n[0]?.toUpperCase())
                      .join("")
                      .slice(0, 2)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900 font-semibold text-sm sm:text-base truncate">
                      {item.customer}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs sm:text-sm text-gray-500">
                      <span>{item.orderDate}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{item.orderTime}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Badge */}
                <div className="flex items-center justify-end">
                  <span
                    className={`inline-flex items-center justify-center px-3 py-1 text-xs sm:text-sm font-medium rounded-md transition-colors duration-300
                    ${
                      item.status === "COMPLETED"
                        ? "bg-gradient-to-tl from-green-600 to-emerald-600 text-white shadow-sm"
                        : item.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="my-3 sm:my-4 border-t border-gray-100" />

              {/* Footer: Order No + Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-xs sm:text-sm text-gray-500">
                  <span className="font-medium text-gray-700">Order No:</span>{" "}
                  <span className="tabular-nums">#{item.id}</span>
                </p>

                {item.status === "COMPLETED" ? (
                  <button
                    onClick={() =>
                      window.open(`/checkout/${item.id}`, "_blank")
                    }
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-tl from-blue-bold to-blue-theme !text-white text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-sm hover:shadow-md hover:scale-[1.02] transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <Printer size={16} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">View Details</span>
                  </button>
                ) : (
                  <button
                    className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-all"
                    onClick={() =>
                      window.open(`/workorder/${item.id}`, "_blank")
                    }
                  >
                    <Eye size={15} />
                    <span className="hidden sm:inline">View</span>
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* Empty State */}
        {data.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm sm:text-base italic">
            No recent work orders found.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentWorkOrder;
