import { useState, useEffect } from "react";

export interface OrderDetails {
  order_nos?: string;
  order_date?: string;
  mode_terms_of_payment?: string;
  other_references?: string;
  terms_of_delivery?: string;
  challan_nos?: string;
  dispatched_through?: string;
  destination?: string;
  carrier_name?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
}

interface Props {
  initialDetails?: OrderDetails | null;
  onClose: () => void;
  onSave: (details: OrderDetails) => void;
  /** Inward vouchers (e.g. Receipt Note) label the 2nd block "Receipt Details"
   *  with "Receipt Doc No." instead of the outward "Dispatch Details". */
  receiptVariant?: boolean;
}

export default function OrderDetailsPopup({ initialDetails, onClose, onSave, receiptVariant }: Props) {
  const [form, setForm] = useState<OrderDetails>({
    order_nos: initialDetails?.order_nos ?? "",
    order_date: initialDetails?.order_date ?? "",
    mode_terms_of_payment: initialDetails?.mode_terms_of_payment ?? "",
    other_references: initialDetails?.other_references ?? "",
    terms_of_delivery: initialDetails?.terms_of_delivery ?? "",
    challan_nos: initialDetails?.challan_nos ?? "",
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

  const labelCls = "w-48 text-right text-sm text-black shrink-0";
  const dispLabel = "w-44 text-left text-sm text-black shrink-0";
  const inputCls = "flex-1 min-w-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border border-black shadow-xl w-[820px] flex flex-col">
        {/* Section: Order Details */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-b border-black">
          <span className="text-sm font-bold">Order Details</span>
        </div>

        <div className="p-4 flex gap-8">
          {/* Left — Order No(s) + Date */}
          <div className="w-56 shrink-0 space-y-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-black shrink-0">Order No(s)</span>
                <span className="text-sm text-black shrink-0">:</span>
              </div>
              <input
                type="text"
                className="w-full text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
                value={form.order_nos ?? ""}
                onChange={(e) => set("order_nos", e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-black shrink-0">Date</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="date"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.order_date ?? ""}
                onChange={(e) => set("order_date", e.target.value)}
              />
            </div>
          </div>

          {/* Right */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className={labelCls}>Mode/Terms of Payment</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.mode_terms_of_payment ?? ""} onChange={(e) => set("mode_terms_of_payment", e.target.value)} />
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
        </div>

        {/* Section: Dispatch / Receipt Details */}
        <div className="bg-white text-black px-3 py-1 flex justify-center items-center select-none border-y border-gray-300">
          <span className="text-sm font-bold">{receiptVariant ? "Receipt Details" : "Dispatch Details"}</span>
        </div>

        <div className="p-4">
          <div className="w-[620px] space-y-2">
            <div className="flex items-center gap-2">
              <span className={dispLabel}>{receiptVariant ? "Receipt Doc No." : "Dispatch Doc No."}</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.challan_nos ?? ""} onChange={(e) => set("challan_nos", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className={dispLabel}>Dispatched through</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.dispatched_through ?? ""} onChange={(e) => set("dispatched_through", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className={dispLabel}>Destination</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.destination ?? ""} onChange={(e) => set("destination", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className={dispLabel}>Carrier Name/Agent</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.carrier_name ?? ""} onChange={(e) => set("carrier_name", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <span className={dispLabel}>Bill of Lading/LR-RR No.</span>
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
              <span className={dispLabel}>Motor Vehicle No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input type="text" className={inputCls} value={form.motor_vehicle_no ?? ""} onChange={(e) => set("motor_vehicle_no", e.target.value)} />
            </div>
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
