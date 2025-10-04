
import React from "react";

const RecentWorkOrder = ({
  data,
  containerWidth = "w-full",
  heading = "Recent Work Order",
}) => {
  return (
    <div className={containerWidth}>
      <h2 className="text-lg sm:text-[22px] px-3 sm:px-4 py-2 sm:py-3 text-gray-500 font-semibold mb-2 sm:mb-4">
        {heading}
      </h2>


      <div className="space-y-2 sm:space-y-3 px-2 sm:px-3">
        {data.map((item) => (
          <article
            key={item.id}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow transition-shadow"
          >
            {/* Card Content */}
            <div className="p-3 sm:p-4">
              {/* Top row: Order No + Customer + Date/Time */}
              <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
                {/* Left cluster */}
                <div className="flex items-start justify-between md:items-center md:gap-4 min-w-0">
                  {/* Order No */}

                  {/* Avatar + Name + Date/Time */}
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image}
                        alt={item.customer}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-gray-800 text-sm sm:text-base font-medium truncate">
                          {item.customer}
                        </p>
                        <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
                          <span className="text-gray-700 truncate">
                            {item.orderDate}
                          </span>
                          <span className="hidden md:block text-gray-400">•</span>
                          <span className="text-gray-500 truncate">
                            {item.orderTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="md:hidden">
                      <p
                        className={`h-6 px-2 rounded-full inline-flex items-center justify-end text-sm font-medium
                      ${item.status === "Completed"
                            ? "bg-green-100 text-green-600"
                            : item.status === "Pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {item.status}
                      </p>
                    </div>
                </div>

                {/* Right cluster: Status + Assign */}
                <div className="flex items-center gap-4 justify-end">
                  {/* Status pill */}
                  <span
                    className={`hidden h-6 px-4 rounded-full md:inline-flex items-center justify-center  font-medium
                      ${item.status === "Completed"
                        ? "bg-green-100 text-green-600"
                        : item.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {item.status}
                  </span>

                  {/* Assign select */}
                  <select
                    aria-label={`Assign employee for order #${item.id}`}
                    className="h-6 sm:h-9 text-sm rounded-lg border border-gray-300 text-gray-700 focus:ring-2 focus:ring-gray-200 focus:outline-none px-2 bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select Employee
                    </option>
                    {/* TODO: map your employees */}
                    <option value="emp-1">John Doe</option>
                    <option value="emp-2">Jane Smith</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Divider (optional) */}
            <div className="border-t border-gray-100" />

            {/* Footer actions (optional placeholder) */}
            <div className="px-3 sm:px-4 py-2 flex items-center justify-between">
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
          </article>
        ))}
      </div>
    </div>
  );
};

export default RecentWorkOrder;