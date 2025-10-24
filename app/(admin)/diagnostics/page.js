"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { DatePicker, Select, Spin, Table, message, Empty } from "antd";
import { FileBarChart2, RefreshCw, Download, XCircle } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ReportsPage() {
  const { token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [dateRange, setDateRange] = useState([]);

  // ✅ Compute all totals (includes Completed Revenue)
  const totals = useMemo(() => {
    const totalOrders = report.length;
    const totalRevenue = report.reduce(
      (sum, r) => sum + (r.totalRevenue || 0),
      0
    );
    const completedOrders = report.filter((r) => r.status === "COMPLETED");
    const completedCount = completedOrders.length;
    const completedRevenue = completedOrders.reduce(
      (sum, r) => sum + (r.totalRevenue || 0),
      0
    );
    const inProgress = report.filter((r) => r.status === "IN_PROGRESS").length;

    return {
      totalOrders,
      totalRevenue,
      completedCount,
      completedRevenue,
      inProgress,
    };
  }, [report]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [custRes, servRes] = await Promise.all([
          fetch("/api/customers", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/services", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const [custData, servData] = await Promise.all([
          custRes.json(),
          servRes.json(),
        ]);

        setCustomers(custData?.customers || custData?.data || []);
        setServices(servData?.services || servData?.data || []);
      } catch (err) {
        console.error("Filter fetch error:", err);
        message.error("Failed to load filters");
      }
    })();
  }, [token]);

  const fetchReport = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCustomer) params.append("customerId", selectedCustomer);
      selectedServices.forEach((s) => params.append("serviceIds", s));
      if (dateRange?.length === 2) {
        params.append("dateFrom", dayjs(dateRange[0]).format("YYYY-MM-DD"));
        params.append("dateTo", dayjs(dateRange[1]).format("YYYY-MM-DD"));
      }

      const res = await fetch(`/api/report?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load report");
      setReport(Array.isArray(data.report) ? data.report : []);
    } catch (err) {
      message.error(err.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [token, selectedCustomer, selectedServices, dateRange]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const formatMaybeDate = (val) =>
    val ? dayjs(val).format("YYYY-MM-DD HH:mm") : "—";

  const safeCsv = (s) => {
    const str = String(s || "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };


  const resetFilters = () => {
    setSelectedCustomer(null);
    setSelectedServices([]);
    setDateRange([]);
  };

  // --- TABLE COLUMNS with data-labels for mobile ---
  const columns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      render: (v) => v || "—",
      onCell: () => ({ "data-label": "Customer" }),
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      render: (v) => v || "—",
      onCell: () => ({ "data-label": "Employee" }),
    },
    {
      title: "Services",
      dataIndex: "services",
      render: (v) => v || "—",
      onCell: () => ({ "data-label": "Services" }),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const colorMap = {
          COMPLETED: "bg-emerald-100 text-emerald-700",
          DONE: "bg-blue-100 text-blue-700",
          IN_PROGRESS: "bg-indigo-100 text-indigo-700",
          CANCELLED: "bg-rose-100 text-rose-700",
          OPEN: "bg-gray-100 text-gray-700",
          ASSIGNED: "bg-amber-100 text-amber-700",
        };
        return (
          <span
            className={`font-semibold px-2 py-1 rounded-md text-xs ${
              colorMap[status] || "bg-gray-100 text-gray-700"
            }`}
          >
            {status}
          </span>
        );
      },
      onCell: () => ({ "data-label": "Status" }),
    },
    {
      title: "Total Revenue ($)",
      dataIndex: "totalRevenue",
      render: (amt) => (
        <span className="font-semibold text-blue-700">
          ${Number(amt || 0).toFixed(2)}
        </span>
      ),
      onCell: () => ({ "data-label": "Total Revenue ($)" }),
    },
    {
      title: "Opened At",
      dataIndex: "openedAt",
      render: (date) => formatMaybeDate(date),
      onCell: () => ({ "data-label": "Opened At" }),
    },
    {
      title: "Closed At",
      dataIndex: "closedAt",
      render: (date) => formatMaybeDate(date),
      onCell: () => ({ "data-label": "Closed At" }),
    },
  ];

  if (!mounted)
    return (
      <div className="p-6 bg-gray-50 min-h-screen grid place-items-center">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen overflow-hidden text-gray-800">
      {/* Responsive Table Styles */}
      <style jsx global>{`
        @media (max-width: 640px) {
          .ant-table-thead {
            display: none !important;
          }

          .ant-table-tbody > tr {
            display: flex !important;
            flex-direction: column !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.75rem !important;
            margin-bottom: 1rem !important;
            background: #fff !important;
            padding: 0.9rem 1rem !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          }

          /* Each cell = one row (label + value side-by-side) */
          .ant-table-tbody > tr > td {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            border: none !important;
            padding: 0.45rem 0 !important;
            border-bottom: 1px dashed #e5e7eb;
            font-size: 0.9rem !important;
          }

          /* Remove bottom border from last row */
          .ant-table-tbody > tr > td:last-child {
            border-bottom: none !important;
          }

          /* Label styling */
          .ant-table-tbody > tr > td::before {
            content: attr(data-label);
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
            flex: 1;
            text-align: left;
            margin-right: 1rem;
          }

          /* Value styling */
          .ant-table-tbody > tr > td span,
          .ant-table-tbody > tr > td div {
            color: #111827;
            font-weight: 500;
            flex: 1;
            text-align: right;
            word-break: break-word;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <FileBarChart2 className="text-blue-700" size={26} />
          Work Order Reports
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-4 bg-white border rounded-xl text-center md:text-left">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{totals.totalOrders}</p>
        </div>
        <div className="p-4 bg-white border rounded-xl text-center md:text-left">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-700">
            ${totals.totalRevenue.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl text-center md:text-left">
          <p className="text-sm text-gray-500">Completed Orders</p>
          <p className="text-2xl font-bold text-emerald-600">
            {totals.completedCount}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl text-center md:text-left">
          <p className="text-sm text-gray-500">Completed Revenue</p>
          <p className="text-2xl font-bold text-emerald-700">
            ${totals.completedRevenue.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl text-center md:text-left">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-indigo-600">
            {totals.inProgress}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Select
          placeholder="Select Customer"
          allowClear
          value={selectedCustomer || undefined}
          onChange={(val) => setSelectedCustomer(val || null)}
          className="w-full"
          showSearch
          optionFilterProp="children"
        >
          {customers.map((c) => (
            <Option key={c.id} value={c.id}>
              {c.fullName}
            </Option>
          ))}
        </Select>

        <Select
          placeholder="Select Services"
          mode="multiple"
          allowClear
          onChange={(vals) => setSelectedServices(vals)}
          value={selectedServices}
          className="w-full"
          showSearch
          maxTagCount="responsive"
        >
          {services.map((s) => (
            <Option key={s.id} value={s.id}>
              {s.name}
            </Option>
          ))}
        </Select>

        <RangePicker
          className="w-full"
          value={dateRange}
          onChange={(vals) => setDateRange(vals || [])}
          format="YYYY-MM-DD"
          allowClear
        />

        <Button
          onClick={fetchReport}
          disabled={loading}
          className="bg-blue-theme hover:bg-blue-bold !text-white w-full"
        >
          Apply Filters
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            resetFilters();
            setTimeout(fetchReport, 0);
          }}
          className="flex items-center justify-center gap-2 w-full"
        >
          <XCircle className="w-4 h-4" /> Reset
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-2 sm:p-4 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spin size="large" />
          </div>
        ) : report.length === 0 ? (
          <div className="py-12">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No work orders match your filters"
            />
          </div>
        ) : (
          <Table
            dataSource={report}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: true }}
          />
        )}
      </div>
    </div>
  );
}
