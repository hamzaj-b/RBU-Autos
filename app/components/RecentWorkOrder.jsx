import React from 'react';

const RecentWorkOrder = ({ data, containerWidth = 'w-full', heading = 'Recent Work Order' }) => {
  return (
    <div className={`${containerWidth} p-4 sm:p-5 bg-white rounded-[18px] shadow-sm ring-1 ring-gray-200/70`}>
      <h2 className="text-lg sm:text-[22px] px-3 sm:px-4 py-2 sm:py-3 text-gray-500 font-semibold mb-2 sm:mb-4">{heading}</h2>
      <div className="overflow-x-auto">
        <div className="min-w-[600px] grid grid-cols-5 gap-2 sm:gap-4 bg-gray-200 rounded-2xl py-2 sm:py-3 px-2 sm:px-4 mx-1 sm:mx-2 mb-1 sm:mb-2 font-medium text-sm sm:text-base text-gray-600">
          <span className="min-w-[60px]">No</span>
          <span className="min-w-[120px]">Customer</span>
          <span className="min-w-[100px]">Order Date</span>
          <span className="min-w-[100px]">Status</span>
          <span className="min-w-[120px]">Assign</span>
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="min-w-[600px] flex items-center justify-between py-1 sm:py-2 border-b border-gray-200"
          >
            <div className="min-w-[60px] pl-3 sm:pl-4">
              <p className="text-gray-600 text-base sm:text-lg">{item.id}</p>
            </div>
            <div className="min-w-[120px] h-auto flex items-center">
              <p className="flex items-center gap-1 sm:gap-2 text-gray-500 text-sm sm:text-[15px]">
                <img src={item.image} width={24} className="sm:w-[40px]" alt="" />
                {item.customer}
              </p>
            </div>
            <div className="min-w-[100px]">
              <p className="flex flex-col justify-start text-gray-600 text-sm sm:text-[15px]">
                {item.orderDate}
                <span className="text-gray-600">{item.orderTime}</span>
              </p>
            </div>
            <div className="min-w-[100px]">
              <p
                className={`w-20 sm:w-24 h-5 sm:h-6 rounded-full flex items-center justify-center text-sm sm:text-[15px] ${
                  item.status === 'Completed'
                    ? 'bg-green-100 text-[#2f9d56]'
                    : 'bg-yellow-100 text-[#9AA20C]'
                }`}
              >
                {item.status}
              </p>
            </div>
            <div className="min-w-[120px]">
              <input
                type="text"
                placeholder="Select Employee"
                className="w-24 sm:w-28 h-6 sm:h-7 text-center text-sm sm:text-[15px] rounded-lg border border-gray-300 text-gray-600 focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentWorkOrder;