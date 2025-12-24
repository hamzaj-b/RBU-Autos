"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  Space,
  Typography,
  Divider,
  Skeleton,
  Empty,
  message as antdMessage,
} from "antd";
import { SendOutlined, ReloadOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";

const { Title, Text } = Typography;

function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);

  const exec = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML || "");
  };

  const onInput = () => onChange(ref.current?.innerHTML || "");

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 rounded-lg border bg-white p-2">
        <Button size="small" onClick={() => exec("bold")}>
          <b>B</b>
        </Button>
        <Button size="small" onClick={() => exec("italic")}>
          <i>I</i>
        </Button>
        <Button size="small" onClick={() => exec("underline")}>
          <u>U</u>
        </Button>
        <Button size="small" onClick={() => exec("insertUnorderedList")}>
          • List
        </Button>
        <Button size="small" onClick={() => exec("insertOrderedList")}>
          1. List
        </Button>
        <Button
          size="small"
          onClick={() => {
            const url = window.prompt("Enter link URL:");
            if (url) exec("createLink", url);
          }}
        >
          Link
        </Button>
        <Button size="small" onClick={() => exec("removeFormat")}>
          Clear
        </Button>
      </div>

      <div
        ref={ref}
        contentEditable
        onInput={onInput}
        className="min-h-[220px] mt-2 rounded-lg border bg-white p-3 outline-none"
        style={{ lineHeight: 1.6 }}
        suppressContentEditableWarning
      />
      <div className="mt-2 text-xs text-neutral-500">
        Tip: You can paste formatted text from Word/Google Docs (it will keep
        basic formatting).
      </div>
    </div>
  );
}

export default function EmailSendingPage() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // ✅ prevents initial unstyled flash by waiting until first fetch is done
  const [pageReady, setPageReady] = useState(false);

  // Email form state
  const [subject, setSubject] = useState("");
  const [headline, setHeadline] = useState("");
  const [brandName, setBrandName] = useState("RBU Autos Garage CRM");
  const [footerNote, setFooterNote] = useState("Limited time only!");
  const [ctaText, setCtaText] = useState("View Details");
  const [ctaLink, setCtaLink] = useState("");
  const [editorHtml, setEditorHtml] = useState(
    "<p>Hello 👋</p><p>We have an update for you.</p>"
  );

  const fetchCustomers = async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/customers?limit=all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to fetch customers");
      }

      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data?.customers || data?.data || [];

      setCustomers(list);
    } catch (e) {
      toast.error(e.message || "Failed to load customers");
    } finally {
      setLoading(false);
      setPageReady(true); // ✅ mark UI ready after first attempt
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const id = String(c?.id || c?._id || "");
      const name = String(c?.fullName || "").toLowerCase();
      const user = Array.isArray(c?.User) ? c.User[0] : null;
      const email = String(user?.email || "").toLowerCase();
      const phone = String(user?.phone || "").toLowerCase();
      return (
        id.includes(q) ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }, [customers, search]);

  const columns = [
    {
      title: "Customer",
      key: "customer",
      render: (_, c) => {
        const name = c?.fullName || "—";
        const user = Array.isArray(c?.User) ? c.User[0] : null;

        const email = user?.email || "—";
        const phone = user?.phone || "—";

        return (
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-neutral-500">{email}</div>
            <div className="text-xs text-neutral-500">{phone}</div>
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, c) => {
        const user = Array.isArray(c?.User) ? c.User[0] : null;
        const isActive = user?.isActive ?? false;

        return (
          <span
            className={`text-xs ${
              isActive ? "text-green-600" : "text-red-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const sendEmails = async () => {
    try {
      if (!selectedRowKeys.length)
        return toast.error("Select at least 1 customer");
      if (!editorHtml || editorHtml.replace(/<[^>]*>/g, "").trim().length < 3) {
        return toast.error("Email message is too short");
      }

      setSending(true);

      const res = await fetch("/api/marketing/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          customerIds: selectedRowKeys, // CustomerProfile ids
          subject,
          headline,
          message: editorHtml,
          ctaText,
          ctaLink,
          footerNote,
          brandName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.details || data?.error || "Failed to send emails"
        );
      }

      antdMessage.success(
        `Sent: ${data?.sent || 0}, Failed: ${data?.failed || 0}, Skipped: ${
          data?.skippedNoEmailCount || 0
        }`
      );

      toast.success("Marketing email sent!");
      setSelectedRowKeys([]);
    } catch (e) {
      toast.error(e.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  // ✅ Initial loader to prevent distortion on first load
  if (!pageReady) {
    return (
      <div className="p-4 sm:p-6">
        <Card bodyStyle={{ padding: 12 }}>
          <Skeleton active paragraph={{ rows: 12 }} />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* ✅ responsive header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Title level={3} className="!mb-0">
            Send Marketing Email
          </Title>
          <Text type="secondary">
            Select customers, compose email, and send in one click.
          </Text>
        </div>

        {/* ✅ wraps on mobile */}
        <Space className="flex flex-wrap gap-2">
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCustomers}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendEmails}
            loading={sending}
            disabled={!selectedRowKeys.length}
          >
            Send ({selectedRowKeys.length})
          </Button>
        </Space>
      </div>

      {/* ✅ responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left */}
        <Card
          className="lg:col-span-5"
          title="Customers"
          bodyStyle={{ padding: 12 }}
        >
          <Input
            placeholder="Search by name, email, phone, id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3"
          />

          {loading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : filtered.length === 0 ? (
            <Empty description="No customers found" />
          ) : (
            <Table
              rowKey={(c) => c?.id || c?._id}
              columns={columns}
              dataSource={filtered}
              rowSelection={rowSelection}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ x: 520 }} // ✅ mobile horizontal scroll
            />
          )}

          <Divider className="!my-3" />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Text type="secondary">Selected: {selectedRowKeys.length}</Text>
            <Space className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  setSelectedRowKeys(filtered.map((c) => c?.id || c?._id))
                }
                disabled={!filtered.length}
              >
                Select All (Filtered)
              </Button>
              <Button
                onClick={() => setSelectedRowKeys([])}
                disabled={!selectedRowKeys.length}
              >
                Clear
              </Button>
            </Space>
          </div>
        </Card>

        {/* Right */}
        <Card
          className="lg:col-span-7"
          title="Email Composer"
          bodyStyle={{ padding: 12 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-12">
              <label className="text-xs text-neutral-500">
                Subject (optional)
              </label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Special Offer for You"
              />
            </div>

            <div className="sm:col-span-12">
              <label className="text-xs text-neutral-500">
                Headline (optional)
              </label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="New Offer 🎉"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="text-xs text-neutral-500">Brand Name</label>
              <Input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>

            <div className="sm:col-span-6">
              <label className="text-xs text-neutral-500">
                Footer Note (optional)
              </label>
              <Input
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
              />
            </div>

            <div className="col-span-12">
              <label className="text-xs text-neutral-500">
                Message (Rich Text)
              </label>
              <RichTextEditor value={editorHtml} onChange={setEditorHtml} />
            </div>
          </div>

          <Divider />

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Text className="font-semibold">Preview</Text>
              <Text type="secondary" className="text-xs">
                This preview is the email body HTML you typed.
              </Text>
            </div>

            <div className="rounded-lg border bg-white p-4 overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: editorHtml }} />
            </div>
          </div>

          <Divider />

          {/* ✅ wrap on mobile */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              onClick={() =>
                setEditorHtml(
                  "<p>Hello 👋</p><p>We have an update for you.</p><p>Thanks!</p>"
                )
              }
            >
              Use Sample
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={sendEmails}
              loading={sending}
              disabled={!selectedRowKeys.length}
            >
              Send Now
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
