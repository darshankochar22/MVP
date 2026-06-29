import { useState, useEffect } from "react";

export interface VatAdditionalDetails {
  point_of_sale?: string;
}

interface Props {
  initialDetails?: { point_of_sale?: string } | null;
  onClose: () => void;
  onSave: (details: VatAdditionalDetails) => void;
}

export default function VatAdditionalDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<VatAdditionalDetails>({
    point_of_sale: initialDetails?.point_of_sale ?? "",
  });

  const handleSave = () => onSave(form);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.altKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[460px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Additional Details : Sales Taxable</span>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="w-28 text-sm text-black shrink-0">Point of Sale</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="text"
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black bg-yellow-50"
              value={form.point_of_sale ?? ""}
              onChange={(e) => setForm({ point_of_sale: e.target.value })}
              autoFocus
            />
          </div>
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
