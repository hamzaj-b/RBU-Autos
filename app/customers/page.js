"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreVertical,
  Search,
  SlidersHorizontal,
  FileDownIcon,
} from "lucide-react";

const Home = () => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: "Devon Lane",
      email: "chieko@mail.com",
      orders: 125,
      sales: 101345.0,
      spent: 101345.0,
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    },
    {
      id: 2,
      name: "Kathryn Murphy",
      email: "rohan_anna@mail.com",
      orders: 11,
      sales: 2400.98,
      spent: 2400.98,
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    // Add more customers...
  ]);

  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [selectedCustomers, setSelectedCustomers] = useState([]);

  // Filter and sort customers
  useEffect(() => {
    let filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered = filtered.sort((a, b) => {
      let valA = a[sortBy],
        valB = b[sortBy];
      if (sortOrder === "desc") [valA, valB] = [valB, valA];
      return valA > valB ? 1 : valA < valB ? -1 : 0;
    });

    setFilteredCustomers(filtered);
  }, [searchTerm, customers, sortBy, sortOrder]);

  // Pagination logic
  const paginate = (page) => setCurrentPage(page);
  const currentCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  // Handle sort
  const handleSort = (column) => {
    setSortBy(column);
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle result per page
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing results per page
  };

  // Handle selection of individual customer checkboxes
  const handleCheckboxChange = (customerId) => {
    if (selectedCustomers.includes(customerId)) {
      setSelectedCustomers(selectedCustomers.filter((id) => id !== customerId));
    } else {
      setSelectedCustomers([...selectedCustomers, customerId]);
    }
  };

  // Handle master checkbox for selecting all customers
  const handleMasterCheckboxChange = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]); // Deselect all
    } else {
      setSelectedCustomers(filteredCustomers.map((customer) => customer.id)); // Select all
    }
  };

  return (
    <div className="container min-h-screen mx-auto text-black p-6">
      <div className=" mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <select className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Show: All Orders</option>
            <option>Active Customers</option>
            <option>Inactive Customers</option>
          </select>

          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 bg-white text-gray-500 rounded-md px-4 py-2 text-sm">
              <Plus className="w-5 h-5" />
              <span>Add Customer</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white text-gray-500 rounded-md px-4 py-2 text-sm"
            >
              <FileDownIcon className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg mb-4">
        <div className="flex space-x-4 mb-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search vehicle"
              className="w-full px-14 py-2 md:py-4 rounded-lg bg-gray-100 text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className=" absolute left-3 top-2 md:top-4 text-gray-500">
              <Search />{" "}
            </span>
          </div>
          <button className=" md:py-2 px-2 md:px-4 rounded-lg bg-gray-100 flex items-center text-gray-500">
            <SlidersHorizontal />
            <span className="hidden md:block">Filters</span>
          </button>
        </div>

        {/* Filters Dropdown */}
        {showFilters && (
          <div className="bg-gray-50 p-4 rounded-md shadow-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm">Status</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Pending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Order Count</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>All</option>
                  <option>0-10</option>
                  <option>11-50</option>
                  <option>51-100</option>
                </select>
              </div>
              <div>
                <label className="block text-sm">Spent Amount</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option>All Amounts</option>
                  <option>$0-$100</option>
                  <option>$100-$500</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedCustomers.length === filteredCustomers.length
                      }
                      onChange={handleMasterCheckboxChange}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Customer{" "}
                    {sortBy === "name" && (
                      <ArrowUpDown className="w-4 h-4 inline" />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Email{" "}
                    {sortBy === "email" && (
                      <ArrowUpDown className="w-4 h-4 inline" />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("orders")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Orders{" "}
                    {sortBy === "orders" && (
                      <ArrowUpDown className="w-4 h-4 inline" />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("sales")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Sales{" "}
                    {sortBy === "sales" && (
                      <ArrowUpDown className="w-4 h-4 inline" />
                    )}
                  </th>
                  <th
                    onClick={() => handleSort("spent")}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    Spent{" "}
                    {sortBy === "spent" && (
                      <ArrowUpDown className="w-4 h-4 inline" />
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleCheckboxChange(customer.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.sales}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.spent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Show results:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>6</option>
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChevronLeft className="text-gray-500" />
            </button>

            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === index + 1
                    ? "bg-darkBlue text-white"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <ChevronRight className="text-gray-500" />
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
