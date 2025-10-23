"use client";

import { useEffect, useState } from "react";
import {
  Card,
  InputNumber,
  Switch,
  TimePicker,
  Select,
  Spin,
  message,
} from "antd";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Settings2, Clock, Globe2 } from "lucide-react";
import dayjs from "dayjs";
import timeZones from "@/timeZones.json"; // ✅ imported from root

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  // ───────────────────────────────
  // Fetch settings from API
  // ───────────────────────────────
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/business-settings");
      const data = await res.json();

      if (res.ok && data.settings?.length > 0) {
        setSettings(data.settings[0]);
      } else {
        // no settings exist yet — initialize defaults
        const defaultZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const matchZone = timeZones.find((t) => t.zone === defaultZone);
        setSettings({
          timezone: defaultZone,
          utc: matchZone?.utc || "(UTC+00:00)",
          openTime: "09:00",
          closeTime: "18:00",
          slotMinutes: 30,
          bufferMinutes: 0,
          allowCustomerBooking: true,
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────
  // Save settings (POST/PUT)
  // ───────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const method = settings.id ? "PUT" : "POST";
      const url = settings.id
        ? `/api/business-settings/${settings.id}`
        : "/api/business-settings";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          utc: settings.utc || "",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        message.success("Settings saved successfully");
        setSettings(data.settings || settings);
      } else {
        message.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      message.error("Network error saving settings");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  if (loading || !settings) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-0 justify-between mb-8">
        <div className="flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-blue-theme" />
          <h1 className="text-xl md:text-3xl font-semibold">Business Settings</h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            className="flex items-center gap-2 text-gray-600"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`bg-blue-theme hover:bg-blue-bold !text-white ${
              saving && "opacity-70"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <Card className="p-8 rounded-2xl shadow-xl border border-gray-200 bg-white mx-auto">
        <div className="space-y-8">
          {/* ─── Timezone ─────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Globe2 className="w-5 h-5 text-blue-theme" />
              <h2 className="text-lg font-semibold text-gray-800">Timezone</h2>
            </div>

            <Select
              showSearch
              value={settings.timezone}
              onChange={(val) => {
                const selected = timeZones.find((t) => t.zone === val);
                setSettings((prev) => ({
                  ...prev,
                  timezone: val,
                  utc: selected?.utc || "",
                }));
              }}
              options={timeZones.map((t) => ({
                value: t.zone,
                label: `${t.utc} - ${t.name}`,
              }))}
              className="w-full"
            />

            <p className="text-sm text-gray-500 mt-2">
              Current offset:{" "}
              <span className="font-medium">{settings.utc}</span>
            </p>
          </section>

          {/* ─── Business Hours ───────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-theme" />
              <h2 className="text-lg font-semibold text-gray-800">
                Business Hours
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">
                  Open Time
                </label>
                <TimePicker
                  format="HH:mm"
                  value={dayjs(settings.openTime, "HH:mm")}
                  onChange={(val) =>
                    setSettings((p) => ({
                      ...p,
                      openTime: val ? val.format("HH:mm") : "09:00",
                    }))
                  }
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">
                  Close Time
                </label>
                <TimePicker
                  format="HH:mm"
                  value={dayjs(settings.closeTime, "HH:mm")}
                  onChange={(val) =>
                    setSettings((p) => ({
                      ...p,
                      closeTime: val ? val.format("HH:mm") : "18:00",
                    }))
                  }
                  className="w-full mt-1"
                />
              </div>
            </div>
          </section>

          {/* ─── Slot Config ──────────────────────────── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Slot Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 font-medium">
                  Slot Duration (minutes)
                </label>
                <InputNumber
                  min={5}
                  max={120}
                  value={settings.slotMinutes}
                  onChange={(val) =>
                    setSettings((p) => ({ ...p, slotMinutes: val }))
                  }
                  className="w-full mt-1"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 font-medium">
                  Buffer Time (minutes)
                </label>
                <InputNumber
                  min={0}
                  max={60}
                  value={settings.bufferMinutes}
                  onChange={(val) =>
                    setSettings((p) => ({ ...p, bufferMinutes: val }))
                  }
                  className="w-full mt-1"
                />
              </div>
            </div>
          </section>

          {/* ─── Booking Control ──────────────────────── */}
          <section className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Allow Customer Bookings
              </h2>
              <p className="text-sm text-gray-500">
                Enable or disable customer access to self-book appointments.
              </p>
            </div>
            <Switch
              className="bg-blue-bold"
              checked={settings.allowCustomerBooking}
              onChange={(val) =>
                setSettings((p) => ({ ...p, allowCustomerBooking: val }))
              }
            />
          </section>
        </div>
      </Card>
    </div>
  );
}
