"use client";
import { Table, Tooltip, Popconfirm, Tag } from "antd";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import React from "react";

export default function CustomerTable({
  customers,
  loading,
  setModalOpen,
  setEditingCustomer,
  setFormData,
  fetchCustomers,
  token,
}) {
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
      } else message.error(data.error || "Failed to delete");
    } catch {
      message.error("Network error");
    }
  };

  const columns = [
    {
      title: "Name",
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
      title: "Address",
      render: (r) =>
        r.addressJson?.city
          ? `${r.addressJson.city}, ${r.addressJson.state}`
          : "—",
    },
    {
      title: "Vehicle",
      render: (r) =>
        r.vehicleJson?.make
          ? `${r.vehicleJson.make} ${r.vehicleJson.model}`
          : "—",
    },
    {
      title: "Status",
      render: (r) => {
        const active = r.User?.[0]?.isActive;
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
          <Tooltip title="Edit">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCustomer(record);
                setFormData({
                  fullName: record.fullName,
                  email: record.User?.[0]?.email || "",
                  addressJson: record.addressJson || "",
                  vehicleJson: record.vehicleJson || {},
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-4">
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        className="rounded-lg"
      />
    </div>
  );
}
