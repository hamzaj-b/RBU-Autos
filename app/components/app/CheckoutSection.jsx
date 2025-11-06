import { useState, useEffect } from "react";
import { Input, message } from "antd";
import { Plus, Trash2, Wrench } from "lucide-react";

export default function CheckoutSection({
  selectedWO,
  setCompleteModal,
  fetchWorkOrders,
  token,
}) {
  const [laborEntries, setLaborEntries] = useState([]);
  const [partsUsed, setPartsUsed] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [includeTax, setIncludeTax] = useState(true);
  const [regionalTax, setRegionalTax] = useState(0);

  // 🧾 Fetch business tax %
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/business-settings");
        const data = await res.json();
        if (res.ok && data.settings?.length > 0) {
          setRegionalTax(data.settings[0].regionalTax || 0);
        }
      } catch (err) {
        console.error("Failed to fetch tax:", err);
      }
    })();
  }, []);

  // ➕ Helpers
  const addLabor = () =>
    setLaborEntries([...laborEntries, { task: "", hours: 1, rate: 0 }]);
  const addPart = () =>
    setPartsUsed([...partsUsed, { name: "", qty: 1, price: 0 }]);
  const updateLabor = (i, f, v) =>
    setLaborEntries((prev) =>
      prev.map((l, idx) => (i === idx ? { ...l, [f]: v } : l))
    );
  const updatePart = (i, f, v) =>
    setPartsUsed((prev) =>
      prev.map((p, idx) => (i === idx ? { ...p, [f]: v } : p))
    );
  const removeLabor = (i) =>
    setLaborEntries(laborEntries.filter((_, idx) => i !== idx));
  const removePart = (i) =>
    setPartsUsed(partsUsed.filter((_, idx) => i !== idx));

  // 🧮 Totals (services excluded)
  const laborTotal = laborEntries.reduce(
    (sum, l) => sum + (Number(l.rate) || 0) * (Number(l.hours) || 0),
    0
  );
  const partsTotal = partsUsed.reduce(
    (sum, p) => sum + (Number(p.price) || 0) * (Number(p.qty) || 0),
    0
  );

  // 🧾 Only include labor + parts totals
  const subTotal = laborTotal + partsTotal;
  const taxAmount = includeTax ? (subTotal * regionalTax) / 100 : 0;
  const grandTotal = subTotal + taxAmount;

  // ✅ Submit Completion
  const submitCompletion = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/workOrders/${selectedWO.id}/completed`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          laborEntries,
          partsUsed,
          taxRate: includeTax ? regionalTax : 0,
          taxAmount: includeTax ? taxAmount : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      message.success("Work order completed successfully!");
      setCompleteModal(false);
      fetchWorkOrders();
    } catch (err) {
      message.error(err.message || "Failed to complete work order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========== LABOR ========== */}
      <div className="bg-white shadow-sm rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="text-blue-500" /> Additional Labor
          </h4>
          <button
            onClick={addLabor}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-md hover:bg-blue-100 transition"
          >
            <Plus className="w-4 h-4" /> Add Labor
          </button>
        </div>

        {laborEntries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No labor entries yet</p>
        ) : (
          <div className="space-y-3">
            {laborEntries.map((l, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded-md border hover:shadow-sm transition-all"
              >
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Task
                  </label>
                  <Input
                    placeholder="Enter task description"
                    value={l.task}
                    onChange={(e) => updateLabor(i, "task", e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Hours
                  </label>
                  <Input
                    type="number"
                    value={l.hours}
                    onChange={(e) => updateLabor(i, "hours", e.target.value)}
                    className="w-full text-center"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Rate ($)
                  </label>
                  <Input
                    type="number"
                    value={l.rate}
                    onChange={(e) => updateLabor(i, "rate", e.target.value)}
                    className="w-full text-center"
                  />
                </div>

                <div className="flex items-center justify-center col-span-2">
                  <Trash2
                    className="text-gray-400 hover:text-red-500 cursor-pointer transition-all w-5 h-5"
                    onClick={() => removeLabor(i)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== PARTS ========== */}
      <div className="bg-white shadow-sm rounded-lg border p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Wrench className="text-purple-500 rotate-90" /> Parts Used
          </h4>
          <button
            onClick={addPart}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded-md hover:bg-purple-100 transition"
          >
            <Plus className="w-4 h-4" /> Add Part
          </button>
        </div>

        {partsUsed.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No parts added yet</p>
        ) : (
          <div className="space-y-3">
            {partsUsed.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-3 bg-gray-50 p-3 rounded-md border hover:shadow-sm transition-all"
              >
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Part Name
                  </label>
                  <Input
                    placeholder="e.g. Oil Filter"
                    value={p.name}
                    onChange={(e) => updatePart(i, "name", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={p.qty}
                    onChange={(e) => updatePart(i, "qty", e.target.value)}
                    className="w-full text-center"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Price ($)
                  </label>
                  <Input
                    type="number"
                    value={p.price}
                    onChange={(e) => updatePart(i, "price", e.target.value)}
                    className="w-full text-center"
                  />
                </div>
                <div className="flex items-center justify-center col-span-2">
                  <Trash2
                    className="text-gray-400 hover:text-red-500 cursor-pointer transition-all w-5 h-5"
                    onClick={() => removePart(i)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 💰 TOTALS + TAX */}
      <div className="bg-white border-t pt-4 space-y-3 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Labor Total:</span>
          <span>${laborTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Parts Total:</span>
          <span>${partsTotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center border-t pt-2 text-gray-800 font-medium">
          <div className="flex items-center gap-2">
            <span>Include Tax ({regionalTax}%)</span>
            <input
              type="checkbox"
              checked={includeTax}
              onChange={(e) => setIncludeTax(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
          </div>
          <span>${taxAmount.toFixed(2)}</span>
        </div>

        <div className="flex justify-between border-t pt-3 text-lg font-semibold text-emerald-700">
          <span>Grand Total:</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ✅ Submit */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-lg shadow-md flex justify-between items-center p-4 mt-6">
        <div className="text-lg font-semibold">
          Final Total: ${grandTotal.toFixed(2)}
        </div>
        <button
          onClick={submitCompletion}
          disabled={submitting}
          className="bg-white !text-emerald-700 hover:bg-gray-50 px-6 py-2 rounded-md font-semibold shadow-sm transition"
        >
          {submitting ? "Completing..." : "Mark as Completed"}
        </button>
      </div>
    </div>
  );
}
