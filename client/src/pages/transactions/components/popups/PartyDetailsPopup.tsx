import { useState, useEffect, useCallback } from "react";
import { INDIAN_STATES } from "../../../../constants/states";
import LedgerListPanel from "../LedgerListPanel";

export interface PartyDetails {
  supplier_name?: string;
  mailing_name?: string;
  address?: string;
  state?: string;
  country?: string;
}

interface Props {
  partyLedger: any;
  allLedgers: any[];
  initialDetails?: PartyDetails | null;
  onClose: () => void;
  onSave: (details: PartyDetails) => void;
  onCreateLedger: () => void;
}

export default function PartyDetailsPopup({
  partyLedger,
  allLedgers,
  initialDetails,
  onClose,
  onSave,
  onCreateLedger,
}: Props) {
  const [form, setForm] = useState<PartyDetails>({
    supplier_name: initialDetails?.supplier_name ?? partyLedger?.name ?? "",
    mailing_name: initialDetails?.mailing_name ?? partyLedger?.mailing_name ?? partyLedger?.name ?? "",
    address: initialDetails?.address ?? [partyLedger?.address1, partyLedger?.address2, partyLedger?.city, partyLedger?.pincode].filter(Boolean).join("\n") ?? "",
    state: initialDetails?.state ?? partyLedger?.state ?? "",
    country: initialDetails?.country ?? partyLedger?.country ?? "",
  });

  const [showLedgerPanel, setShowLedgerPanel] = useState(false);
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");

  const set = (field: keyof PartyDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
  };

  const handleLedgerSelect = useCallback(
    (item: any) => {
      set("supplier_name", item.name);
      set("mailing_name", item.mailing_name || item.name);
      set("address", [item.address1, item.address2, item.city, item.pincode].filter(Boolean).join("\n"));
      set("state", item.state || "");
      set("country", item.country || "");
      setShowLedgerPanel(false);
      setLedgerSearchTerm("");
    },
    []
  );

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
        <div className="bg-white border border-black shadow-xl w-[520px] flex flex-col">
          {/* Header */}
          <div className="bg-black text-white px-3 py-1 flex justify-between items-center select-none">
            <span className="text-sm font-bold">Party Details</span>
            <button onClick={onClose} className="text-white hover:text-gray-300 font-bold text-sm leading-none">
              &times;
            </button>
          </div>

          {/* Form Content */}
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-36 text-sm text-black shrink-0">Supplier (Bill from)</span>
              <span className="text-sm text-black shrink-0">:</span>
              <input
                type="text"
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black bg-yellow-50"
                value={form.supplier_name ?? ""}
                onChange={(e) => set("supplier_name", e.target.value)}
                onFocus={() => { setShowLedgerPanel(true); setLedgerSearchTerm(""); }}
                autoFocus
              />
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
                className="flex-1 text-sm border border-gray-400 px-1 py-0 outline-none focus:border-black resize-none h-20"
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
                {INDIAN_STATES.map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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
