import React from 'react'

const RecentWorkOrder = () => {
    const dummyData = [
        {
          id: "01",
          customer: "Shirt Creme",
          image: "/user1.png",
          orderDate: "March 24, 2022",
          orderTime: "09:20 AM",
          status: "Completed",
        },
        {
          id: "02",
          customer: "Shirt Creme",
          image: "/user1.png",
          orderDate: "March 24, 2022",
          orderTime: "09:20 AM",
          status: "Pending",
        },
        {
          id: "03",
          customer: "#A4064B",
          image: "/user1.png",
          orderDate: "March 24, 2022",
          orderTime: "09:20 AM",
          status: "Pending",
        },
      ];
  return (
    <div>
        <div className="bg-white rounded-lg">
        <h2 className="text-lg p-4 text-gray-500 font-semibold mb-4">
          Recent Work Order
        </h2>
        <div className="grid grid-cols-5 gap-8 bg-gray-200 rounded-2xl py-4 px-4 mx-2 font-medium text-gray-600 mb-2">
          <span>No</span>
          <span>Customer</span>
          <span>Order Date</span>
          <span>Status</span>
          <span>Assign</span>
        </div>
        {dummyData.map((item) => (
          <div
            key={item.id}
            className="flex items-center  gap-8 py-2 mx-6 border-b border-gray-200"
          >
            <div className="w-10 ">
            <p className=" text-gray-600 text-lg">{item.id}</p>
            </div>
           <div className=' w-40 h-auto mx-2 flex justify-start pl-6'>
           <p className="flex items-center gap-2 text-gray-500 text-sm">
              <img src={item.image} width={50} alt="" />
              {item.customer}
            </p>
            </div> 
            <p className="flex flex-col justify-center text-gray-600 text-sm">
              {item.orderDate}
              <span className="text-gray-600">{item.orderTime}</span>
            </p>
            <p
              className={`w-28 h-6  rounded-full items-center justify-center flex text-sm ${
                item.status === "Completed"
                  ? "bg-green-100 text-yellow-bold"
                  : "bg-yellow-100 text-yellow-600"
              }`}
            >
              {item.status}
            </p>
            <input
              type="text"
              placeholder="Select Employee"
              className="w-32 h-8 text-center text-sm rounded-lg border border-gray-300 text-gray-600"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentWorkOrder