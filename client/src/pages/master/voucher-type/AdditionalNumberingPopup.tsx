import type {
  NumberingRestartRow,
  NumberingAffixRow,
} from "@/types/entities/VoucherType";

// "Set/Alter additional numbering details" sub-screen (Voucher Type, issue #143).
// Matches TallyPrime's Voucher Type Creation (Secondary): Starting Number,
// Width of Numerical Part, Prefill with zero + Restart Numbering / Prefix /
// Suffix detail tables. Strict black/white/zinc theme.

const inputCls =
  "w-full bg-transparent text-[12px] font-mono text-zinc-950 outline-none py-1 px-1.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const cellCls =
  "w-full bg-transparent text-[12px] text-zinc-950 font-mono outline-none py-1 px-1.5 border border-transparent focus:border-zinc-400 transition-colors";

const EMPTY_RESTART: NumberingRestartRow = { applicable_from: "", starting_number: 1, particulars: "" };
const EMPTY_AFFIX: NumberingAffixRow = { applicable_from: "", particulars: "" };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[30px]">
      <span className="w-52 text-[12px] text-zinc-600 shrink-0 select-none">{label}</span>
      <span className="text-zinc-400 mr-2 select-none">:</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function YesNoSelect({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <select
      className="bg-transparent text-[12px] font-mono outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded w-20"
      value={value ? "Yes" : "No"}
      onChange={(e) => onChange(e.target.value === "Yes")}
    >
      <option>Yes</option>
      <option>No</option>
    </select>
  );
}

function RestartTable({
  rows,
  onChange,
}: {
  rows: NumberingRestartRow[];
  onChange: (rows: NumberingRestartRow[]) => void;
}) {
  const all = [...rows, { ...EMPTY_RESTART }];
  const setCell = (i: number, patch: Partial<NumberingRestartRow>) => {
    const next = all.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next.filter((r) => r.applicable_from.trim() || r.particulars.trim()));
  };
  const removeAt = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div className="border border-zinc-200 rounded overflow-hidden">
      <div className="bg-zinc-50 px-3 py-1.5 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-600">
        Restart Numbering
      </div>
      <div className="grid grid-cols-[1fr_1fr_1.4fr_28px] bg-zinc-100 border-b border-zinc-200 text-[11px] font-bold text-zinc-600">
        <div className="py-1.5 px-1.5 border-r border-zinc-200">Applicable From</div>
        <div className="py-1.5 px-1.5 border-r border-zinc-200">Starting Number</div>
        <div className="py-1.5 px-1.5 border-r border-zinc-200">Periodicity</div>
        <div className="py-1.5 px-1.5" />
      </div>
      {all.map((r, i) => {
        const isBlank = i === all.length - 1;
        return (
          <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_28px] border-b border-zinc-100 items-center">
            <input type="date" className={`${cellCls} border-r border-zinc-100`} value={r.applicable_from}
              onChange={(e) => setCell(i, { applicable_from: e.target.value })} />
            <input type="number" className={`${cellCls} border-r border-zinc-100`} value={r.starting_number}
              onChange={(e) => setCell(i, { starting_number: Number(e.target.value) })} />
            <input className={`${cellCls} border-r border-zinc-100`} value={r.particulars}
              placeholder={isBlank ? "e.g. Yearly" : ""}
              onChange={(e) => setCell(i, { particulars: e.target.value })} />
            <button onClick={() => !isBlank && removeAt(i)}
              className={`text-sm font-bold leading-none ${isBlank ? "text-transparent cursor-default" : "text-zinc-300 hover:text-zinc-900"}`}
              title="Remove">&times;</button>
          </div>
        );
      })}
      <div className="px-3 py-1 text-[11px] text-zinc-400 italic font-sans select-none">End of List</div>
    </div>
  );
}

function AffixTable({
  title,
  rows,
  onChange,
}: {
  title: string;
  rows: NumberingAffixRow[];
  onChange: (rows: NumberingAffixRow[]) => void;
}) {
  const all = [...rows, { ...EMPTY_AFFIX }];
  const setCell = (i: number, patch: Partial<NumberingAffixRow>) => {
    const next = all.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next.filter((r) => r.applicable_from.trim() || r.particulars.trim()));
  };
  const removeAt = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div className="border border-zinc-200 rounded overflow-hidden">
      <div className="bg-zinc-50 px-3 py-1.5 border-b border-zinc-200 font-bold text-[11px] uppercase tracking-wider text-zinc-600">
        {title}
      </div>
      <div className="grid grid-cols-[1fr_1.6fr_28px] bg-zinc-100 border-b border-zinc-200 text-[11px] font-bold text-zinc-600">
        <div className="py-1.5 px-1.5 border-r border-zinc-200">Applicable From</div>
        <div className="py-1.5 px-1.5 border-r border-zinc-200">Particulars</div>
        <div className="py-1.5 px-1.5" />
      </div>
      {all.map((r, i) => {
        const isBlank = i === all.length - 1;
        return (
          <div key={i} className="grid grid-cols-[1fr_1.6fr_28px] border-b border-zinc-100 items-center">
            <input type="date" className={`${cellCls} border-r border-zinc-100`} value={r.applicable_from}
              onChange={(e) => setCell(i, { applicable_from: e.target.value })} />
            <input className={`${cellCls} border-r border-zinc-100`} value={r.particulars}
              onChange={(e) => setCell(i, { particulars: e.target.value })} />
            <button onClick={() => !isBlank && removeAt(i)}
              className={`text-sm font-bold leading-none ${isBlank ? "text-transparent cursor-default" : "text-zinc-300 hover:text-zinc-900"}`}
              title="Remove">&times;</button>
          </div>
        );
      })}
      <div className="px-3 py-1 text-[11px] text-zinc-400 italic font-sans select-none">End of List</div>
    </div>
  );
}

export interface AdditionalNumberingValue {
  starting_number: number;
  width_of_numerical_part: number;
  prefill_with_zero: boolean;
  restart_numbering: NumberingRestartRow[];
  prefix_details: NumberingAffixRow[];
  suffix_details: NumberingAffixRow[];
}

export default function AdditionalNumberingPopup({
  value,
  onChange,
  onClose,
}: {
  value: AdditionalNumberingValue;
  onChange: (patch: Partial<AdditionalNumberingValue>) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white border border-zinc-300 shadow-xl w-[640px] max-h-[90vh] overflow-y-auto rounded"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-900 text-white px-3 py-2 flex justify-between items-center">
          <span className="font-bold text-sm">Voucher Numbering — Additional Details</span>
          <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-sm">&times;</button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Field label="Starting Number">
              <input type="number" className={`${inputCls} w-32`} value={value.starting_number}
                onChange={(e) => onChange({ starting_number: Number(e.target.value) })} />
            </Field>
            <Field label="Width of Numerical Part">
              <input type="number" className={`${inputCls} w-32`} value={value.width_of_numerical_part}
                onChange={(e) => onChange({ width_of_numerical_part: Number(e.target.value) })} />
            </Field>
            <Field label="Prefill with zero">
              <YesNoSelect value={value.prefill_with_zero} onChange={(v) => onChange({ prefill_with_zero: v })} />
            </Field>
          </div>

          <RestartTable rows={value.restart_numbering} onChange={(restart_numbering) => onChange({ restart_numbering })} />
          <AffixTable title="Prefix Details" rows={value.prefix_details} onChange={(prefix_details) => onChange({ prefix_details })} />
          <AffixTable title="Suffix Details" rows={value.suffix_details} onChange={(suffix_details) => onChange({ suffix_details })} />
        </div>

        <div className="border-t border-zinc-200 px-4 py-3 flex justify-end bg-zinc-50">
          <button onClick={onClose}
            className="text-sm px-6 py-1.5 rounded bg-black text-white hover:bg-zinc-800 transition-colors font-medium font-sans">
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
