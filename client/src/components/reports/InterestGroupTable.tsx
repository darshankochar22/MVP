import * as React from "react";

/* ── Shared group-wise Interest Calculation table ──────────────────────
   Used by Interest Receivable / Payable (fixed group) and the Groups report
   (picked group). Matches TallyPrime's layout: Particulars | Closing Balance |
   Interest, party ledgers under the group, each expandable to its bills.        */

const fmtDate = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return `${dt.getDate()}-${dt.toLocaleString("en-IN", { month: "short" })}-${String(dt.getFullYear()).slice(-2)}`;
};
const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

export interface BillLine {
  bill_ref: string;
  bill_due_date: string;
  total_pending: number;
  interest_rate: number;
  interest_style: string;
  days: number;
  interest_amount: number;
}
export interface GroupedLedger {
  ledger_id: number;
  name: string;
  total_principal: number;
  total_interest: number;
  bills: BillLine[];
}

// Collapse the server's per-bill rows into per-ledger groups (shared by all three
// group-wise interest reports: Receivable, Payable, Groups).
export function groupByLedger(rows: any[]): GroupedLedger[] {
  const map = new Map<number, GroupedLedger>();
  (rows || []).forEach((r) => {
    if (!map.has(r.ledger_id)) {
      map.set(r.ledger_id, { ledger_id: r.ledger_id, name: r.party_ledger, total_principal: 0, total_interest: 0, bills: [] });
    }
    const g = map.get(r.ledger_id)!;
    g.total_principal += Number(r.total_pending) || 0;
    g.total_interest += Number(r.interest_amount) || 0;
    g.bills.push({
      bill_ref: r.bill_ref,
      bill_due_date: r.bill_due_date,
      total_pending: Number(r.total_pending) || 0,
      interest_rate: Number(r.interest_rate) || 0,
      interest_style: r.interest_style || "",
      days: Number(r.days) || 0,
      interest_amount: Number(r.interest_amount) || 0,
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

interface Props {
  title: string;                 // "Interest Receivable" / group name
  groupName: string;             // "Sundry Debtors" etc — shown in the header block
  drcr: "Dr" | "Cr";             // natural side of the group (debtors=Dr, creditors=Cr)
  fromDate?: string;
  toDate?: string;
  groups: GroupedLedger[];
  totalPrincipal: number;
  totalInterest: number;
  onEscape: () => void;          // Esc / Backspace — parent decides (back to picker vs -1)
}

// A group's natural side is Dr for debtors, Cr for creditors; a row whose signed
// amount runs opposite (e.g. an advance) flips to the other side.
const sideOf = (v: number, groupDrCr: "Dr" | "Cr"): "Dr" | "Cr" => {
  const natural = v >= 0;
  if (groupDrCr === "Dr") return natural ? "Dr" : "Cr";
  return natural ? "Cr" : "Dr";
};
const withSide = (v: number, groupDrCr: "Dr" | "Cr") => (v === 0 ? "" : `${fmt(v)} ${sideOf(v, groupDrCr)}`);

export default function InterestGroupTable({
  title, groupName, drcr, fromDate, toDate, groups, totalPrincipal, totalInterest, onEscape,
}: Props) {
  const [focusedIdx, setFocused] = React.useState(0);
  const [expandedIds, setExpanded] = React.useState<Set<number>>(new Set());

  const toggleExpand = React.useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setFocused((p) => Math.min(groups.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocused((p) => Math.max(0, p - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); const g = groups[focusedIdx]; if (g) toggleExpand(g.ledger_id); }
      else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); onEscape(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [groups, focusedIdx, toggleExpand, onEscape]);

  return (
    <div className="flex flex-col h-full w-full bg-white font-mono overflow-hidden">
      {/* Sub-header — report title (left) + group / period block (right) */}
      <div className="bg-white border-b border-black px-3 py-1 text-[10px] font-mono text-black flex gap-6 select-none">
        <span className="font-bold">{title}</span>
        <span className="ml-auto text-right">
          <span className="font-bold">{groupName}</span>
          {(fromDate || toDate) && <span className="ml-3">{fmtDate(fromDate || "")} to {fmtDate(toDate || "")}</span>}
        </span>
      </div>

      {/* Main table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <thead className="sticky top-0 bg-white border-b border-black z-10 select-none">
            <tr>
              <th className="px-3 py-1.5 text-left font-bold">Particulars</th>
              <th className="px-3 py-1.5 text-right font-bold w-[25%]">Closing Balance</th>
              <th className="px-3 py-1.5 text-right font-bold w-[25%]">Interest</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-black/50 italic">No interest transactions found.</td></tr>
            ) : groups.map((g, idx) => {
              const isFocused = focusedIdx === idx;
              const isExpanded = expandedIds.has(g.ledger_id);
              return (
                <React.Fragment key={g.ledger_id}>
                  {/* Ledger (party) row */}
                  <tr
                    className={`border-b border-black/10 cursor-pointer select-none transition-colors ${isFocused ? "bg-black/10 text-black font-bold" : "hover:bg-black/[0.04] text-black"}`}
                    onClick={() => { setFocused(idx); toggleExpand(g.ledger_id); }}
                  >
                    <td className="px-3 py-1.5 flex items-center gap-1.5">
                      <span className="text-[9px] w-3 text-center text-black/50">{isExpanded ? "▾" : "▸"}</span>
                      <span>{g.name}</span>
                    </td>
                    <td className="px-3 py-1.5 text-right font-semibold">{withSide(g.total_principal, drcr)}</td>
                    <td className="px-3 py-1.5 text-right font-bold">{withSide(g.total_interest === 0 ? 0 : (g.total_principal < 0 ? -g.total_interest : g.total_interest), drcr)}</td>
                  </tr>

                  {/* Expanded bill lines */}
                  {isExpanded && g.bills.map((b, bi) => (
                    <tr key={bi} className="border-b border-black/5 bg-black/[0.02] text-black/70 select-none">
                      <td className="pl-8 pr-3 py-1 text-[10.5px]">
                        <span className="font-semibold text-black/80">{b.bill_ref}</span>
                        <span className="text-black/40"> (Due {fmtDate(b.bill_due_date)} · {b.interest_rate}% {b.interest_style} · {b.days} days)</span>
                      </td>
                      <td className="px-3 py-1 text-right text-[10.5px]">{withSide(b.total_pending, drcr)}</td>
                      <td className="px-3 py-1 text-right text-[10.5px] font-semibold">{withSide(b.total_pending < 0 ? -b.interest_amount : b.interest_amount, drcr)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer grand total */}
      <div className="border-t-2 border-double border-black bg-white px-3 py-1.5 flex font-mono text-[11px] font-bold text-black select-none">
        <span className="flex-1">Grand Total</span>
        <span className="w-[25%] text-right pr-3">{withSide(totalPrincipal, drcr)}</span>
        <span className="w-[25%] text-right pr-3">{withSide(totalPrincipal < 0 ? -totalInterest : totalInterest, drcr)}</span>
      </div>
    </div>
  );
}
