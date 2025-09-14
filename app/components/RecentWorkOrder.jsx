import React from 'react';

const RecentWorkOrder = ({ data, containerWidth = 'w-full', heading = 'Recent Work Order' }) => {
  return (
    <div className={`${containerWidth}`}>
      <div className="bg-white rounded-lg">
        <h2 className="text-lg p-4 text-gray-500 font-semibold mb-4">{heading}</h2>
        <div className="grid grid-cols-5 gap-8 bg-gray-200 rounded-2xl py-4 px-4 mx-2 font-medium text-gray-600 mb-2">
          <span>No</span>
          <span>Customer</span>
          <span>Order Date</span>
          <span>Status</span>
          <span>Assign</span>
        </div>
        {data.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-start py-2 border-b border-gray-200"
          >
            <div className="w-1/6 pl-6">
              <p className="text-gray-600 text-lg">{item.id}</p>
            </div>
            <div className="w-1/4 h-auto flex justify-start">
              <p className="flex items-center gap-2 text-gray-500 text-sm">
                <img src={item.image} width={50} alt="" />
                {item.customer}
              </p>
            </div>
            <div className="w-1/5">
              <p className="flex flex-col justify-start text-gray-600 text-sm">
                {item.orderDate}
                <span className="text-gray-600">{item.orderTime}</span>
              </p>
            </div>
            <div className="w-1/5">
              <p
                className={`w-28 h-6 rounded-full items-center justify-center flex text-sm ${
                  item.status === 'Completed'
                    ? 'bg-green-100 text-yellow-bold'
                    : 'bg-yellow-100 text-yellow-600'
                }`}
              >
                {item.status}
              </p>
            </div>
            <div className="w-1/5">
              <input
                type="text"
                placeholder="Select Employee"
                className="w-32 h-8 text-center text-sm rounded-lg border border-gray-300 text-gray-600 focus:border-gray-400 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentWorkOrder;