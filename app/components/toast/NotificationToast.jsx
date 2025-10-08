"use client";
import { X } from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationToast({ t, title, message, image, type }) {
  const bgColor =
    type === "success"
      ? "border-green-500"
      : type === "error"
      ? "border-red-500"
      : type === "warning"
      ? "border-amber-500"
        ? type === "order"
        : "border-blue-theme"
      : "border-blue-theme";

  return (
    <div
      className={`${
        t.visible ? "animate-custom-enter" : "animate-custom-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-4 ${bgColor}`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          {image && (
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tl from-blue-bold to-blue-theme text-white font-semibold text-sm shadow-sm">
                {"Zeeshan Khalid"
                  .split(" ")
                  .map((n) => n[0]?.toUpperCase())
                  .join("")
                  .slice(0, 2)}
              </div>
            </div>
          )}
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-gray-900 !mb-0">{title}</p>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
