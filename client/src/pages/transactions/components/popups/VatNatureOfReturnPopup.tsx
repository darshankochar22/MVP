import { useState } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";

export interface VatNatureOfReturn {
  nature_of_return?: string;
}

const NOT_APPLICABLE = "♦ Not Applicable";

const NATURE_OPTIONS = [
  NOT_APPLICABLE,
  "Goods Return",
  "Rate Difference",
  "Discount",
  "Other Adjustments",
  "Others",
];

// "Not Applicable" is a display-only sentinel: it is never persisted (saved
// as "") and loaded ""/legacy-sentinel values map back to the display default.
const toDisplayNature = (v?: string | null) =>
  !v || v.includes("Not Applicable") ? NOT_APPLICABLE : v;
const toSavedNature = (v?: string | null) =>
  !v || v.includes("Not Applicable") ? "" : v;

interface Props {
  initialDetails?: { nature_of_return?: string } | null;
  onClose: () => void;
  onSave: (details: VatNatureOfReturn) => void;
}

export default function VatNatureOfReturnPopup({ initialDetails, onClose, onSave }: Props) {
  const [form, setForm] = useState<VatNatureOfReturn>({
    nature_of_return: toDisplayNature(initialDetails?.nature_of_return),
  });

  const handleSave = () => onSave({ nature_of_return: toSavedNature(form.nature_of_return) });

  return (
    <VoucherPopupShell title="Additional Details" onClose={onClose} onAccept={handleSave}>
      <div className="max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="w-40 text-sm text-black shrink-0">Nature of Return</span>
          <span className="text-sm text-black shrink-0">:</span>
          <select
            className="w-72 shrink-0 text-sm bg-white border border-gray-400 px-2 py-1 outline-none focus:border-black"
            value={form.nature_of_return ?? ""}
            onChange={(e) => setForm({ nature_of_return: e.target.value })}
            autoFocus
          >
            {NATURE_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      </div>
    </VoucherPopupShell>
  );
}
