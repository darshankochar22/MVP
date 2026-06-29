import { useState, useEffect } from "react";

export interface DebitNoteExciseDetails {
  date_time_of_invoice?: string;
  date_time_of_removal?: string;
}

function defaultNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

interface Props {
  initialDetails?: DebitNoteExciseDetails | null;
  onClose: () => void;
  onSave: (details: DebitNoteExciseDetails) => void;
}

export default function DebitNoteExciseDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<DebitNoteExciseDetails>({
    date_time_of_invoice: initialDetails?.date_time_of_invoice || defaultNow(),
    date_time_of_removal: initialDetails?.date_time_of_removal || defaultNow(),
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
      <div className="bg-white border border-black shadow-xl w-[480px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Excise Details</span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-44 text-sm text-black shrink-0">Date &amp; Time of Invoice</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="datetime-local"
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black bg-yellow-50"
              value={form.date_time_of_invoice ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, date_time_of_invoice: e.target.value }))}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-44 text-sm text-black shrink-0">Date &amp; Time of Removal</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="datetime-local"
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black"
              value={form.date_time_of_removal ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, date_time_of_removal: e.target.value }))}
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
