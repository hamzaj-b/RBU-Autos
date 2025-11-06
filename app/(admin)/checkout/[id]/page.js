"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Spin, message } from "antd";
import { Printer, Wrench, Car, User } from "lucide-react";
import html2pdf from "html2pdf.js/dist/html2pdf.bundle.min.js";

export default function InvoicePage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [workOrder, setWorkOrder] = useState(null);
  const [error, setError] = useState("");
  const invoiceRef = useRef();

  useEffect(() => {
    if (!id || !token) return;

    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/workOrders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load invoice");
        setWorkOrder(data.workOrder || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id, token]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Spin size="large" tip="Loading Invoice..." />
      </div>
    );

  if (error || !workOrder)
    return (
      <div className="text-center py-20 text-gray-400">
        {error || "Invoice not found."}
      </div>
    );

  const { raw } = workOrder;
  const customer = raw?.customer;

  // 💰 Compute Subtotal, Tax, and Grand Total
  const partsTotal =
    raw.partsUsed?.reduce(
      (sum, p) => sum + (Number(p.price) || 0) * (Number(p.qty) || 1),
      0
    ) || 0;

  const laborTotal =
    raw.laborEntries?.reduce(
      (sum, l) => sum + (Number(l.rate) || 0) * (Number(l.hours) || 1),
      0
    ) || 0;

  const subTotal = partsTotal + laborTotal;
  const taxRate = raw.taxRate || 0;
  const taxAmount = raw.taxAmount || 0;
  const total = raw.totalRevenue || subTotal + taxAmount;
  const issueDate = new Date(
    raw.closedAt || raw.createdAt
  ).toLocaleDateString();

  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      message.error("Invoice content not found.");
      return;
    }

    try {
      setPdfLoading(true);
      const element = invoiceRef.current;

      const opt = {
        margin: [10, 10, 20, 10],
        filename: `Invoice-${raw.id.slice(-6).toUpperCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      await html2pdf().set(opt).from(element).save();
      message.success("Invoice downloaded successfully!");
    } catch (err) {
      console.error("PDF generation error:", err);
      message.error("Failed to generate PDF. Check console for details.");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center print:bg-white print:p-0">
      <div
        ref={invoiceRef}
        className="max-w-4xl w-full bg-white shadow-lg rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:border-none"
      >
        {/* HEADER */}
        <div className="bg-gradient-to-l from-[#2A7BAE] to-sky-900 text-white p-8 flex justify-between items-start print:bg-white print:text-white print:border-b print:border-gray-300">
          <div>
            <h1 className="text-2xl font-bold print:text-white">
              RBU Autos Garage
            </h1>
            <p className="text-sm text-blue-100 print:text-gray-100">
              Professional Auto Repair & Service
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80 print:text-gray-100">Invoice</p>
            <h2 className="text-xl font-semibold mt-1 print:text-white">
              #{raw.id.slice(-6).toUpperCase()}
            </h2>
          </div>
        </div>

        {/* CUSTOMER / VEHICLE */}
        <div className="p-8 grid md:grid-cols-2 gap-6 border-b border-gray-200 print:border-gray-300">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-[#2A7BAE]" /> Customer
            </h3>
            <p className="text-gray-700 font-medium">{customer?.fullName}</p>
            <p className="text-sm text-gray-500 mt-1">
              {customer?.addressJson?.raw || "No address provided"}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#2A7BAE]" /> Vehicle
            </h3>
            {raw?.vehicleJson ? (
              <div className="text-gray-700 font-medium">
                {raw.vehicleJson.make} {raw.vehicleJson.model} •{" "}
                {raw.vehicleJson.variant} ({raw.vehicleJson.year})
                <br />
                <span className="text-gray-500 text-sm">
                  VIN#: {raw.vehicleJson.vin}
                </span>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No vehicle details</p>
            )}
          </div>
        </div>

        {/* SERVICES / PARTS / LABOR */}
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#2A7BAE]" /> Services Performed
          </h3>
          <table className="w-full border border-gray-200 text-sm rounded-lg overflow-hidden print:border-gray-300">
            <thead className="bg-gray-50 text-gray-600 text-left print:bg-gray-100">
              <tr>
                <th className="py-2 px-4">Description</th>
                <th className="py-2 px-4">Details</th>
                <th className="py-2 px-4 text-right">Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              {raw.partsUsed?.length > 0 && (
                <>
                  <tr className="bg-gray-100 print:bg-gray-200">
                    <td
                      colSpan={3}
                      className="font-semibold text-gray-700 py-2 px-4"
                    >
                      Parts
                    </td>
                  </tr>
                  {raw.partsUsed.map((p, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 print:border-gray-300"
                    >
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
                  <tr className="bg-gray-100 print:bg-gray-200">
                    <td
                      colSpan={3}
                      className="font-semibold text-gray-700 py-2 px-4"
                    >
                      Labor
                    </td>
                  </tr>
                  {raw.laborEntries.map((l, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 print:border-gray-300"
                    >
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

          {/* 🧾 TOTALS */}
          <div className="mt-8 flex justify-end break-before-avoid">
            <div className="bg-gray-50 p-4 rounded-lg border text-right w-72 print:bg-transparent print:border-gray-300">
              <div className="text-gray-700 font-medium flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>${subTotal.toFixed(2)}</span>
              </div>

              <div className="text-gray-700 font-medium flex justify-between mb-1">
                <span>Tax ({taxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-300 my-2" />

              <div className="text-gray-800 font-semibold flex justify-between text-lg">
                <span>Grand Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="text-xs text-gray-500 mt-1">
                Issued on {issueDate}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t p-6 bg-gray-50 flex flex-wrap items-center justify-between print:bg-transparent print:border-none">
          <p className="text-gray-500 text-sm print:hidden">
            Thank you for choosing RBU Autos Garage!
          </p>

          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-[#2A7BAE] !text-white px-4 py-2 rounded-md hover:bg-[#246b97] transition"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* PRINT FOOTER */}
        <div className="hidden print:flex justify-center items-end h-24 text-gray-600 text-sm">
          Thank you for choosing RBU Autos Garage!
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          table,
          tr,
          td,
          th {
            page-break-inside: avoid !important;
          }
          .break-inside-avoid {
            page-break-inside: avoid !important;
          }
          .break-before-avoid {
            page-break-before: avoid !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:flex {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
