import { useState, useEffect } from "react";
import type { OrderDetails } from "./OrderDetailsPopup";

interface Props {
  initialDetails?: OrderDetails | null;
  onClose: () => void;
  onSave: (details: OrderDetails) => void;
}

// Purchase Order "Order Details" sub-screen (Tally-faithful). A compact Order
// Details block (Mode/Terms of Payment, Other References, Terms of Delivery) over
// a Receipt Details block (Dispatch through, Destination, Carrier Name/Agent,
// Bill of Lading/LR-RR No. + Date, Motor Vehicle No.). Deliberately omits the
// Order No(s)/Date and Doc No. fields the shared OrderDetailsPopup carries — hence
// a dedicated popup rather than a prop on the shared one.
export default function PurchaseOrderDetailsPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<OrderDetails>({
    mode_terms_of_payment: initialDetails?.mode_terms_of_payment ?? "",
    other_references: initialDetails?.other_references ?? "",
    terms_of_delivery: initialDetails?.terms_of_delivery ?? "",
    dispatched_through: initialDetails?.dispatched_through ?? "",
    destination: initialDetails?.destination ?? "",
    carrier_name: initialDetails?.carrier_name ?? "",
    bill_of_lading_no: initialDetails?.bill_of_lading_no ?? "",
    bill_of_lading_date: initialDetails?.bill_of_lading_date ?? "",
    motor_vehicle_no: initialDetails?.motor_vehicle_no ?? "",
  });

  const set = (field: keyof OrderDetails, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

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

  const labelCls = "w-44 text-left text-sm text-black shrink-0";
  const inputCls = "flex-1 min-w-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[540px] flex flex-col">
        {/* Section: Order Details */}
        <div className="px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Order Details</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className={labelCls}>Mode/Terms of Payment</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              autoFocus
              type="text"
              className={`${inputCls} bg-yellow-50`}
              value={form.mode_terms_of_payment ?? ""}
              onChange={(e) => set("mode_terms_of_payment", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Other References</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.other_references ?? ""} onChange={(e) => set("other_references", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Terms of Delivery</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.terms_of_delivery ?? ""} onChange={(e) => set("terms_of_delivery", e.target.value)} />
          </div>
        </div>

        {/* Section: Receipt Details */}
        <div className="px-3 py-1 flex justify-center items-center select-none border-y border-gray-300">
          <span className="text-sm font-bold">Receipt Details</span>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className={labelCls}>Dispatch through</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.dispatched_through ?? ""} onChange={(e) => set("dispatched_through", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Destination</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.destination ?? ""} onChange={(e) => set("destination", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Carrier Name/Agent</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.carrier_name ?? ""} onChange={(e) => set("carrier_name", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Bill of Lading/LR-RR No.</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.bill_of_lading_no ?? ""} onChange={(e) => set("bill_of_lading_no", e.target.value)} />
            <span className="text-sm text-black shrink-0">Date</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="date"
              className="w-36 shrink-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
              value={form.bill_of_lading_date ?? ""}
              onChange={(e) => set("bill_of_lading_date", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={labelCls}>Motor Vehicle No.</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input type="text" className={inputCls} value={form.motor_vehicle_no ?? ""} onChange={(e) => set("motor_vehicle_no", e.target.value)} />
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
