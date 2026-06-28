import { FormRow } from "@/components/ui";
import {
  type PlaOpeningBalance,
  type PlaOpeningBalanceLine,
  DEFAULT_PLA_LINE,
} from "@/types/entities/PlaOpeningBalance";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const selectCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const dateCls =
  "w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const noCls =
  "w-24 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-56";

export function PlaOpeningBalanceForm({
  form,
  setField,
  gstRegistrationOptions = [],
  taxUnitOptions = [],
  firstFieldAutoFocus = false,
}: {
  form: PlaOpeningBalance;
  setField: <K extends keyof PlaOpeningBalance>(key: K, value: PlaOpeningBalance[K]) => void;
  gstRegistrationOptions?: string[];
  taxUnitOptions?: string[];
  firstFieldAutoFocus?: boolean;
}) {
  // Always render the saved lines plus a blank trailing row to add a new entry.
  const rows: PlaOpeningBalanceLine[] = [...form.lines, { ...DEFAULT_PLA_LINE }];

  const updateLine = (index: number, patch: Partial<PlaOpeningBalanceLine>) => {
    const next = [...form.lines];
    if (index < next.length) {
      next[index] = { ...next[index], ...patch };
    } else {
      next.push({ ...DEFAULT_PLA_LINE, ...patch });
    }
    setField("lines", next);
  };

  const removeLine = (index: number) => {
    if (index >= form.lines.length) return;
    const next = form.lines.filter((_, i) => i !== index);
    setField("lines", next);
  };

  const total = form.lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[1000px] w-full">
        {/* ── Voucher header band ── */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-zinc-800 border border-zinc-800 px-2 py-0.5">
              Journal
            </span>
            <FormRow label="No." labelWidth="w-10" className="flex items-center min-h-[26px]">
              <input
                autoFocus={firstFieldAutoFocus}
                className={noCls}
                value={form.voucherNo}
                onChange={(e) => setField("voucherNo", e.target.value)}
              />
            </FormRow>
          </div>

          <FormRow label="Date" labelWidth="w-12" className="flex items-center min-h-[26px]">
            <input
              type="date"
              className={dateCls}
              value={form.voucherDate}
              onChange={(e) => setField("voucherDate", e.target.value)}
            />
          </FormRow>
        </div>

        {/* ── Header fields ── */}
        <FormRow label="GST Registration" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.gstRegistration}
            onChange={(e) => setField("gstRegistration", e.target.value)}
          >
            <option value="" />
            {gstRegistrationOptions.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </FormRow>

        <FormRow label="Tax Unit" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <select
            className={selectCls}
            value={form.taxUnit}
            onChange={(e) => setField("taxUnit", e.target.value)}
          >
            <option>Not Applicable</option>
            {taxUnitOptions.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </FormRow>

        <FormRow label="Status" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
          <span className="text-sm font-bold text-zinc-800 px-1.5">{form.status}</span>
        </FormRow>

        {/* ── Ledger entry grid ── */}
        <div className="mt-6 border-t border-zinc-300">
          <div className="flex items-center bg-white border-b border-zinc-300 text-xs font-bold text-zinc-800">
            <div className="flex-1 px-2 py-1.5">Particulars</div>
            <div className="w-44 px-2 py-1.5 text-right">Amount</div>
            <div className="w-8" />
          </div>

          {rows.map((line, i) => {
            const isBlankTrailing = i === form.lines.length;
            return (
              <div
                key={i}
                className="flex items-center border-b border-zinc-100 hover:bg-zinc-50"
              >
                <div className="flex-1 px-2 py-0.5">
                  <input
                    className="w-full bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded"
                    placeholder={isBlankTrailing ? "Add ledger…" : ""}
                    value={line.particulars}
                    onChange={(e) => updateLine(i, { particulars: e.target.value })}
                  />
                </div>
                <div className="w-44 px-2 py-0.5">
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded text-right"
                    value={Number(line.amount) || (isBlankTrailing ? "" : 0)}
                    onChange={(e) => updateLine(i, { amount: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="w-8 px-1 text-center">
                  {!isBlankTrailing && (
                    <button
                      type="button"
                      onClick={() => removeLine(i)}
                      className="text-zinc-400 hover:text-zinc-800 text-sm font-bold leading-none"
                      title="Remove line"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Total row — bold + 1px black top border, no fill, no colour */}
          <div className="flex items-center border-t border-black text-sm font-bold text-zinc-900">
            <div className="flex-1 px-2 py-1.5">Total</div>
            <div className="w-44 px-2 py-1.5 text-right">
              {total ? total.toFixed(2) : ""}
            </div>
            <div className="w-8" />
          </div>
        </div>

        {/* ── Narration ── */}
        <div className="mt-6">
          <FormRow label="Narration" labelWidth="w-24" className="flex items-start min-h-[26px]">
            <textarea
              rows={2}
              className="flex-1 w-full bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded resize-none"
              value={form.narration}
              onChange={(e) => setField("narration", e.target.value)}
            />
          </FormRow>
        </div>
      </div>
      <div className="flex-1" />
    </div>
  );
}
