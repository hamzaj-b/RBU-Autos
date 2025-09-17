import React from "react";

const RecentWorkOrder = ({
  data,
  containerWidth = "w-full",
  heading = "Recent Work Order",
}) => {
  return (
    <div className={`${containerWidth} `}>
      <h2 className="text-lg sm:text-[22px] px-3 sm:px-4 py-2 sm:py-3 text-gray-500 font-semibold mb-2 sm:mb-4">
        {heading}
      </h2>

      <div className="overflow-x-auto">
        {/* Header Row */}
        <div className="min-w-[600px] grid grid-cols-5 gap-2 sm:gap-4 bg-gray-200 rounded-2xl py-2 sm:py-3 px-2 sm:px-4 mx-1 sm:mx-2 mb-1 sm:mb-2 font-medium text-sm sm:text-base text-gray-600">
          <span>No</span>
          <span>Customer</span>
          <span>Order Date</span>
          <span>Status</span>
          <span>Assign</span>
        </div>

        {/* Data Rows */}
        {data.map((item) => (
          <div
            key={item.id}
            className="min-w-[600px] grid grid-cols-5 gap-2 sm:gap-4 items-center py-2 px-2 sm:px-4 mx-1 sm:mx-2 border-b border-gray-200"
          >
            {/* ID */}
            <p className="text-gray-600 text-sm sm:text-base">{item.id}</p>

            {/* Customer */}
            <div className="flex items-center gap-2">
              <img
                src={item.image}
                alt=""
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full"
              />
              <span className="text-gray-600 text-sm sm:text-base">
                {item.customer}
              </span>
            </div>

            {/* Order Date + Time */}
            <div className="flex flex-col">
              <span className="text-gray-600 text-sm sm:text-base">
                {item.orderDate}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm">
                {item.orderTime}
              </span>
            </div>

            {/* Status */}
            <p
              className={`w-20 sm:w-24 h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                item.status === "Completed"
                  ? "bg-green-100 text-green-600"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {item.status}
            </p>

            {/* Assign Input */}
            <input
              type="text"
              placeholder="Select Employee"
              className="w-28 h-7 text-sm rounded-lg border border-gray-300 text-gray-600 focus:border-gray-400 focus:outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentWorkOrder;
