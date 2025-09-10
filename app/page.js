import Image from "next/image";
import React from "react";
import CustomShape from "./components/CustomShape";
import Chart from "./components/Chart";
import { FaEllipsisVertical } from "react-icons/fa6";
import { FaRegCalendarAlt } from "react-icons/fa";

const page = () => {
  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <Image 
        src="/Icon (2).png" 
        alt="icon" 
        width={40} 
        height={20} 
      /> </div>
      <div>
       <h3 className="text-xl font-semibold text-gray-800 ">New Net Income</h3>
      </div>
      <div>
        <FaEllipsisVertical className="text-lg"/>
      </div>
            </div>
          <div className="flex justify-between mt-2">
            <div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                £8,245.00
              </div>
              <div className="text-sm text-gray-500 mt-2">
                +0.5% from last week
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
                  <Image
                    src="/previous.png"
                    alt="Previous Arrow"
                    width={16}
                    height={16}
                    className="w-4 h-4 sm:w-5 sm:h-5 group-hover:filter group-hover:brightness-0 group-hover:invert"
                    quality={50}
                    loading="lazy"
                  />
                </div>
                <div className="text-green-600">+0.5%</div>
              </div>
            </div>
            <div className="w-1/2 flex justify-end items-end gap-2">
              <CustomShape color="bg-black" width="w-12" height="h-20" />
              <CustomShape color="bg-black" width="w-12" height="h-20" />
              <CustomShape color="bg-green-500" width="w-12" height="h-24" />
              <CustomShape color="bg-black" width="w-12" height="h-20" />
            </div>
          </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <Image 
        src="/Icon (3).png" 
        alt="icon" 
        width={40} 
        height={20} 
      /> </div>
      <div>
       <h3 className="text-xl font-semibold text-gray-800">Total Bookings</h3>
      </div>
      <div>
        <FaEllipsisVertical className="text-lg"/>
      </div>
            </div>
          <div className="flex justify-between mt-2">
            <div className="w-1/2">
              <div className="text-2xl font-bold text-blue-600 mt-2">256</div>
              <div className="text-sm text-gray-500 mt-2">
                +10% from last week
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Image
                  src="/previous.png"
                  alt="Previous Arrow"
                  width={16}
                  height={16}
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:filter group-hover:brightness-0 group-hover:invert"
                  quality={50}
                  loading="lazy"
                />
                <div className="text-blue-600">+10%</div>
              </div>
            </div>
            <div className="w-1/2 flex justify-end items-end gap-2">
              <CustomShape color="bg-black" width="w-12" height="h-18" />
              <CustomShape color="bg-black" width="w-12" height="h-18" />
              <CustomShape color="bg-green-500" width="w-12" height="h-24" />
              <CustomShape color="bg-black" width="w-12" height="h-20" />
            </div>
          </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <Image 
        src="/Icon (4).png" 
        alt="icon" 
        width={40} 
        height={20} 
      /> </div>
      <div>
       <h3 className="text-xl font-semibold text-gray-800">New Net Income</h3>
      </div>
      <div>
        <FaEllipsisVertical className="text-lg"/>
      </div>
            </div>
          <div className="flex justify-between mt-2">
            <div className="w-1/2">
              <div className="text-2xl font-bold text-yellow-600 mt-2">
                1,256
              </div>
              <div className="text-sm text-gray-500 mt-2">
                +1.0% from last week
              </div>
              <div className="mt-4 flex items-center space-x-2">
                <Image
                  src="/previous.png"
                  alt="Previous Arrow"
                  width={16}
                  height={16}
                  className="w-4 h-4 sm:w-5 sm:h-5 group-hover:filter group-hover:brightness-0 group-hover:invert"
                  quality={50}
                  loading="lazy"
                />
                <div className="text-yellow-600">+1.0%</div>
              </div>
            </div>
            <div className="w-1/2 flex justify-end items-end gap-2">
              <CustomShape color="bg-green-500" width="w-12" height="h-24" />
              <CustomShape color="bg-black" width="w-12" height="h-18" />
              <CustomShape color="bg-black" width="w-12" height="h-20" />
              <CustomShape color="bg-black" width="w-12" height="h-18" />
            </div>
          </div>
        </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="col-span-3 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold text-gray-800">
                Overall Sales
              </div>
              <div className="flex gap-2 items-center border border-gray-300 rounded-md px-2 py-1 text-xs font-semibold text-gray-800">
                Last 7 Days <FaRegCalendarAlt />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="w-1/2 flex items-end gap-4">
                <div className="text-xl  font-bold text-green-600 mt-2">
                  £56,345.98
                </div>
                <div className="flex gap-1 items-center text-xs bg-orange-500 rounded-full px-2 py-1 text-white ">
                  + 23.5%
                </div>
              </div>
              <div className=" w-1/2 flex justify-start gap-4">
                <div className="flex items-center gap-2 text-gray-500">
                  {" "}
                  <span className="w-3 h-3 bg-yellow-primary rounded-full"></span>{" "}
                  Organic{" "}
                </div>
                <div className="flex items-center gap-2 text-gray-500 ">
                  <span className="w-3 h-3 bg-yellow-primary rounded-full"></span>{" "}
                  Proffessional{" "}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Chart/>
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
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
              <div className="w-1/3 text-center text-sm text-gray-600">
                Tuning
              </div>
              <div className="w-1/3 text-center text-sm text-gray-600">
                Full Service
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="text-lg font-semibold text-gray-600">
              Recent Orders
            </div>
            <table className="w-full mt-4 table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    No
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Order Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm text-gray-600">
                    Assign
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-600">01</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    Shirt Creme
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    March 24, 2022 <br />{" "}
                    <span className="text-sm text-gray-400">09:20 AM</span>{" "}
                  </td>
                  <td className="flex justify-center px-2 py-1 text-sm rounded-full bg-gray-100 text-green-500">
                    Completed
                  </td>
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
