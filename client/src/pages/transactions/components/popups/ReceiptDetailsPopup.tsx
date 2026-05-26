import { useState, useEffect } from "react";

interface ReceiptDetail {
  id: string;
  receipt_date: string;
  receipt_reference_number: string;
  supplier_invoice_number?: string;
  location_received?: string;
  quantity_received?: string;
  condition_status: "Good" | "Damaged" | "Partial" | "Others";
  inspection_notes?: string;
  received_by?: string;
}

interface Props {
  partyName: string;
  totalAmount: number;
  initialDetails?: ReceiptDetail | null;
  onClose: () => void;
  onSave: (details: ReceiptDetail) => void;
}

export default function ReceiptDetailsPopup({
  partyName,
  totalAmount,
  initialDetails,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ReceiptDetail>({
    id: initialDetails?.id ?? `receipt_${Date.now()}`,
    receipt_date: initialDetails?.receipt_date ?? new Date().toISOString().split("T")[0],
    receipt_reference_number: initialDetails?.receipt_reference_number ?? "",
    supplier_invoice_number: initialDetails?.supplier_invoice_number ?? "",
    location_received: initialDetails?.location_received ?? "",
    quantity_received: initialDetails?.quantity_received ?? "",
    condition_status: initialDetails?.condition_status ?? "Good",
    inspection_notes: initialDetails?.inspection_notes ?? "",
    received_by: initialDetails?.received_by ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.altKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const set = (field: keyof ReceiptDetail, value: any) => {
    setError(null);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.receipt_date.trim()) {
      setError("Receipt date is required.");
      return;
    }
    if (!form.receipt_reference_number.trim()) {
      setError("Receipt reference number is required.");
      return;
    }
    if (!form.condition_status) {
      setError("Condition status is required.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-2xl w-[550px] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Receipt Details</span>
            <span className="text-[10px] text-zinc-400 font-mono">Supplier: {partyName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm">&times;</button>
        </div>

        {/* Amount Info */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <span>Purchase Amount:</span>
          <span className="font-mono text-zinc-900 text-sm">
            ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Form Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 min-h-0">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-1.5 rounded flex justify-between items-center">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="font-bold">&times;</button>
            </div>
          )}

          {/* Receipt Date */}
          <Field label="Receipt Date *">
            <input
              type="date"
              value={form.receipt_date}
              onChange={(e) => set("receipt_date", e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>

          {/* Receipt Reference Number */}
          <Field label="Receipt Reference Number / GRN *">
            <input
              type="text"
              value={form.receipt_reference_number}
              onChange={(e) => set("receipt_reference_number", e.target.value)}
              placeholder="e.g. GRN-2024-001"
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>

          {/* Supplier Invoice Number */}
          <Field label="Supplier Invoice Number (Optional)">
            <input
              type="text"
              value={form.supplier_invoice_number ?? ""}
              onChange={(e) => set("supplier_invoice_number", e.target.value)}
              placeholder="e.g. INV-2024-5678"
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>

          {/* Location Received */}
          <Field label="Location / Godown (Optional)">
            <input
              type="text"
              value={form.location_received ?? ""}
              onChange={(e) => set("location_received", e.target.value)}
              placeholder="e.g. Warehouse A, Shelf 5"
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>

          {/* Quantity Received */}
          <Field label="Quantity Received (Optional)">
            <input
              type="text"
              value={form.quantity_received ?? ""}
              onChange={(e) => set("quantity_received", e.target.value)}
              placeholder="e.g. 100 units / 50 boxes"
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>

          {/* Condition Status */}
          <Field label="Condition Status *">
            <select
              value={form.condition_status}
              onChange={(e) => set("condition_status", e.target.value as any)}
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            >
              <option value="Good">Good</option>
              <option value="Damaged">Damaged</option>
              <option value="Partial">Partial Damage</option>
              <option value="Others">Others</option>
            </select>
          </Field>

          {/* Inspection Notes */}
          <Field label="Inspection / Quality Notes (Optional)">
            <textarea
              value={form.inspection_notes ?? ""}
              onChange={(e) => set("inspection_notes", e.target.value)}
              placeholder="Note any defects, quality issues, or inspection findings…"
              rows={3}
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white resize-none"
            />
          </Field>

          {/* Received By */}
          <Field label="Received By / Inspector (Optional)">
            <input
              type="text"
              value={form.received_by ?? ""}
              onChange={(e) => set("received_by", e.target.value)}
              placeholder="e.g. John Doe / QC Inspector"
              className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold bg-white"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500">Alt+A: Accept &nbsp;·&nbsp; Esc: Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-5 py-1.5 rounded bg-zinc-950 text-white hover:bg-zinc-800 font-semibold shadow-sm active:scale-95"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  );
}
