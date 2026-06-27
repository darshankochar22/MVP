import * as React from "react";

const fmt = (val: number | null | undefined) => {
  const n = Number(val) || 0;
  if (n === 0) return "";
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const fmtQty = (val: number | null | undefined, unit?: string) => {
  const n = Number(val) || 0;
  if (n === 0) return "";
  const s = n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return unit ? `${s} ${unit}` : s;
};

export interface MonthRow {
  month: string;
  in_qty: number;  in_value: number;
  out_qty: number; out_value: number;
  closing_qty: number; closing_value: number;
}

interface Props {
  itemName: string;
  companyName?: string;
  periodLabel?: string;
  unit?: string;
  openingQty: number;
  openingValue: number;
  months: MonthRow[];
  loading?: boolean;
  error?: string | null;
  selectedIndex: number;       // index into `months`; -1 = Opening Balance row
  onSelectIndex: (i: number) => void;
  onActivate?: (monthIndex: number) => void;
  footer?: React.ReactNode;
}

/**
 * Stock Item Monthly Summary — TallyPrime monthly inward/outward movement with a
 * running closing balance for a single stock item. Opening Balance row, twelve
 * month rows, then a Grand Total. Presentational only; parent owns selection +
 * keyboard navigation. Same font-mono family as the Movement/Ageing tables.
 */
export default function StockItemMonthlyTable({
  itemName, companyName, periodLabel, unit, openingQty, openingValue, months,
  loading, error, selectedIndex, onSelectIndex, onActivate, footer,
}: Props) {
  const tot = months.reduce((a, m) => ({
    inQ: a.inQ + m.in_qty,  inV: a.inV + m.in_value,
    outQ: a.outQ + m.out_qty, outV: a.outV + m.out_value,
  }), { inQ: 0, inV: 0, outQ: 0, outV: 0 });
  const finalCQty = months.length ? months[months.length - 1].closing_qty : openingQty;
  const finalCVal = months.length ? months[months.length - 1].closing_value : openingValue;

  const numCell = "px-2 py-1 text-right";

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
        <span className="font-bold text-sm tracking-wide">Stock Item Monthly Summary</span>
        <span className="font-bold text-sm">{companyName || "Company"}</span>
        <span />
      </div>
      <div className="flex justify-between items-center px-3 py-1.5 bg-white border-b border-zinc-300 font-mono text-[11px]">
        <span className="font-semibold">{itemName}</span>
        <span>{periodLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono select-none">
          <thead className="sticky top-0 bg-[#f4f4f5] border-b border-zinc-300 z-10 text-zinc-700">
            <tr>
              <th rowSpan={2} className="px-3 py-1 text-left font-bold align-bottom border-b border-zinc-300">Particulars</th>
              <th colSpan={2} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Inwards</th>
              <th colSpan={2} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Outwards</th>
              <th colSpan={2} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Closing Balance</th>
            </tr>
            <tr>
              <th className="px-2 py-1 text-right font-bold w-28 border-l border-zinc-200">Quantity</th>
              <th className="px-2 py-1 text-right font-bold w-28">Value</th>
              <th className="px-2 py-1 text-right font-bold w-28 border-l border-zinc-200">Quantity</th>
              <th className="px-2 py-1 text-right font-bold w-28">Value</th>
              <th className="px-2 py-1 text-right font-bold w-28 border-l border-zinc-200">Quantity</th>
              <th className="px-2 py-1 text-right font-bold w-28">Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">Loading...</td></tr>
            ) : error ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-600">{error}</td></tr>
            ) : (
              <>
                <tr className={`border-b border-zinc-100 ${selectedIndex === -1 ? "bg-[#e4e4e7] text-zinc-950 font-bold" : "text-zinc-800"}`} onClick={() => onSelectIndex(-1)}>
                  <td className="px-3 py-1 italic">Opening Balance</td>
                  <td className={`${numCell} border-l border-zinc-100`} /><td className={numCell} />
                  <td className={`${numCell} border-l border-zinc-100`} /><td className={numCell} />
                  <td className={`${numCell} border-l border-zinc-100`}>{fmtQty(openingQty, unit)}</td>
                  <td className={numCell}>{fmt(openingValue)}</td>
                </tr>
                {months.map((m, idx) => (
                  <tr
                    key={m.month}
                    onClick={() => onSelectIndex(idx)}
                    onDoubleClick={() => onActivate?.(idx)}
                    className={`border-b border-zinc-100 ${onActivate ? "cursor-pointer" : ""} ${idx === selectedIndex ? "bg-[#e4e4e7] text-zinc-950 font-bold" : "hover:bg-zinc-50 text-zinc-800"}`}
                  >
                    <td className="px-3 py-1">{m.month}</td>
                    <td className={`${numCell} border-l border-zinc-100`}>{fmtQty(m.in_qty, unit)}</td>
                    <td className={numCell}>{fmt(m.in_value)}</td>
                    <td className={`${numCell} border-l border-zinc-100`}>{fmtQty(m.out_qty, unit)}</td>
                    <td className={numCell}>{fmt(m.out_value)}</td>
                    <td className={`${numCell} border-l border-zinc-100`}>{fmtQty(m.closing_qty, unit)}</td>
                    <td className={numCell}>{fmt(m.closing_value)}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-zinc-300 bg-[#f4f4f5] px-3 py-1.5 flex font-mono text-[11px] font-bold text-zinc-900 shrink-0">
        <span className="flex-1">Grand Total</span>
        <span className="w-28 text-right border-l border-zinc-300 pr-1">{fmtQty(tot.inQ, unit)}</span>
        <span className="w-28 text-right pr-1">{fmt(tot.inV)}</span>
        <span className="w-28 text-right border-l border-zinc-300 pr-1">{fmtQty(tot.outQ, unit)}</span>
        <span className="w-28 text-right pr-1">{fmt(tot.outV)}</span>
        <span className="w-28 text-right border-l border-zinc-300 pr-1">{fmtQty(finalCQty, unit)}</span>
        <span className="w-28 text-right pr-1">{fmt(finalCVal)}</span>
      </div>

      {footer}
    </div>
  );
}
