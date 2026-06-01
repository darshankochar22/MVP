import { useState, useEffect } from "react";

export interface DispatchDetails {
  delivery_note_nos?: string;
  dispatch_doc_no?: string;
  dispatched_through?: string;
  destination?: string;
  carrier_name?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
}

interface Props {
  initialDetails?: DispatchDetails | null;
  onClose: () => void;
  onSave: (details: DispatchDetails) => void;
}

export default function DispatchDetailsPopup({
  initialDetails,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<DispatchDetails>({
    delivery_note_nos: initialDetails?.delivery_note_nos ?? "",
    dispatch_doc_no: initialDetails?.dispatch_doc_no ?? "",
    dispatched_through: initialDetails?.dispatched_through ?? "",
    destination: initialDetails?.destination ?? "",
    carrier_name: initialDetails?.carrier_name ?? "",
    bill_of_lading_no: initialDetails?.bill_of_lading_no ?? "",
    bill_of_lading_date: initialDetails?.bill_of_lading_date ?? "",
    motor_vehicle_no: initialDetails?.motor_vehicle_no ?? "",
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

  const set = (field: keyof DispatchDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // No mandatory fields - user can skip by clicking Accept
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[700px] flex flex-col">
        {/* Header */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Dispatch Details</span>
        </div>

        {/* Form Content — two-column layout matching Tally */}
        <div className="p-4 flex gap-6">
          {/* Left column */}
          <div className="w-1/2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-black shrink-0">Delivery Note No(s)</span>
              <span className="text-sm text-black shrink-0">:</span>
            </div>
            <input
              type="text"
              className="w-full text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
              value={form.delivery_note_nos ?? ""}
              onChange={(e) => set("delivery_note_nos", e.target.value)}
              autoFocus
            />
          </div>

          {/* Right column */}
          <div className="w-1/2 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Dispatch Doc No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.dispatch_doc_no ?? ""}
                onChange={(e) => set("dispatch_doc_no", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Dispatched through</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.dispatched_through ?? ""}
                onChange={(e) => set("dispatched_through", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Destination</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.destination ?? ""}
                onChange={(e) => set("destination", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Carrier Name/Agent</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.carrier_name ?? ""}
                onChange={(e) => set("carrier_name", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Bill of Lading/LR-RR No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.bill_of_lading_no ?? ""}
                onChange={(e) => set("bill_of_lading_no", e.target.value)}
              />
              <span className="text-sm text-black shrink-0">Date</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="date"
                className="w-28 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.bill_of_lading_date ?? ""}
                onChange={(e) => set("bill_of_lading_date", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-40 text-sm text-black shrink-0">Motor Vehicle No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.motor_vehicle_no ?? ""}
                onChange={(e) => set("motor_vehicle_no", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-black px-3 py-2 flex justify-between items-center bg-gray-50">
          <span className="text-[10px] text-gray-600">Alt+A: Accept &nbsp;&middot;&nbsp; Esc: Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1 border border-black text-black hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-4 py-1 bg-black text-white hover:bg-gray-800"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
