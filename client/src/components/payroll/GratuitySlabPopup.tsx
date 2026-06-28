import Modal from "@/components/ui/Modal";
import { FormRow } from "@/components/ui";

const inputCls = "w-full bg-transparent text-sm outline-none px-1.5 py-0.5 border border-zinc-200 hover:border-zinc-400 focus:border-zinc-800 transition-colors bg-white rounded";

export interface GratuitySlab {
  months_from: number;
  months_to: number;
  eligibility_days: number;
}

interface Props {
  open: boolean;
  gratuityDaysPerMonth: number;
  slabs: GratuitySlab[];
  onDaysChange: (v: number) => void;
  onSlabsChange: (next: GratuitySlab[]) => void;
  onClose: () => void;
}

export default function GratuitySlabPopup({
  open, gratuityDaysPerMonth, slabs, onDaysChange, onSlabsChange, onClose,
}: Props) {
  const num = (v: string) => (v === "" ? 0 : Number(v));

  const updateSlab = (i: number, field: keyof GratuitySlab, v: number) => {
    const next = slabs.map((s, idx) => (idx === i ? { ...s, [field]: v } : s));
    onSlabsChange(next);
  };

  const addSlab = () => {
    const prevTo = slabs.length > 0 ? slabs[slabs.length - 1].months_to : 0;
    onSlabsChange([...slabs, { months_from: prevTo + 1, months_to: prevTo + 1, eligibility_days: 0 }]);
  };

  const deleteSlab = (i: number) => onSlabsChange(slabs.filter((_, idx) => idx !== i));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Slab Rate details for Gratuity Calculation"
      width="w-[560px]"
      footer={
        <button
          onClick={onClose}
          className="px-3 py-1 text-xs font-semibold bg-zinc-900 text-white border border-zinc-900 hover:bg-zinc-700"
        >
          Accept
        </button>
      }
    >
      <div className="space-y-3">
        <FormRow label="Gratuity Days of a Month" labelWidth="w-52" className="flex items-center min-h-[26px]">
          <input
            type="number"
            step="0.01"
            className={`${inputCls} text-right max-w-[120px]`}
            value={gratuityDaysPerMonth}
            onChange={e => onDaysChange(num(e.target.value))}
          />
        </FormRow>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-300">
              <th colSpan={2} className="text-center font-bold py-1 border-r border-zinc-200">Number of Months</th>
              <th rowSpan={2} className="text-right font-bold py-1 px-1.5 align-bottom">Eligibility days for Gratuity Calculation per year</th>
              <th rowSpan={2} className="w-8"></th>
            </tr>
            <tr className="border-b border-zinc-300">
              <th className="text-left font-bold py-1 px-1.5">From</th>
              <th className="text-left font-bold py-1 px-1.5 border-r border-zinc-200">To</th>
            </tr>
          </thead>
          <tbody>
            {slabs.map((s, i) => (
              <tr key={i} className="border-b border-zinc-100">
                <td className="py-0.5 px-1">
                  <input
                    type="number"
                    className={`${inputCls} text-right max-w-[80px] bg-zinc-50`}
                    value={s.months_from}
                    readOnly
                  />
                </td>
                <td className="py-0.5 px-1">
                  <input
                    type="number"
                    className={`${inputCls} text-right max-w-[80px]`}
                    value={s.months_to}
                    onChange={e => updateSlab(i, "months_to", num(e.target.value))}
                  />
                </td>
                <td className="py-0.5 px-1">
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputCls} text-right max-w-[120px]`}
                    value={s.eligibility_days}
                    onChange={e => updateSlab(i, "eligibility_days", num(e.target.value))}
                  />
                </td>
                <td className="py-0.5 px-1 text-center">
                  <button
                    onClick={() => deleteSlab(i)}
                    className="text-zinc-400 hover:text-zinc-900 text-sm leading-none"
                    aria-label="Delete slab"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
            {slabs.length === 0 && (
              <tr><td colSpan={4} className="py-2 text-center text-zinc-400">No slabs defined.</td></tr>
            )}
          </tbody>
        </table>

        <button
          onClick={addSlab}
          className="px-2 py-1 text-xs font-semibold bg-white text-zinc-900 border border-zinc-900 hover:bg-zinc-100"
        >
          + Add Slab
        </button>
      </div>
    </Modal>
  );
}
