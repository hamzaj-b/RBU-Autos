"use client";
import { useEffect, useState } from "react";
import {
  Table,
  Modal,
  Input,
  message,
  Popconfirm,
  Switch,
  Tooltip,
  Spin,
  Select,
  Tag,
} from "antd";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, RefreshCcw } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

export default function ServicesPage() {
  const { token } = useAuth();
  const [clientReady, setClientReady] = useState(false);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all"); // 👈 new filter
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    durationMinutes: "",
    basePrice: "",
  });

  useEffect(() => setClientReady(true), []);

  // ─── Fetch Services ────────────────────────────────
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/services?search=${search}&sortBy=createdAt&order=${sortOrder}&status=${statusFilter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setServices(data.data || []);
      else message.error(data.error || "Failed to load services");
    } catch (err) {
      console.error(err);
      message.error("Error loading services");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientReady) fetchServices();
  }, [clientReady, search, sortOrder, statusFilter]); // 👈 added statusFilter dependency

  // ─── Handle Save / Update ───────────────────────────
  const handleSave = async () => {
    const isEdit = !!editingService;
    if (!formData.name || !formData.basePrice)
      return message.warning("Name and Base Price are required");

    try {
      setLoading(true);
      const method = isEdit ? "PUT" : "POST";
      const url = isEdit
        ? `/api/services/${editingService.id}`
        : "/api/services";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          description: formData.description,
          durationMinutes: parseInt(formData.durationMinutes) || null,
          basePrice: parseFloat(formData.basePrice) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success(isEdit ? "Service updated!" : "Service created!");
        setModalOpen(false);
        setEditingService(null);
        setFormData({
          name: "",
          category: "",
          description: "",
          durationMinutes: "",
          basePrice: "",
        });
        fetchServices();
      } else {
        message.error(data.error || "Failed to save service");
      }
    } catch (err) {
      console.error(err);
      message.error("Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete ────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        message.success("Service deleted");
        fetchServices();
      } else {
        message.error(data.error || "Failed to delete service");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Toggle Status ─────────────────────────────────
  const toggleStatus = async (id, newStatus) => {
    try {
      setServices((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, isActive: newStatus, _loading: true } : s
        )
      );

      const res = await fetch("/api/services/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, isActive: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success(data.message || "Status updated");
        setServices((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, isActive: newStatus, _loading: false } : s
          )
        );
      } else {
        message.error(data.error || "Failed to update status");
        fetchServices();
      }
    } catch (err) {
      console.error(err);
      message.error("Network error updating status");
      fetchServices();
    }
  };

  // ─── Table Columns ─────────────────────────────────
  const columns = [
    {
      title: "Service Name",
      dataIndex: "name",
      render: (text, record) => (
        <span
          className={`font-semibold ${
            record.isActive ? "text-gray-800" : "text-gray-400 italic"
          }`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationMinutes",
      render: (t) => (t ? `${t} mins` : "N/A"),
    },
    {
      title: "Base Price",
      dataIndex: "basePrice",
      render: (p, record) => (
        <span className={record.isActive ? "text-gray-800" : "text-gray-400"}>
          ₨ {p?.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title={val ? "Deactivate Service" : "Activate Service"}>
            <Switch
              checked={val}
              loading={record._loading}
              onChange={(checked) => toggleStatus(record.id, checked)}
            />
          </Tooltip>
          {!val && <Tag color="red">Deactivated</Tag>}
        </div>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingService(record);
              setFormData(record);
              setModalOpen(true);
            }}
            className="flex items-center gap-1 text-blue-600 hover:bg-blue-100"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Popconfirm
            title="Delete this service permanently?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 text-red-600 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (!clientReady)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 antialiased transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Service Management
        </h1>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchServices}
            variant="outline"
            className="flex items-center gap-2 text-gray-600"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={() => {
              setModalOpen(true);
              setEditingService(null);
              setFormData({
                name: "",
                category: "",
                description: "",
                durationMinutes: "",
                basePrice: "",
              });
            }}
            className="bg-white border shadow-xs hover:bg-gray-100 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Service
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mb-5 flex items-center gap-4">
        <Input.Search
          placeholder="Search by service or category..."
          allowClear
          onSearch={(val) => setSearch(val)}
          className="max-w-sm"
        />
        <Select
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { label: "All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Deactivated", value: "inactive" },
          ]}
          style={{ width: 180 }}
        />
      </div>

      {/* Table */}
      <Spin spinning={loading}>
        <div className="bg-white rounded-xl shadow-lg p-4">
          <Table
            columns={columns}
            dataSource={services}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            className="rounded-lg"
          />
        </div>
      </Spin>
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={
          <div className="text-lg font-semibold text-gray-700">
            {editingService ? "Edit Service" : "Create New Service"}
          </div>
        }
        className="rounded-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Service name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Category
            </label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData((p) => ({ ...p, category: e.target.value }))
              }
              placeholder="e.g., Engine, Electrical"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Description
            </label>
            <Input.TextArea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Short description..."
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">
                Duration (min)
              </label>
              <Input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    durationMinutes: e.target.value,
                  }))
                }
                placeholder="e.g., 60"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">
                Base Price
              </label>
              <Input
                type="number"
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, basePrice: e.target.value }))
                }
                placeholder="e.g., 500"
              />
            </div>
          </div>

          <div className="pt-3">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-white border shadow-xs hover:bg-gray-100 text-white font-medium rounded-lg py-2"
            >
              {loading
                ? "Saving..."
                : editingService
                ? "Update Service"
                : "Create Service"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
