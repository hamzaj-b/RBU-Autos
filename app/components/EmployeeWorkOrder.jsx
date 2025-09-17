import React from "react";

/**
 * EmployeeWorkOrder
 * Props:
 * - data: Array<{ id, customer, image, orderDate, orderTime, status }>
 * - heading?: string
 * - containerWidth?: string (Tailwind width class)
 * - onAccept?: (item) => void
 * - onDecline?: (item) => void
 * - pendingIds?: Set<string|number>  // disable buttons for items being processed
 */
const EmployeeWorkOrder = ({
  data,
  heading = "Recent Work Order",
  containerWidth = "w-full",
  onAccept,
  onDecline,
  pendingIds,
}) => {
  const isPending = (id) => !!pendingIds?.has?.(id);

  return (
    <div className={containerWidth}>
      <h2 className="text-lg sm:text-[22px] px-3 sm:px-4 py-2 sm:py-3 text-gray-500 font-semibold mb-2 sm:mb-4">
        {heading}
      </h2>

      <div className="space-y-2 sm:space-y-3 px-2 sm:px-3">
        {data.map((item) => {
          const disabled = isPending(item.id);
          return (
            <article
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow transition-shadow"
            >
              {/* Card body */}
              <div className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Left cluster: Order No + Customer + Date/Time */}
                  <div className="flex items-start md:items-center gap-3 sm:gap-4 min-w-0">
                    {/* Order No */}
                    {/* <div className="bg-gray-100 text-gray-700 rounded-xl px-2.5 py-1 text-xs sm:text-sm font-medium tabular-nums shrink-0">
                      #{item.id}
                    </div> */}

                    {/* Avatar + Name + Date/Time */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.customer}
                        className="w-9 h-9 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-gray-800 text-sm md:text-lg font-semibold truncate">
                          {item.customer}
                        </p>
                        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                          <span className="text-gray-700 truncate">
                            {item.orderDate}
                          </span>
                          <span className="hidden md:block text-gray-400">
                            •
                          </span>
                          <span className="text-gray-500 truncate">
                            {item.orderTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right cluster (desktop): Status + Actions */}
                  <div className="hidden md:flex items-center gap-3 sm:gap-4">
                    {/* Status pill */}
                    {/* <span
                      className={`h-6 px-3 rounded-full inline-flex items-center justify-center text-xs sm:text-sm font-medium
                        ${
                          item.status === "Completed"
                            ? "bg-green-100 text-green-600"
                            : item.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {item.status}
                    </span> */}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onAccept?.(item)}
                        disabled={disabled}
                        aria-disabled={disabled}
                        className="px-4 sm:px-5 py-1.5 rounded-lg bg-green-700 text-white font-medium shadow-md hover:bg-green-800 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecline?.(item)}
                        disabled={disabled}
                        aria-disabled={disabled}
                        className="px-4 sm:px-5 py-1.5 rounded-lg bg-red-500 text-white font-medium shadow-md hover:bg-red-600 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Decline
                      </button>
                    </div>
                  </div>

                  {/* Mobile: Status inline under name */}
                  {/* <div className="md:hidden">
                    <span
                      className={`h-6 px-2 rounded-full inline-flex items-center justify-center text-xs font-medium
                        ${
                          item.status === "Completed"
                            ? "bg-green-100 text-green-600"
                            : item.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                    >
                      {item.status}
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Divider */}
              <div  />

              {/* Footer actions (mobile-first; desktop shows a tidy meta row) */}
              <div className="px-3 sm:px-4 py-2 ">
                {/* Mobile actions: full-width buttons */}
                <div className="flex md:hidden gap-2">
                  <button
                    type="button"
                    onClick={() => onAccept?.(item)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    className="w-1/2 py-1 md:py-2 rounded-lg bg-green-700 text-white text-sm md:text-base font-medium shadow-md hover:bg-green-800 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecline?.(item)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    className="w-1/2 py-1 md:py-2 rounded-lg bg-red-500 text-white text-sm md:text-base font-medium shadow-md hover:bg-red-600 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                </div>

                {/* Desktop meta row */}
                <div className="border-t border-gray-100 mt-2 pt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Order No: <span className="tabular-nums">#{item.id}</span>
                  </div>
                  <button
                    type="button"
                    className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md px-2 py-1 transition-colors"
                  >
                    View details
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default EmployeeWorkOrder;
