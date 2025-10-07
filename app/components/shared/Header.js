"use client";

import { useAuth } from "@/app/context/AuthContext";
import { Bell, Mail, Search } from "lucide-react";
import Link from "next/link";

export default function Header({ toggleSidebar, className = "" }) {
    const { user, token, logout, loading } = useAuth();
  
    console.log("user token:", token);
   console.log ("header user" , user);
  
  return (
    <div className={`w-full bg-white flex items-center px-4 md:px-6 py-4 ${className}`}>
      <div>
      <button
            className="md:hidden text-black rounded"
            onClick={toggleSidebar}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
      </div>
      <div className="hidden md:block md:flex-1">
        <h2 className="text-xl font-semibold text-gray-800">Hi, User</h2>
        <p className="text-sm text-gray-500">Let's check your Garage today</p>
      </div>
      {/* <div className="hidden md:block md:flex-1">
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-10 py-2 bg-gray-100 text-gray-800 rounded-md focus:outline-none focus:border focus:border-gray-300"
          />
          <span className="absolute left-3 top-2 text-gray-500">
            <Search />
          </span>
          <span className="absolute right-3 top-2 text-gray-500">⌘K</span>
        </div>
      </div> */}
      <div className="flex-1 flex items-center space-x-4 justify-end">
        {/* <button className="relative text-gray-600 hover:text-gray-800">
          <span className="text-xl">
            <Mail />
          </span>
          <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-[-6px]"></span>
        </button> */}
        <button className="relative text-gray-600 hover:text-gray-800">
          <span className="text-xl">
            <Bell />
          </span>
          <span className="absolute w-2 h-2 bg-red-500 rounded-full top-1 right-[-6px]"></span>
        </button>
        <div className="flex items-center space-x-2 ml-4">
          {/* <Link href="/auth/login">
            <img
              src="/profile.png"
              alt="Profile"
              className="w-10 h-10 rounded-full"
            />
          </Link> */}
            <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm">
                      {user?.userType
                        .split(" ")
                        .map((n) => n[0]?.toUpperCase())
                        .join("")
                        .slice(0, 2)}
                    </div>
          {/* <div className="hidden md:flex flex-col">
            <p className="text-sm font-medium text-gray-800">alice</p>
            <p className="text-xs text-gray-500">Owner</p>
          </div> */}
        </div>
      </div>
    </div>
  );
}