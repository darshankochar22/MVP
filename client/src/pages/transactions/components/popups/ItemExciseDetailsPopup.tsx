import { useState, useEffect } from "react";

export interface ExciseItemDetails {
  sales_invoice_number?: string;
  sales_invoice_date?: string;
  excise_sales_invoice?: string;
  rate_of_duty?: string;
  rate_per_unit?: string;
  supplier_duty_amount?: string;
  mfgr_importer_duty_amount?: string;
}

interface Props {
  itemName: string;
  initialDetails?: ExciseItemDetails | null;
  onClose: () => void;
  onSave: (details: ExciseItemDetails) => void;
}

const DUTY_FIELDS: [string, keyof ExciseItemDetails][] = [
  ["Rate of Duty", "rate_of_duty"],
  ["Rate per Unit", "rate_per_unit"],
  ["Supplier Duty Amount", "supplier_duty_amount"],
  ["Mfgr/Importer Duty Amount", "mfgr_importer_duty_amount"],
];

export default function ItemExciseDetailsPopup({ itemName, initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<ExciseItemDetails>({
    sales_invoice_number: initialDetails?.sales_invoice_number ?? "",
    sales_invoice_date: initialDetails?.sales_invoice_date ?? "",
    excise_sales_invoice: initialDetails?.excise_sales_invoice ?? "",
    rate_of_duty: initialDetails?.rate_of_duty ?? "",
    rate_per_unit: initialDetails?.rate_per_unit ?? "",
    supplier_duty_amount: initialDetails?.supplier_duty_amount ?? "",
    mfgr_importer_duty_amount: initialDetails?.mfgr_importer_duty_amount ?? "",
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.altKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const set = (field: keyof ExciseItemDetails, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => onSave(form);

  const inputCls = "min-w-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[600px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center gap-2 select-none border-b border-black">
          <span className="text-sm font-bold">Excise Details for</span>
          <span className="text-sm">:</span>
          <span className="text-sm font-bold">{itemName}</span>
        </div>

        {/* Invoice section */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-44 text-sm text-black shrink-0">Sales Invoice Number</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="text"
              className={`${inputCls} flex-1 bg-yellow-50`}
              value={form.sales_invoice_number ?? ""}
              onChange={(e) => set("sales_invoice_number", e.target.value)}
              autoFocus
            />
            <span className="text-sm text-black shrink-0">Date</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="date"
              className={`${inputCls} w-36 shrink-0`}
              value={form.sales_invoice_date ?? ""}
              onChange={(e) => set("sales_invoice_date", e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="w-44 text-sm text-black shrink-0">Excise Sales Invoice</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="text"
              className={`${inputCls} flex-1`}
              value={form.excise_sales_invoice ?? ""}
              onChange={(e) => set("excise_sales_invoice", e.target.value)}
            />
          </div>
        </div>

        {/* Duty Details section */}
        <div className="bg-white text-black px-3 py-1 select-none border-y border-gray-300">
          <span className="text-sm font-bold">Duty Details</span>
        </div>

        <div className="p-4 space-y-2">
          {DUTY_FIELDS.map(([label, key]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="w-44 text-sm text-black shrink-0">{label}</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                inputMode="decimal"
                className={`${inputCls} flex-1`}
                value={form[key] ?? ""}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-black px-3 py-2 flex justify-between items-center bg-gray-50">
          <span className="text-[10px] text-gray-600">Alt+A: Accept &nbsp;&middot;&nbsp; Esc: Close</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs px-3 py-1 border border-black text-black hover:bg-gray-100">Cancel</button>
            <button onClick={handleSave} className="text-xs px-4 py-1 bg-black text-white hover:bg-gray-800">Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
