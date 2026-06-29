import { useState, useEffect } from "react";

export interface GstNoteAdditionalDetails {
  reason_for_issuing_note?: string;
  supplier_note_no?: string;
  supplier_note_date?: string;
}

const REASON_OPTIONS = [
  "♦ Not Applicable",
  "04-Correction in Invoice",
  "05-Change in POS",
  "06-Finalization of Provisional assessment",
  "07-Others",
];

interface Props {
  initialDetails?: GstNoteAdditionalDetails | null;
  onClose: () => void;
  onSave: (details: GstNoteAdditionalDetails) => void;
}

export default function GstNoteAdditionalDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<GstNoteAdditionalDetails>({
    reason_for_issuing_note: initialDetails?.reason_for_issuing_note || REASON_OPTIONS[0],
    supplier_note_no: initialDetails?.supplier_note_no ?? "",
    supplier_note_date: initialDetails?.supplier_note_date ?? "",
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
      <div className="bg-white border border-black shadow-xl w-[680px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Additional Details</span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-56 text-sm text-black shrink-0">Reason for Issuing Note</span>
            <span className="text-sm text-black shrink-0">:</span>
            <select
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black bg-yellow-50"
              value={form.reason_for_issuing_note ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, reason_for_issuing_note: e.target.value }))}
              autoFocus
            >
              {REASON_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-56 text-sm text-black shrink-0">Supplier's Debit/Credit Note No.</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="text"
              className="min-w-0 flex-1 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black"
              value={form.supplier_note_no ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, supplier_note_no: e.target.value }))}
            />
            <span className="text-sm text-black shrink-0">Date</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="date"
              className="w-36 shrink-0 text-sm border border-gray-400 px-1 py-0.5 outline-none focus:border-black"
              value={form.supplier_note_date ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, supplier_note_date: e.target.value }))}
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
