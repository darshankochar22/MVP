import { useEffect, useState } from "react";
import { FormRow } from "@/components/ui";
import {
  type CenvatOpeningBalance,
  type CenvatOpeningBalanceLine,
  CENVAT_CREDIT_OF,
} from "@/types/entities/CenvatOpeningBalance";

// ─── Shared field tokens (black / white / zinc only) ───────────────────────────
const inputCls =
  "w-72 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";
const dateCls =
  "w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded";

const LABEL_W = "w-44";

export function CenvatOpeningBalanceForm({
  form,
  setField,
  firstFieldAutoFocus = false,
}: {
  form: CenvatOpeningBalance;
  setField: <K extends keyof CenvatOpeningBalance>(key: K, value: CenvatOpeningBalance[K]) => void;
  firstFieldAutoFocus?: boolean;
}) {
  // ── "Excise Adjustments" popup, opened from the CENVAT credit of field ──
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  useEffect(() => {
    if (!showCreditPopup) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setShowCreditPopup(false); } };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [showCreditPopup]);

  const lines = form.lines.length ? form.lines : [];
  const total = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);

  const updLine = (i: number, patch: Partial<CenvatOpeningBalanceLine>) => {
    const next = [...form.lines];
    next[i] = { ...next[i], ...patch };
    setField("lines", next);
  };
  const addLine = () => setField("lines", [...form.lines, { particulars: "", amount: 0 }]);
  const removeLine = (i: number) =>
    setField("lines", form.lines.filter((_, idx) => idx !== i));

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
      <div className="p-6 max-w-[920px]">
        <div className="text-center text-sm font-bold text-zinc-800 mb-4">
          CENVAT Opening Balance Creation
        </div>

        {/* ── Header band ─────────────────────────────────────────────── */}
        <div className="flex justify-between items-start gap-8">
          {/* Left column */}
          <div className="flex-1">
            <FormRow label="Journal No." labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
              <span className="text-sm text-zinc-700 px-1.5">{form.voucherNo}</span>
            </FormRow>

            <FormRow label="CENVAT credit of" labelWidth={LABEL_W} className="flex items-center min-h-[26px]">
              <button
                type="button"
                autoFocus={firstFieldAutoFocus}
                className="w-72 text-left bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded"
                onClick={() => setShowCreditPopup(true)}
              >
                {form.cenvatCreditOf}
              </button>
            </FormRow>
          </div>

          {/* Right column */}
          <div className="w-[320px] shrink-0">
            <FormRow label="GST Registration" labelWidth="w-36" className="flex items-center min-h-[26px]">
              <input
                className="w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded"
                value={form.gstRegistration}
                onChange={(e) => setField("gstRegistration", e.target.value)}
              />
            </FormRow>

            <FormRow label="Tax Unit" labelWidth="w-36" className="flex items-center min-h-[26px]">
              <input
                className="w-44 bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded"
                value={form.taxUnit}
                onChange={(e) => setField("taxUnit", e.target.value)}
              />
            </FormRow>

            <FormRow label="Status" labelWidth="w-36" className="flex items-center min-h-[26px]">
              <span className="text-sm text-zinc-700 px-1.5">CENVAT Opening Balance</span>
            </FormRow>

            <FormRow label="Date" labelWidth="w-36" className="flex items-center min-h-[26px]">
              <input
                type="date"
                className={dateCls}
                value={form.voucherDate}
                onChange={(e) => setField("voucherDate", e.target.value)}
              />
            </FormRow>
          </div>
        </div>

        {/* ── Particulars / Amount grid ───────────────────────────────── */}
        <div className="mt-6 border-t border-zinc-800">
          <div className="flex items-center min-h-[28px] border-b border-zinc-300 font-bold text-xs text-zinc-700">
            <div className="flex-1 px-2 py-1">Particulars</div>
            <div className="w-40 px-2 py-1 text-right">Amount</div>
            <div className="w-8" />
          </div>

          {form.lines.map((l, i) => (
            <div key={i} className="flex items-center min-h-[26px] border-b border-zinc-100">
              <div className="flex-1 px-1">
                <input
                  className="w-full bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded"
                  value={l.particulars}
                  onChange={(e) => updLine(i, { particulars: e.target.value })}
                />
              </div>
              <div className="w-40 px-1">
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-transparent text-sm outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded text-right"
                  value={Number(l.amount) || ""}
                  onChange={(e) => updLine(i, { amount: Number(e.target.value) || 0 })}
                />
              </div>
              <div className="w-8 flex justify-center">
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-zinc-800 font-bold"
                  onClick={() => removeLine(i)}
                  title="Remove row"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center min-h-[28px] border-t border-zinc-800 font-bold text-sm">
            <div className="flex-1 px-2 py-1">
              <button
                type="button"
                className="text-xs text-zinc-500 underline hover:text-zinc-800 font-normal"
                onClick={addLine}
              >
                + Add row
              </button>
            </div>
            <div className="w-40 px-2 py-1 text-right">{total.toFixed(2)}</div>
            <div className="w-8" />
          </div>
        </div>

        {/* ── Narration ───────────────────────────────────────────────── */}
        <div className="mt-6">
          <div className="text-xs font-bold text-zinc-600 mb-1">Narration:</div>
          <textarea
            className="w-full min-h-[60px] bg-transparent text-sm outline-none px-2 py-1 border border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded resize-y"
            value={form.narration}
            onChange={(e) => setField("narration", e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1" />

      {/* ── Excise Adjustments popup (CENVAT credit of) ── */}
      {showCreditPopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-zinc-800 shadow-2xl w-[260px]">
            <div className="text-center font-bold text-sm py-3 border-b border-zinc-200">
              Excise Adjustments
            </div>
            <div className="py-1">
              {CENVAT_CREDIT_OF.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`block w-full text-left text-sm px-4 py-1.5 hover:bg-zinc-100 ${
                    form.cenvatCreditOf === opt ? "font-bold bg-zinc-100" : ""
                  }`}
                  onClick={() => {
                    setField("cenvatCreditOf", opt);
                    setShowCreditPopup(false);
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
