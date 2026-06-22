// components/popups/CompanyTaxRegistrationPopup.tsx
interface RegistrationOption {
  key: string;
  label: string;
  taxType: string;
  state: string;
  kind: "gst" | "tax";
  raw: any;
}

interface Props {
  gstRegistrations: any[];
  taxUnits: any[];
  onClose: () => void;
  onSelect: (opt: RegistrationOption | null) => void;
}

export default function CompanyTaxRegistrationPopup({
  gstRegistrations,
  taxUnits,
  onClose,
  onSelect,
}: Props) {
  const options: RegistrationOption[] = [
    ...gstRegistrations.map((r: any) => ({
      key: `gst-${r.gst_id}`,
      label: r.name ?? r.legal_name ?? r.trade_name ?? r.gstin ?? `Registration #${r.gst_id}`,
      taxType: "GST",
      state: r.state ?? r.state_id ?? "",
      kind: "gst" as const,
      raw: r,
    })),
    ...taxUnits.map((t: any) => ({
      key: `tax-${t.tax_unit_id}`,
      label: t.name,
      taxType: t.registered_for || "Excise",
      state: t.state ?? "",
      kind: "tax" as const,
      raw: t,
    })),
  ];
  

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 pt-24">
      <div className="w-[700px] bg-white border border-gray-400 shadow-xl">
        <div className="bg-blue-700 text-white text-sm font-semibold px-3 py-1 flex justify-between items-center">
          <span>Change Company/Tax Registration</span>
          <button onClick={onClose} className="text-white hover:opacity-70">✕</button>
        </div>

        <div className="bg-blue-50 px-3 py-1 border-b border-gray-300">
          <div className="flex text-sm font-semibold text-black bg-blue-700 text-white px-2 py-1">
            <div className="flex-1">Name</div>
            <div className="w-32">Tax Registration No.</div>
            <div className="w-20">Tax Type</div>
            <div className="w-32">State</div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div
            className="px-2 py-1 text-sm hover:bg-orange-200 cursor-pointer border-b border-gray-100"
            onClick={() => onSelect(null)}
          >
            ♦ Not Applicable
          </div>
          {options.map((opt) => (
            <div
              key={opt.key}
              className="flex px-2 py-1 text-sm hover:bg-orange-200 cursor-pointer border-b border-gray-100"
              onClick={() => onSelect(opt)}
            >
              <div className="flex-1">{opt.label}</div>
              <div className="w-32 italic text-zinc-600">{opt.raw.gstin ?? opt.raw.ecc_number ?? ""}</div>
              <div className="w-20 italic text-zinc-600">{opt.taxType}</div>
              <div className="w-32 text-zinc-600">{opt.state}</div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-300 px-3 py-1 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs border border-gray-400 px-3 py-1 hover:bg-gray-100"
          >
            Esc: Cancel
          </button>
        </div>
      </div>
    </div>
  );
}