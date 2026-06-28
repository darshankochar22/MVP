import { useEffect, useState } from "react";
import { FormRow } from "@/components/ui";
import {
  type ExciseOpeningBalance,
  type ExciseOpeningBalanceLine,
  EXCISE_ADJUSTMENTS,
  DEFAULT_EXCISE_OPENING_BALANCE_LINE,
} from "@/types/entities/ExciseOpeningBalance";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const dateCls =
  "w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-44";

const fmtAmount = (n: number) =>
  n ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

export function ExciseOpeningBalanceForm({
  form,
  setField,
  firstFieldAutoFocus = false,
}: {
  form: ExciseOpeningBalance;
  setField: <K extends keyof ExciseOpeningBalance>(key: K, value: ExciseOpeningBalance[K]) => void;
  firstFieldAutoFocus?: boolean;
}) {
  // ── Line grid helpers ──────────────────────────────────────────────────────
  const lines = form.lines;
  const setLines = (next: ExciseOpeningBalanceLine[]) => setField("lines", next);

  const updateLine = (i: number, patch: Partial<ExciseOpeningBalanceLine>) => {
    const next = lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    setLines(next);
  };
  const addLine = (particulars: string) => {
    setLines([...lines, { ...DEFAULT_EXCISE_OPENING_BALANCE_LINE, particulars }]);
  };
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  // ── "Excise Adjustments" particulars-select popup ──────────────────────────
  const [showAdjPopup, setShowAdjPopup] = useState(false);
  useEffect(() => {
    if (!showAdjPopup) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); setShowAdjPopup(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showAdjPopup]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[920px] w-full">
        {/* ── Voucher header band ── */}
        <div className="flex items-start justify-between border-b border-zinc-200 pb-4 mb-4">
          <div>
            <div className="text-sm font-bold text-zinc-800">Journal</div>
            <FormRow label="No." labelWidth="w-20" className="flex items-center min-h-[26px] mt-2">
              <input
                autoFocus={firstFieldAutoFocus}
                className="w-28 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded"
                value={form.voucherNo}
                onChange={(e) => setField("voucherNo", e.target.value)}
              />
            </FormRow>
          </div>

          <div>
            <FormRow label="GST Registration" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
              <input
                className={inputCls}
                value={form.gstRegistration}
                onChange={(e) => setField("gstRegistration", e.target.value)}
              />
            </FormRow>
            <FormRow label="Tax Unit" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
              <input
                className={inputCls}
                value={form.taxUnit}
                onChange={(e) => setField("taxUnit", e.target.value)}
              />
            </FormRow>
            <FormRow label="Status" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
              <span className="text-sm text-zinc-800 px-1.5 py-0.5">{form.status}</span>
            </FormRow>
          </div>

          <div>
            <FormRow label="Date" labelWidth="w-16" className="flex items-center min-h-[26px]">
              <input
                type="date"
                className={dateCls}
                value={form.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)}
              />
            </FormRow>
          </div>
        </div>

        {/* ── Particulars / Amount line table ── */}
        <div className="border border-zinc-200">
          <div className="flex items-center bg-zinc-50 border-b border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700">
            <span className="flex-1">Particulars</span>
            <span className="w-40 text-right">Amount</span>
            <span className="w-8" />
          </div>

          {lines.length === 0 && (
            <div className="px-3 py-3 text-xs italic text-zinc-400">No entries.</div>
          )}

          {lines.map((line, i) => (
            <div key={i} className="flex items-center border-b border-zinc-100 px-3 py-1">
              <input
                className="flex-1 bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded"
                value={line.particulars}
                onChange={(e) => updateLine(i, { particulars: e.target.value })}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-40 bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 rounded text-right"
                value={Number(line.amount) || ""}
                onChange={(e) => updateLine(i, { amount: Number(e.target.value) || 0 })}
              />
              <button
                type="button"
                className="w-8 text-center text-zinc-400 hover:text-zinc-900 font-bold"
                onClick={() => removeLine(i)}
                aria-label="Remove row"
              >
                &times;
              </button>
            </div>
          ))}

          {/* Totals row — bold + top border, no fill (UI.md). */}
          {lines.length > 0 && (
            <div className="flex items-center px-3 py-1.5 border-t border-zinc-800 text-sm font-bold">
              <span className="flex-1 text-right pr-4">Total</span>
              <span className="w-40 text-right">{fmtAmount(total)}</span>
              <span className="w-8" />
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-4">
          <button
            type="button"
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
            onClick={() => addLine("")}
          >
            Add row
          </button>
          <button
            type="button"
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
            onClick={() => setShowAdjPopup(true)}
          >
            Excise Adjustments…
          </button>
        </div>

        {/* ── Narration ── */}
        <div className="mt-6">
          <FormRow label="Narration:" labelWidth="w-24" className="flex items-start min-h-[26px]">
            <textarea
              className="w-[28rem] bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded resize-none"
              rows={2}
              value={form.narration}
              onChange={(e) => setField("narration", e.target.value)}
            />
          </FormRow>
        </div>
      </div>
      <div className="flex-1" />

      {/* ── Excise Adjustments select popup ── */}
      {showAdjPopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-zinc-800 shadow-2xl w-[360px]">
            <div className="text-center font-bold text-sm py-3 border-b border-zinc-200">
              Excise Adjustments
            </div>
            <div className="py-2 max-h-[320px] overflow-y-auto">
              {EXCISE_ADJUSTMENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className="block w-full text-left px-5 py-1.5 text-sm hover:bg-zinc-100"
                  onClick={() => { addLine(a); setShowAdjPopup(false); }}
                >
                  {a}
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200 px-4 py-2.5 flex justify-end">
              <button
                onClick={() => setShowAdjPopup(false)}
                className="text-xs px-5 py-1 bg-white text-zinc-900 border border-zinc-800 hover:bg-zinc-100 font-bold rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
