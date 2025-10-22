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

  const [mounted, setMounted] = useState(false); // Prevent SSR hydration issues
  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [dateRange, setDateRange] = useState([]);

  // 🧮 Compute summary
  const totals = useMemo(() => {
    const totalOrders = report.length;
    const totalRevenue = report.reduce(
      (sum, r) => sum + (r.totalRevenue || 0),
      0
    );
    const completed = report.filter((r) => r.status === "COMPLETED").length;
    const inProgress = report.filter((r) => r.status === "IN_PROGRESS").length;
    return { totalOrders, totalRevenue, completed, inProgress };
  }, [report]);

  // 🚫 SSR style mismatch guard
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🧩 Fetch Filters (customers & services)
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

        const cs = Array.isArray(custData?.customers)
          ? custData.customers
          : Array.isArray(custData?.data)
          ? custData.data
          : [];

        const ss = Array.isArray(servData?.services)
          ? servData.services
          : Array.isArray(servData?.data)
          ? servData.data
          : [];

        setCustomers(cs);
        setServices(ss);
      } catch (err) {
        console.error("Filter fetch error:", err);
        message.error("Failed to load filters");
      }
    })();
  }, [token]);

  // 🧾 Fetch Report Data
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

  // Load on page mount
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // 📅 Safe date formatter
  const formatMaybeDate = (val) => {
    if (!val) return "—";
    const d = dayjs(val);
    return d.isValid() ? d.format("YYYY-MM-DD HH:mm") : "—";
  };

  // 📤 Export CSV
  const exportCsv = () => {
    const header = [
      "Customer",
      "Employee",
      "Services",
      "Status",
      "Total Revenue",
      "Opened At",
      "Closed At",
    ].join(",");

    const body = report
      .map((r) =>
        [
          safeCsv(r.customerName),
          safeCsv(r.employeeName),
          safeCsv(r.services),
          safeCsv(r.status),
          r.totalRevenue || 0,
          formatMaybeDate(r.openedAt),
          formatMaybeDate(r.closedAt),
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([`${header}\n${body}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "work_orders_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const safeCsv = (s) => {
    const str = String(s || "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // ♻️ Reset Filters
  const resetFilters = () => {
    setSelectedCustomer(null);
    setSelectedServices([]);
    setDateRange([]);
  };

  // 📊 Table Columns
  const columns = [
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name) => (
        <span className="font-medium text-gray-800">{name || "—"}</span>
      ),
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (v) => v || "—",
    },
    {
      title: "Services",
      dataIndex: "services",
      key: "services",
      render: (val) => (
        <span className="text-sm text-gray-600">{val || "—"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const colorMap = {
          COMPLETED: "text-emerald-600",
          DONE: "text-blue-600",
          IN_PROGRESS: "text-indigo-600",
          CANCELLED: "text-rose-600",
          OPEN: "text-gray-600",
          ASSIGNED: "text-amber-600",
        };
        return (
          <span
            className={`font-semibold ${colorMap[status] || "text-gray-600"}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      title: "Total Revenue ($)",
      dataIndex: "totalRevenue",
      key: "totalRevenue",
      render: (amt) => (
        <span className="font-semibold text-blue-700">
          ${Number(amt || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Opened At",
      dataIndex: "openedAt",
      key: "openedAt",
      render: (date) => formatMaybeDate(date),
    },
    {
      title: "Closed At",
      dataIndex: "closedAt",
      key: "closedAt",
      render: (date) => formatMaybeDate(date),
    },
  ];

  // 🧱 Mount guard for AntD hydration
  if (!mounted) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen grid place-items-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FileBarChart2 className="text-blue-700" size={28} />
          Work Order Reports
        </h1>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportCsv}
            className="flex items-center gap-2 px-4"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={fetchReport}
            disabled={loading}
            className="flex items-center gap-2 px-4"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Orders</div>
          <div className="text-2xl font-bold text-gray-800">
            {totals.totalOrders}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Revenue</div>
          <div className="text-2xl font-extrabold text-blue-700">
            ${totals.totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">
            {totals.completed}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-indigo-600">
            {totals.inProgress}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <Select
          placeholder="Select Customer"
          allowClear
          onChange={(val) => setSelectedCustomer(val || null)}
          value={selectedCustomer || undefined}
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
          optionFilterProp="children"
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
          className="bg-blue-theme hover:bg-blue-bold !text-white"
        >
          Apply Filters
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            resetFilters();
            setTimeout(fetchReport, 0);
          }}
          className="flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
          />
        )}
      </div>
    </div>
  );
}
