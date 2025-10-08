"use client";

import { useEffect, useState } from "react";
import { Table, Input, message, Popconfirm, Tooltip, Spin, Tag } from "antd";
import { Button } from "@/components/ui/button";
import {
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  RefreshCcw,
  Search,
  Send,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import CustomerModal from "../components/app/CustomerModal";
import InviteModal from "../components/app/InviteModal";

export default function CustomerManagement() {
  const { token } = useAuth();
  const [clientReady, setClientReady] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    addressJson: "",
    vehicleJson: { make: "", model: "", variant: "", info: "" },
    notes: "",
  });

  useEffect(() => setClientReady(true), []);

  // ─── Fetch Customers ───────────────────────────────
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setCustomers(data.customers || []);
      else message.error(data.error || "Failed to load customers");
    } catch (err) {
      console.error(err);
      message.error("Network error loading customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && clientReady) fetchCustomers();
  }, [token, search, clientReady]);

  // ─── Save or Update ───────────────────────────────
  const handleSave = async () => {
    const isEdit = !!editingCustomer;
    if (!formData.fullName || !formData.email)
      return message.warning("Full name and email are required");

    try {
      setLoading(true);
      const url = isEdit
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        message.success(isEdit ? "Customer updated!" : "Customer created!");
        setModalOpen(false);
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        message.error(data.error || "Operation failed");
      }
    } catch (err) {
      console.error("Save customer error:", err);
      message.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Customer deleted");
        fetchCustomers();
      } else {
        message.error(data.error || "Failed to delete");
      }
    } catch (err) {
      message.error("Network error");
    }
  };

  // ─── Invite ───────────────────────────────────────
  const handleInvite = async () => {
    if (!formData.fullName || !formData.email)
      return message.warning("Full name and email required");

    try {
      setLoading(true);
      const res = await fetch("/api/admin/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email: formData.email,
          fullName: formData.fullName,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success("Invite sent successfully!");
        setInviteModalOpen(false);
        fetchCustomers();
      } else {
        message.error(data.error || "Failed to send invite");
      }
    } catch {
      message.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Table Columns ────────────────────────────────
  const columns = [
    {
      title: "Customer",
      dataIndex: "fullName",
      render: (_, r) => (
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 text-blue-700 w-9 h-9 rounded-full flex items-center justify-center font-semibold">
            {r.fullName
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-800">{r.fullName}</p>
            <p className="text-xs text-gray-500">
              {r.User?.[0]?.email || "No Email"}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Vehicle",
      dataIndex: "vehicleJson",
      render: (v) =>
        v?.make ? `${v.make} ${v.model || ""} (${v.variant || ""})` : "—",
    },
    {
      title: "Address",
      dataIndex: "addressJson",
      render: (a) =>
        a && typeof a === "object" && Object.keys(a).length
          ? `${a.city || ""}, ${a.state || ""}`
          : "—",
    },
    {
      title: "Status",
      dataIndex: "User",
      render: (userArr) => {
        const active = userArr?.[0]?.isActive;
        return (
          <Tag color={active ? "green" : "red"}>
            {active ? "Active" : "Inactive"}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Edit Customer">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCustomer(record);
                setFormData({
                  fullName: record.fullName,
                  email: record.User?.[0]?.email || "",
                  addressJson: record.addressJson || "",
                  vehicleJson: record.vehicleJson || {
                    make: "",
                    model: "",
                    variant: "",
                    info: "",
                  },
                  notes: record.notes || "",
                });
                setModalOpen(true);
              }}
              className="text-blue-600 hover:bg-blue-50"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────
  if (!clientReady)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Customer Management
        </h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchCustomers}
            variant="outline"
            className="flex items-center gap-2 text-gray-600"
            disabled={loading}
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""} `}
            />{" "}
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                fullName: "",
                email: "",
                addressJson: "",
                vehicleJson: { make: "", model: "", variant: "", info: "" },
                notes: "",
              });
              setModalOpen(true);
            }}
            className="bg-blue-theme hover:bg-blue-bold !text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4 " /> Add Customer
          </Button>
          <Button
            variant="default"
            onClick={() => {
              setFormData({ fullName: "", email: "" });
              setInviteModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Invite Customer
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-5 max-w-sm">
        <Input
          prefix={<Search className="w-4 h-4 text-gray-400" />}
          placeholder="Search customers..."
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <Table
            columns={columns}
            dataSource={customers}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            className="rounded-lg"
          />
        </div>
      </Spin>

      {/* Modals */}
      <CustomerModal
        open={modalOpen}
        setOpen={setModalOpen}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        editingCustomer={editingCustomer}
        handleSave={handleSave}
      />

      <InviteModal
        open={inviteModalOpen}
        setOpen={setInviteModalOpen}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        handleInvite={handleInvite}
      />
    </div>
  );
}
