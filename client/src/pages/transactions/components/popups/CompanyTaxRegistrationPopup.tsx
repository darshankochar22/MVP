import { useEffect, useState } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";

interface RegistrationOption {
  key: string;
  label: string;
  taxRegNo: string;
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

// Standard GST state codes (GSTIN first two digits). Used to translate a
// numeric `state_id` (legacy/seeded rows store the FK/GST code, newer rows
// store the human state name directly) into a display name.
const GST_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli and Daman & Diu",
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

// Prefer a human-readable state name: use any non-numeric candidate as-is,
// map numeric codes through GST_STATE_CODES, and finally fall back to the
// GSTIN's two-digit state prefix.
function resolveStateName(r: any): string {
  for (const c of [r.state_name, r.state, r.state_id]) {
    if (c === null || c === undefined) continue;
    const s = String(c).trim();
    if (!s) continue;
    if (!/^\d+$/.test(s)) return s;
    const mapped = GST_STATE_CODES[s.padStart(2, "0")];
    if (mapped) return mapped;
  }
  const gstin = String(r.gstin ?? "").trim();
  if (gstin.length >= 2) return GST_STATE_CODES[gstin.slice(0, 2)] ?? "";
  return "";
}

export default function CompanyTaxRegistrationPopup({
  gstRegistrations,
  taxUnits,
  onClose,
  onSelect,
}: Props) {
  const options: RegistrationOption[] = [
    ...gstRegistrations.map((r: any) => {
      const state = resolveStateName(r);
      return {
        key: `gst-${r.gst_id}`,
        label: state
          ? `${state} Registration`
          : (r.legal_name ?? r.trade_name ?? r.name ?? `Registration #${r.gst_id}`),
        taxRegNo: r.gstin ?? "",
        taxType: "GST",
        state,
        kind: "gst" as const,
        raw: r,
      };
    }),
    ...taxUnits.map((t: any) => ({
      key: `tax-${t.tax_unit_id}`,
      label: t.name ?? "",
      taxRegNo: t.ecc_number ?? t.registration_no ?? "",
      taxType: t.registered_for ?? "Excise",
      state: t.state ?? "",
      kind: "tax" as const,
      raw: t,
    })),
  ];

  // Keyboard navigation: row 0 = "Not Applicable", rows 1..n = registrations.
  const [highlighted, setHighlighted] = useState(0);
  const rowCount = options.length + 1;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((i) => Math.min(i + 1, rowCount - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(highlighted === 0 ? null : options[highlighted - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowCount, highlighted, gstRegistrations, taxUnits, onSelect]);

  const rowCls = (active: boolean) =>
    `flex px-2 py-1.5 text-sm cursor-pointer border-b border-gray-200 ${
      active ? "bg-gray-200" : "hover:bg-gray-100"
    }`;

  return (
    <VoucherPopupShell title="Change Company/Tax Registration" onClose={onClose}>
      <div className="max-w-3xl">
        {/* Column headers */}
        <div className="flex text-xs font-bold text-black bg-gray-100 border-b border-gray-400 px-2 py-1.5">
          <div className="w-[260px] shrink-0">Name</div>
          <div className="w-[180px] shrink-0">Tax Registration No.</div>
          <div className="w-[100px] shrink-0">Tax Type</div>
          <div className="w-[160px] shrink-0">State</div>
        </div>

        {/* Not Applicable */}
        <div
          className={rowCls(highlighted === 0)}
          onMouseEnter={() => setHighlighted(0)}
          onClick={() => onSelect(null)}
        >
          <div className="w-[260px] shrink-0">♦ Not Applicable</div>
          <div className="w-[180px] shrink-0" />
          <div className="w-[100px] shrink-0" />
          <div className="w-[160px] shrink-0" />
        </div>

        {/* Registration rows */}
        {options.map((opt, idx) => (
          <div
            key={opt.key}
            className={rowCls(highlighted === idx + 1)}
            onMouseEnter={() => setHighlighted(idx + 1)}
            onClick={() => onSelect(opt)}
          >
            <div className="w-[260px] shrink-0 truncate text-black">{opt.label}</div>
            <div className="w-[180px] shrink-0 italic text-gray-600 truncate">{opt.taxRegNo}</div>
            <div className="w-[100px] shrink-0 italic text-gray-600">{opt.taxType}</div>
            <div className="w-[160px] shrink-0 text-gray-600 truncate">{opt.state}</div>
          </div>
        ))}
      </div>
    </VoucherPopupShell>
  );
}
