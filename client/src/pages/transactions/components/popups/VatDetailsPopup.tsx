import { useState, useEffect } from "react";

export interface VatDetails {
  date_time?: string;
}

interface Props {
  initialDetails?: VatDetails | null;
  onClose: () => void;
  onSave: (details: VatDetails) => void;
}

function defaultNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function VatDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<VatDetails>({
    date_time: initialDetails?.date_time || defaultNow(),
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

  const handleSave = () => onSave(form);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[360px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">VAT Details</span>
        </div>

        {/* Body */}
        <div className="p-4 flex items-center gap-2">
          <span className="w-24 text-sm text-black shrink-0">Date &amp; Time</span>
          <span className="text-sm text-black shrink-0">:</span>
          <input
            type="datetime-local"
            className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
            value={form.date_time ?? ""}
            onChange={(e) => setForm({ date_time: e.target.value })}
            autoFocus
          />
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
