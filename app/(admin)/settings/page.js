"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Switch,
  TimePicker,
  Select,
  Spin,
  InputNumber,
  message,
} from "antd";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Settings2, Clock, Globe2, Percent } from "lucide-react";
import dayjs from "dayjs";
import timeZones from "@/timeZones.json";

export default function BusinessSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/business-settings");
      const data = await res.json();

      if (res.ok && data.settings?.length > 0) {
        setSettings(data.settings[0]);
      } else {
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
          regionalTax: 0, // 🆕 Default
        });
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

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
        body: JSON.stringify({ ...settings, utc: settings.utc || "" }),
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
      <div className="flex justify-center items-center min-h-screen overflow-x-hidden">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden px-3 sm:px-6 py-5 text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-blue-theme" />
          <h1 className="text-lg sm:text-2xl font-semibold">
            Business Settings
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchSettings}
            className="flex items-center justify-center gap-2 text-gray-700 border-gray-300 hover:bg-gray-100 w-full sm:w-auto"
          >
            <RefreshCcw className="w-4 h-4" /> Refresh
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            className={`bg-blue-theme hover:bg-blue-bold !text-white font-medium w-full sm:w-auto justify-center ${
              saving && "opacity-70"
            }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <div className="mx-auto w-full">
        <Card className="p-4 sm:p-6 rounded-xl shadow-md border border-gray-200 bg-white">
          <div className="space-y-6">
            {/* Timezone */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Globe2 className="w-4 h-4 text-blue-theme" />
                <h2 className="text-base font-semibold">Timezone</h2>
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
                dropdownStyle={{ maxHeight: 250, overflowY: "auto" }}
                getPopupContainer={(trigger) => trigger.parentElement}
              />

              <p className="text-sm text-gray-500 mt-2 break-words">
                Current offset:{" "}
                <span className="font-medium">{settings.utc}</span>
              </p>
            </section>

            {/* Business Hours */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-theme" />
                <h2 className="text-base font-semibold">Business Hours</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    getPopupContainer={(trigger) => trigger.parentElement}
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
                    getPopupContainer={(trigger) => trigger.parentElement}
                  />
                </div>
              </div>
            </section>

            {/* Booking Toggle */}
            <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-800 mb-1">
                  Allow Customer Bookings
                </h2>
                <p className="text-sm text-gray-500 leading-snug">
                  Enable or disable customer access to self-book appointments.
                </p>
              </div>

              <Switch
                checked={settings.allowCustomerBooking}
                onChange={(val) =>
                  setSettings((p) => ({ ...p, allowCustomerBooking: val }))
                }
              />
            </section>

            {/* Regional Tax Section 🆕 */}
            <section className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-1">
                  <Percent className="w-4 h-4 text-green-600" />
                  Regional Tax (%)
                </h2>
                <p className="text-sm text-gray-500 leading-snug">
                  Set the regional tax percentage to apply on invoices.
                </p>
              </div>

              <InputNumber
                min={0}
                max={100}
                value={settings.regionalTax}
                formatter={(val) => `${val}%`}
                parser={(val) => val.replace("%", "")}
                onChange={(val) =>
                  setSettings((p) => ({ ...p, regionalTax: Number(val) || 0 }))
                }
                className="w-32 text-right"
              />
            </section>
          </div>
        </Card>
      </div>
    </div>
  );
}
