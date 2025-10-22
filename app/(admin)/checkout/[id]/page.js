"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Spin, message } from "antd";
import {
  FileText,
  Printer,
  Download,
  Wrench,
  DollarSign,
  Car,
  User,
  Clock,
} from "lucide-react";

export default function InvoicePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);

  useEffect(() => {
    if (!id || !token) return;

    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/workOrders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        setWorkOrder(data.workOrder || data);
      } catch (err) {
        message.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, token]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );

  if (!workOrder)
    return (
      <div className="text-center py-20 text-gray-400">
        Error loading invoice or invoice not found.
      </div>
    );

  const { raw } = workOrder;
  const customer = raw?.customer;
  const booking = raw?.booking;
  const total =
    raw.totalRevenue ||
    raw.workOrderServices?.reduce(
      (sum, s) => sum + (s.service?.basePrice || 0),
      0
    ) ||
    0;

  const issueDate = new Date(
    raw.closedAt || raw.createdAt
  ).toLocaleDateString();

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    message.info("PDF generation coming soon!");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center">
      <div className="max-w-4xl w-full bg-white shadow-lg rounded-2xl overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0f74b2] via-sky-800 to-blue-900 text-white p-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">RBU Autos Garage</h1>
            <p className="text-sm text-blue-100">
              Professional Auto Repair & Service
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Invoice</p>
            <h2 className="text-xl font-semibold mt-1">
              #{raw.id.slice(-6).toUpperCase()}
            </h2>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="p-8 grid md:grid-cols-2 gap-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Customer
            </h3>
            <p className="text-gray-700 font-medium">{customer?.fullName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {customer?.addressJson?.raw || "No address provided"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Car className="w-4 h-4 text-blue-500" /> Vehicle
            </h3>
            {customer?.vehicleJson ? (
              <div className="text-gray-700 font-medium">
                {customer.vehicleJson.make} {customer.vehicleJson.model} (
                {customer.vehicleJson.year}) <br />
                <span className="text-gray-500 text-sm">
                  Reg#: {customer.vehicleJson.regNo}
                </span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No vehicle details</p>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-500" /> Services Performed
          </h3>
          <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="py-2 px-4">Description</th>
                <th className="py-2 px-4">Category</th>
                <th className="py-2 px-4 text-right">Price ($)</th>
              </tr>
            </thead>
            <tbody>
              {raw.workOrderServices?.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2 px-4">{s.service.name}</td>
                  <td className="py-2 px-4 text-gray-500">
                    {s.service.category}
                  </td>
                  <td className="py-2 px-4 text-right font-medium">
                    {s.service.basePrice}
                  </td>
                </tr>
              ))}
              {raw.partsUsed?.length > 0 && (
                <>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={3}
                      className="font-semibold text-gray-700 py-2 px-4"
                    >
                      Additional Parts
                    </td>
                  </tr>
                  {raw.partsUsed.map((p, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-4">{p.name}</td>
                      <td className="py-2 px-4 text-gray-500">
                        {p.qty} × ${p.price}
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        ${(Number(p.qty) * Number(p.price)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {raw.laborEntries?.length > 0 && (
                <>
                  <tr className="bg-gray-100">
                    <td
                      colSpan={3}
                      className="font-semibold text-gray-700 py-2 px-4"
                    >
                      Labor Entries
                    </td>
                  </tr>
                  {raw.laborEntries.map((l, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-4">{l.task}</td>
                      <td className="py-2 px-4 text-gray-500">
                        {l.hours} hr × ${l.rate}
                      </td>
                      <td className="py-2 px-4 text-right font-medium">
                        ${(Number(l.hours) * Number(l.rate)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="bg-gray-50 p-4 rounded-lg border text-right w-64">
              <div className="text-gray-700 font-medium mb-1">GrandTotal</div>
              <div className="text-lg font-semibold text-gray-800">
                ${total.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Issued on {issueDate}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 bg-gray-50 flex flex-wrap items-center justify-between">
          <p className="text-gray-500 text-sm">
            Thank you for choosing RBU Autos Garage!
          </p>

          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-blue-theme !text-white px-4 py-2 rounded-md hover:bg-blue-bold transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            {/* <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );
}
