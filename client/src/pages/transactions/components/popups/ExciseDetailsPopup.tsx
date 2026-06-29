import { useState, useEffect } from "react";

export interface ExciseDetails {
  inspection_document_no?: string;
  inspection_document_date?: string;
}

interface Props {
  initialDetails?: ExciseDetails | null;
  onClose: () => void;
  onSave: (details: ExciseDetails) => void;
}

export default function ExciseDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<ExciseDetails>({
    inspection_document_no: initialDetails?.inspection_document_no ?? "",
    inspection_document_date: initialDetails?.inspection_document_date ?? "",
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

  const set = (field: keyof ExciseDetails, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => onSave(form);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[640px] flex flex-col">
        <div className="bg-black text-white px-3 py-1 flex justify-between items-center select-none">
          <span className="text-sm font-bold">Tax Details</span>
          <button onClick={onClose} className="text-white hover:text-gray-300 font-bold text-sm leading-none">&times;</button>
        </div>

        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-gray-300">
          <span className="text-sm font-bold">Excise Details</span>
        </div>

        <div className="p-4 flex items-center gap-2">
          <span className="text-sm text-black shrink-0">Inspection document no.</span>
          <span className="text-sm text-black shrink-0">:</span>
          <input
            type="text"
            className="flex-1 min-w-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
            value={form.inspection_document_no ?? ""}
            onChange={(e) => set("inspection_document_no", e.target.value)}
            autoFocus
          />
          <span className="text-sm text-black shrink-0">Date</span>
          <span className="text-sm text-black shrink-0">:</span>
          <input
            type="date"
            className="w-36 shrink-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
            value={form.inspection_document_date ?? ""}
            onChange={(e) => set("inspection_document_date", e.target.value)}
          />
        </div>

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