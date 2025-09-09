import React from "react";

const page = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">
              New Net Income
            </div>
            <div className="text-2xl font-bold text-green-600 mt-2">£8,245.00</div>
            <div className="text-sm text-gray-500 mt-2">+0.5% from last week</div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
              </div>
              <div className="text-green-600">+0.5%</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">
              Total Bookings
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">256</div>
            <div className="text-sm text-gray-500 mt-2">+10% from last week</div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
              </div>
              <div className="text-blue-600">+10%</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">
              Work Completed
            </div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">1,256</div>
            <div className="text-sm text-gray-500 mt-2">+1.0% from last week</div>
            <div className="mt-4 flex items-center space-x-2">
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
              </div>
              <div className="text-yellow-600">+1.0%</div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-3 bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">Overall Sales</div>
            <div className="text-2xl font-bold text-green-600 mt-2">£56,345.98</div>
            <div className="text-sm text-gray-500 mt-2">+23.5% from last month</div>
            <div className="mt-4">
              <div className="h-32 bg-green-200 rounded-md"></div>
            </div>
          </div>

          <div className="col-span-1/2 bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">
              Service Report
            </div>
            <div className="flex justify-between items-center mt-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-yellow-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
              </div>
              <div className="text-gray-600 text-sm">Full Service</div>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="w-1/3 text-center text-sm text-gray-600">
                Oil Change
              </div>
              <div className="w-1/3 text-center text-sm text-gray-600">Tuning</div>
              <div className="w-1/3 text-center text-sm text-gray-600">
                Full Service
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">Recent Orders</div>
            <table className="w-full mt-4 table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">No</th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Order Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm">01</td>
                  <td className="px-4 py-2 text-sm">Shirt Creme</td>
                  <td className="px-4 py-2 text-sm">March 24, 2022 09:20 AM</td>
                  <td className="px-4 py-2 text-sm text-green-500">Completed</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm">02</td>
                  <td className="px-4 py-2 text-sm">Shirt Creme</td>
                  <td className="px-4 py-2 text-sm">March 24, 2022 09:20 AM</td>
                  <td className="px-4 py-2 text-sm text-yellow-500">Pending</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-800">
              Weekly Transaction Summary
            </div>
            <div className="mt-4">
              <div className="h-32 bg-yellow-200 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default page;
