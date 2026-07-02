import { useState, useEffect } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";

export interface CreditNoteDetails {
  tracking_no?: string;
  // NOTE: legacy key names. For a Credit Note these fields describe the RECEIPT
  // side (goods coming back in) and are labelled "Receipt Doc No." /
  // "Received through" in the UI — but the stored keys stay dispatch_* because
  // they map 1:1 to existing server columns. Do not rename.
  dispatch_doc_no?: string;
  dispatched_through?: string;
  destination?: string;
  carrier_name?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
  original_invoice_no?: string;
  original_invoice_date?: string;
}

interface Props {
  initialDetails?: CreditNoteDetails | null;
  onClose: () => void;
  onSave: (details: CreditNoteDetails) => void;
}

export default function CreditNoteDetailsPopup({
  initialDetails,
  onClose,
  onSave,
}: Props) {
  const buildForm = (d?: CreditNoteDetails | null): CreditNoteDetails => ({
    tracking_no: d?.tracking_no ?? "",
    dispatch_doc_no: d?.dispatch_doc_no ?? "",
    dispatched_through: d?.dispatched_through ?? "",
    destination: d?.destination ?? "",
    carrier_name: d?.carrier_name ?? "",
    bill_of_lading_no: d?.bill_of_lading_no ?? "",
    bill_of_lading_date: d?.bill_of_lading_date ?? "",
    motor_vehicle_no: d?.motor_vehicle_no ?? "",
    original_invoice_no: d?.original_invoice_no ?? "",
    original_invoice_date: d?.original_invoice_date ?? "",
  });

  const [form, setForm] = useState<CreditNoteDetails>(() => buildForm(initialDetails));

  // Re-sync when the caller supplies a new initialDetails reference while the
  // popup stays mounted (e.g. voucher hydration arriving after open).
  useEffect(() => {
    setForm(buildForm(initialDetails));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialDetails]);

  const set = (field: keyof CreditNoteDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <VoucherPopupShell
      title="Receipt Details"
      onClose={onClose}
      onAccept={handleSave}
    >
      <div className="max-w-3xl">
        {/* Two-column layout matching Tally */}
        <div className="flex gap-8">
          {/* Left column */}
          <div className="w-56 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-black shrink-0">Tracking No(s)</span>
              <span className="text-sm text-black shrink-0">:</span>
            </div>
            <input
              type="text"
              className="w-full text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
              value={form.tracking_no ?? ""}
              onChange={(e) => set("tracking_no", e.target.value)}
              autoFocus
            />
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Receipt Doc No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.dispatch_doc_no ?? ""}
                onChange={(e) => set("dispatch_doc_no", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Received through</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.dispatched_through ?? ""}
                onChange={(e) => set("dispatched_through", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Destination</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.destination ?? ""}
                onChange={(e) => set("destination", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Carrier Name/Agent</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.carrier_name ?? ""}
                onChange={(e) => set("carrier_name", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Bill of Lading/LR-RR No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.bill_of_lading_no ?? ""}
                onChange={(e) => set("bill_of_lading_no", e.target.value)}
              />
              <span className="text-sm text-black shrink-0">Date</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="date"
                className="w-36 shrink-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.bill_of_lading_date ?? ""}
                onChange={(e) => set("bill_of_lading_date", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-48 text-right text-sm text-black shrink-0">Motor Vehicle No.</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 min-w-0 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
                value={form.motor_vehicle_no ?? ""}
                onChange={(e) => set("motor_vehicle_no", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section: Original Invoice Details */}
        <div className="mt-6 pb-1 border-b border-gray-400 select-none">
          <span className="text-sm font-bold text-black">Original Invoice Details</span>
        </div>

        <div className="pt-4 flex gap-6">
          <div className="w-1/2 flex items-center gap-2">
            <span className="text-sm text-black shrink-0">Original Invoice No.</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="text"
              className="flex-1 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
              value={form.original_invoice_no ?? ""}
              onChange={(e) => set("original_invoice_no", e.target.value)}
            />
          </div>
          <div className="w-1/2 flex items-center gap-2">
            <span className="w-16 text-sm text-black shrink-0">Date</span>
            <span className="text-sm text-black shrink-0">:</span>
            <input
              type="date"
              className="flex-1 text-sm border border-gray-400 px-2 py-1 outline-none focus:border-black bg-white"
              value={form.original_invoice_date ?? ""}
              onChange={(e) => set("original_invoice_date", e.target.value)}
            />
          </div>
        </div>
      </div>
    </VoucherPopupShell>
  );
}
