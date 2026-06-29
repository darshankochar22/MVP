import { useState, useEffect } from "react";

export interface VatNatureOfReturn {
  nature_of_return?: string;
}

const NATURE_OPTIONS = ["♦ Not Applicable", "Other Adjustments"];

interface Props {
  initialDetails?: { nature_of_return?: string } | null;
  onClose: () => void;
  onSave: (details: VatNatureOfReturn) => void;
}

export default function VatNatureOfReturnPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<VatNatureOfReturn>({
    nature_of_return: initialDetails?.nature_of_return || NATURE_OPTIONS[0],
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
          <span className="text-sm font-bold">Additional Details</span>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <span className="w-32 text-sm text-black shrink-0">Nature of Return</span>
            <span className="text-sm text-black shrink-0">:</span>
            <select
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black bg-yellow-50"
              value={form.nature_of_return ?? ""}
              onChange={(e) => setForm({ nature_of_return: e.target.value })}
              autoFocus
            >
              {NATURE_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
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
