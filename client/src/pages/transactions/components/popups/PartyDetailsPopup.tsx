import { useState, useEffect, useCallback } from "react";
import { INDIAN_STATES } from "../../../../constants/states";
import LedgerListPanel from "../LedgerListPanel";

export interface PartyDetails {
  supplier_name?: string;
  mailing_name?: string;
  address?: string;
  address_type?: string;
  state?: string;
  country?: string;
  gst_registration_type?: string;
  gstin?: string;
  nature_of_return?: string;
  place_of_supply?: string;
}

interface Props {
  partyLedger: any;
  allLedgers: any[];
  initialDetails?: PartyDetails | null;
  onClose: () => void;
  onSave: (details: PartyDetails) => void;
  onCreateLedger: () => void;
  buyerLabel?: string;
  /** Pass e.g. "Nature of Sales Return" for Credit Note, "Nature of Purchase Return" for
   *  Debit Note. Leave undefined for Sales/Purchase — the field will be hidden. */
  natureOfReturnLabel?: string;
}

const GST_REGISTRATION_TYPES = [
  "Regular",
  "Composition",
  "Unregistered",
  "Consumer",
  "Overseas",
  "Special Economic Zone",
  "Deemed Export",
  "UIN Holders",
];

export default function PartyDetailsPopup({
  partyLedger,
  allLedgers,
  initialDetails,
  onClose,
  onSave,
  onCreateLedger,
  buyerLabel = "Supplier (Bill from)",
  natureOfReturnLabel,
}: Props) {
  const [form, setForm] = useState<PartyDetails>({
    supplier_name: initialDetails?.supplier_name ?? partyLedger?.name ?? "",
    mailing_name: initialDetails?.mailing_name ?? partyLedger?.mailing_name ?? partyLedger?.name ?? "",
    address: initialDetails?.address ?? [partyLedger?.address1, partyLedger?.address2, partyLedger?.city, partyLedger?.pincode].filter(Boolean).join("\n") ?? "",
    address_type: initialDetails?.address_type ?? "Primary",
    state: initialDetails?.state ?? partyLedger?.state ?? "",
    country: initialDetails?.country ?? partyLedger?.country ?? "India",
    gst_registration_type: initialDetails?.gst_registration_type ?? partyLedger?.gst_registration_type ?? "Regular",
    gstin: initialDetails?.gstin ?? partyLedger?.gstin ?? "",
    nature_of_return: initialDetails?.nature_of_return ?? "",
    place_of_supply: initialDetails?.place_of_supply ?? partyLedger?.state ?? "",
  });

  const [showLedgerPanel, setShowLedgerPanel] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");

  const set = (field: keyof PartyDetails, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // keep Place of Supply synced to State unless the user already diverged it
      if (field === "state" && (!prev.place_of_supply || prev.place_of_supply === prev.state)) {
        next.place_of_supply = value;
      }
      return next;
    });
  };

  const handleSave = () => onSave(form);

  const handleLedgerSelect = useCallback((item: any) => {
    set("supplier_name", item.name);
    set("mailing_name", item.mailing_name || item.name);
    set("address", [item.address1, item.address2, item.city, item.pincode].filter(Boolean).join("\n"));
    set("state", item.state || "");
    set("country", item.country || "India");
    set("gstin", item.gstin || "");
    set("gst_registration_type", item.gst_registration_type || "Regular");
    setShowLedgerPanel(false);
    setLedgerSearchTerm("");
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showLedgerPanel) return;
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.altKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, showLedgerPanel]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 flex items-center justify-center bg-black/50">
        <div className="bg-white border border-black shadow-xl w-[560px] flex flex-col">
          <div className="bg-black text-white px-3 py-1 flex justify-between items-center select-none">
            <span className="text-sm font-bold">Party Details</span>
            <button onClick={onClose} className="text-white hover:text-gray-300 font-bold text-sm leading-none">&times;</button>
          </div>

          <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
            {natureOfReturnLabel && (
              <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
                <span className="w-44 text-sm text-black shrink-0">{natureOfReturnLabel}</span>
                <span className="text-sm text-black shrink-0">:</span>
                <input
                  type="text"
                  className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
                  value={form.nature_of_return ?? ""}
                  onChange={(e) => set("nature_of_return", e.target.value)}
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">{buyerLabel}</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
                value={form.supplier_name ?? ""}
                onChange={(e) => set("supplier_name", e.target.value)}
                onFocus={() => { setShowLedgerPanel(true); setLedgerSearchTerm(""); }}
                autoFocus={!natureOfReturnLabel}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">Address Type</span>
              <span className="text-sm text-black shrink-0">:</span>
              <select
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-white"
                value={form.address_type ?? "Primary"}
                onChange={(e) => set("address_type", e.target.value)}
              >
                <option value="Primary">♦ Primary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">Mailing Name</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.mailing_name ?? ""}
                onChange={(e) => set("mailing_name", e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2">
              <span className="w-36 text-sm text-black shrink-0 pt-0.5">Address</span>
              <span className="text-sm text-black shrink-0 pt-0.5">:</span>
              <textarea
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black resize-none h-16"
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">State</span>
              <span className="text-sm text-black shrink-0">:</span>
              <select
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-white"
                value={form.state ?? ""}
                onChange={(e) => set("state", e.target.value)}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">Country</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black"
                value={form.country ?? ""}
                onChange={(e) => set("country", e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <span className="w-36 text-sm text-black shrink-0">GST Registration type</span>
              <span className="text-sm text-black shrink-0">:</span>
              <select
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-white"
                value={form.gst_registration_type ?? "Regular"}
                onChange={(e) => set("gst_registration_type", e.target.value)}
              >
                {GST_REGISTRATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">GSTIN/UIN</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black uppercase"
                value={form.gstin ?? ""}
                onChange={(e) => set("gstin", e.target.value.toUpperCase())}
                maxLength={15}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <span className="w-36 text-sm text-black shrink-0">Place of Supply</span>
              <span className="text-sm text-black shrink-0">:</span>
              <select
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-white"
                value={form.place_of_supply ?? ""}
                onChange={(e) => set("place_of_supply", e.target.value)}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((s: string) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
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

      {showLedgerPanel && (
        <LedgerListPanel
          title="List of Ledger Accounts"
          items={allLedgers}
          searchTerm={ledgerSearchTerm}
          onSearchChange={setLedgerSearchTerm}
          onSelect={handleLedgerSelect}
          onClose={() => { setShowLedgerPanel(false); setLedgerSearchTerm(""); }}
          onCreateNew={onCreateLedger}
          createLabel="Create"
          height="h-screen"
        />
      )}
    </div>
  );
}