import * as React from "react";
import { useCompany } from "@/context/CompanyContext";

interface TBGroup {
  group_id: number;
  group_name: string;
  nature?: string;
  dr: number;
  cr: number;
}

interface TBData {
  groups: TBGroup[];
  grandTotalDr: number;
  grandTotalCr: number;
}

interface GSItem {
  group_id?: number;
  ledger_id?: number;
  group_name?: string;
  ledger_name?: string;
  dr: number;
  cr: number;
  type: "group" | "ledger";
}

interface GSData {
  group_name: string;
  childGroups: GSItem[];
  ledgers: GSItem[];
  totalDr: number;
  totalCr: number;
}

interface LMSRow {
  month: string;
  debit: number;
  credit: number;
  closingDr: number;
  closingCr: number;
}

interface LMSData {
  ledger_id: number;
  ledger_name: string;
  openingDr: number;
  openingCr: number;
  rows: LMSRow[];
  closingDr: number;
  closingCr: number;
}

type Screen =
  | { type: "trial-balance" }
  | { type: "group-summary"; group: TBGroup }
  | { type: "ledger-monthly"; ledger_id: number; ledger_name: string };

const fmt = (val: number) =>
  val === 0
    ? ""
    : new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);

const fmtTotal = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

const drCrLabel = (dr: number, cr: number) => {
  if (dr > 0) return `${fmtTotal(dr)} Dr`;
  if (cr > 0) return `${fmtTotal(cr)} Cr`;
  return "";
};

function Loading({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
      {text}
    </div>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-xs px-8 text-center">
      {text}
    </div>
  );
}


interface ColHeaderProps {
  title: string;
  companyName: string;
  periodLabel: string;
  contextLabel?: string;
  extraRightCols?: React.ReactNode; 
}

function ColHeader({
  title,
  companyName,
  periodLabel,
  contextLabel,
  extraRightCols,
}: ColHeaderProps) {
  return (
    <>
      {/* Blue title bar */}
      <div className="bg-[#d4e8f0] border-b border-zinc-300 px-4 py-1 flex items-center select-none">
        <span className="font-mono text-[11px] font-bold text-zinc-800 tracking-wide">
          {title}
        </span>
        <span className="ml-6 font-mono text-[11px] text-zinc-600">{companyName}</span>
      </div>

      {/* Particulars + right-side meta + column labels */}
      <div className="flex border-b border-zinc-300 bg-white select-none font-mono text-[11px]">
        <div className="flex-1 px-4 py-1 font-bold text-zinc-700 italic self-end pb-1.5">
          Particulars
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="px-4 pt-1 text-right text-zinc-700 leading-snug">
            {contextLabel && <div className="font-bold">{contextLabel}</div>}
            <div className="font-bold">{companyName}</div>
            <div>{periodLabel}</div>
            <div className="font-bold">Closing Balance</div>
          </div>
          {extraRightCols ?? (
            <div className="flex border-t border-zinc-200 w-full mt-0.5">
              <div className="w-40 text-right px-4 py-0.5 font-bold border-r border-zinc-200">
                Debit
              </div>
              <div className="w-40 text-right px-4 py-0.5 font-bold">Credit</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Grand Total footer ─────────────────────────────────────────────────────

function GrandTotal({ dr, cr }: { dr: number; cr: number }) {
  return (
    <div className="border-t border-zinc-400 bg-white px-4 py-1 flex select-none font-mono text-[11px] font-bold text-zinc-900">
      <span className="flex-1">Grand Total</span>
      <span className="w-40 text-right pr-4 border-r border-zinc-200">{fmtTotal(dr)}</span>
      <span className="w-40 text-right pr-4">{fmtTotal(cr)}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Trial Balance
// ══════════════════════════════════════════════════════════════════════════

function TrialBalanceScreen({
  onDrillGroup,
}: {
  onDrillGroup: (g: TBGroup) => void;
}) {
  const { selectedCompany, activeFY } = useCompany();
  const [data, setData]       = React.useState<TBData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);
  const [focusedId, setFocusedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (window as any).api.report
      .trialBalance(selectedCompany.company_id, activeFY.fy_id)
      .then((res: any) => {
        if (res?.success) { setData(res); if (res.groups.length > 0) setFocusedId(res.groups[0].group_id); }
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id]);

  React.useEffect(() => {
    if (!data?.groups.length) return;
    const onKey = (e: KeyboardEvent) => {
      const idx = data.groups.findIndex((g) => g.group_id === focusedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = data.groups[Math.min(data.groups.length - 1, idx + 1)];
        if (next) setFocusedId(next.group_id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = data.groups[Math.max(0, idx - 1)];
        if (prev) setFocusedId(prev.group_id);
      } else if (e.key === "Enter" && focusedId !== null) {
        e.preventDefault();
        const g = data.groups.find((x) => x.group_id === focusedId);
        if (g) onDrillGroup(g);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [data, focusedId, onDrillGroup]);

  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";
  if (loading) return <Loading text="Loading Trial Balance..." />;
  if (error)   return <ErrorMsg text={error} />;
  if (!data)   return <Loading text="No data." />;

  return (
    <div className="flex flex-col h-full w-full bg-white font-mono overflow-hidden">
      <ColHeader
        title="Trial Balance"
        companyName={selectedCompany?.name || ""}
        periodLabel={periodLabel}
      />

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <tbody>
            {data.groups.map((g) => {
              const isFocused = focusedId === g.group_id;
              return (
                <tr
                  key={g.group_id}
                  className={`border-b border-zinc-100 cursor-pointer select-none transition-colors ${
                    isFocused
                      ? "bg-[#ffcc00] text-zinc-950 font-bold"
                      : "hover:bg-zinc-50 text-zinc-800 font-semibold"
                  }`}
                  onClick={() => setFocusedId(g.group_id)}
                  onDoubleClick={() => onDrillGroup(g)}
                >
                  <td className="px-4 py-1.5">{g.group_name}</td>
                  <td className="w-40 text-right px-4 py-1.5 border-r border-zinc-100">
                    {fmt(g.dr)}
                  </td>
                  <td className="w-40 text-right px-4 py-1.5">{fmt(g.cr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <GrandTotal dr={data.grandTotalDr} cr={data.grandTotalCr} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Group Summary
// ══════════════════════════════════════════════════════════════════════════

function GroupSummaryScreen({
  group,
  onDrillLedger,
  onBack,
}: {
  group: TBGroup;
  onDrillLedger: (ledger_id: number, ledger_name: string) => void;
  onBack: () => void;
}) {
  const { selectedCompany, activeFY } = useCompany();
  const [data, setData]       = React.useState<GSData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = React.useState(0);

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    (window as any).api.report
      .groupSummaryDrilldown(selectedCompany.company_id, activeFY.fy_id, group.group_id)
      .then((res: any) => {
        if (res?.success) setData(res);
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id, group.group_id]);

  const allRows: GSItem[] = React.useMemo(
    () => (data ? [...data.childGroups, ...data.ledgers] : []),
    [data]
  );

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")  { e.preventDefault(); setFocusedIdx((p) => Math.min(allRows.length - 1, p + 1)); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); setFocusedIdx((p) => Math.max(0, p - 1)); }
      else if (e.key === "Escape")    { e.preventDefault(); onBack(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const row = allRows[focusedIdx];
        if (row?.type === "ledger" && row.ledger_id)
          onDrillLedger(row.ledger_id, row.ledger_name!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [allRows, focusedIdx, onBack, onDrillLedger]);

  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";
  if (loading) return <Loading text="Loading Group Summary..." />;
  if (error)   return <ErrorMsg text={error} />;
  if (!data)   return <Loading text="No data." />;

  return (
    <div className="flex flex-col h-full w-full bg-white font-mono overflow-hidden">
      <ColHeader
        title="Group Summary"
        companyName={selectedCompany?.name || ""}
        periodLabel={periodLabel}
        contextLabel={group.group_name}
      />

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <tbody>
            {allRows.map((row, idx) => {
              const isFocused = focusedIdx === idx;
              const isLedger  = row.type === "ledger";
              const name      = isLedger ? row.ledger_name! : row.group_name!;
              return (
                <tr
                  key={`${row.type}-${isLedger ? row.ledger_id : row.group_id}`}
                  className={`border-b border-zinc-100 cursor-pointer select-none transition-colors ${
                    isFocused
                      ? "bg-[#ffcc00] text-zinc-950 font-bold"
                      : isLedger
                      ? "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 italic"
                      : "hover:bg-zinc-50 text-zinc-800 font-semibold"
                  }`}
                  onClick={() => setFocusedIdx(idx)}
                  onDoubleClick={() => {
                    if (isLedger && row.ledger_id)
                      onDrillLedger(row.ledger_id, row.ledger_name!);
                  }}
                >
                  <td
                    className="px-4 py-1.5"
                    style={{ paddingLeft: isLedger ? "32px" : "16px" }}
                  >
                    {name}
                  </td>
                  <td className="w-40 text-right px-4 py-1.5 border-r border-zinc-100">
                    {fmt(row.dr)}
                  </td>
                  <td className="w-40 text-right px-4 py-1.5">{fmt(row.cr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <GrandTotal dr={data.totalDr} cr={data.totalCr} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Ledger Monthly Summary
// ══════════════════════════════════════════════════════════════════════════

function LedgerMonthlySummaryScreen({
  ledger_id,
  ledger_name,
  onBack,
}: {
  ledger_id: number;
  ledger_name: string;
  onBack: () => void;
}) {
  const { selectedCompany, activeFY } = useCompany();
  const [data, setData]       = React.useState<LMSData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = React.useState(0);

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    (window as any).api.report
      .ledgerMonthlySummary(selectedCompany.company_id, activeFY.fy_id, ledger_id)
      .then((res: any) => {
        if (res?.success) setData(res);
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id, ledger_id]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")  { e.preventDefault(); setFocusedIdx((p) => Math.min(11, p + 1)); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); setFocusedIdx((p) => Math.max(0, p - 1)); }
      else if (e.key === "Escape")    { e.preventDefault(); onBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";
  if (loading) return <Loading text="Loading Monthly Summary..." />;
  if (error)   return <ErrorMsg text={error} />;
  if (!data)   return <Loading text="No data." />;

  return (
    <div className="flex flex-col h-full w-full bg-white font-mono overflow-hidden">
      <ColHeader
        title="Ledger Monthly Summary"
        companyName={selectedCompany?.name || ""}
        periodLabel={periodLabel}
        contextLabel={ledger_name}
        extraRightCols={
          <div className="flex border-t border-zinc-200 w-full mt-0.5">
            <div className="w-32 text-right px-3 py-0.5 font-bold border-r border-zinc-200">
              Debit
            </div>
            <div className="w-32 text-right px-3 py-0.5 font-bold border-r border-zinc-200">
              Credit
            </div>
            <div className="w-44 text-right px-4 py-0.5 font-bold">
              Closing Balance
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <tbody>
            {/* Opening Balance */}
            <tr className="border-b border-zinc-100 text-zinc-600 italic">
              <td className="px-4 py-1.5">Opening Balance</td>
              <td className="w-32 text-right px-3 py-1.5 border-r border-zinc-100" />
              <td className="w-32 text-right px-3 py-1.5 border-r border-zinc-100" />
              <td className="w-44 text-right px-4 py-1.5">
                {drCrLabel(data.openingDr, data.openingCr)}
              </td>
            </tr>

            {data.rows.map((row, idx) => {
              const isFocused    = focusedIdx === idx;
              const hasActivity  = row.debit > 0 || row.credit > 0;
              return (
                <tr
                  key={row.month}
                  className={`border-b border-zinc-100 cursor-pointer select-none transition-colors ${
                    isFocused
                      ? "bg-[#ffcc00] text-zinc-950 font-bold"
                      : hasActivity
                      ? "hover:bg-zinc-50 text-zinc-800"
                      : "text-zinc-400"
                  }`}
                  onClick={() => setFocusedIdx(idx)}
                >
                  <td className="px-4 py-1.5">{row.month}</td>
                  <td className="w-32 text-right px-3 py-1.5 border-r border-zinc-100">
                    {fmt(row.debit)}
                  </td>
                  <td className="w-32 text-right px-3 py-1.5 border-r border-zinc-100">
                    {fmt(row.credit)}
                  </td>
                  <td className="w-44 text-right px-4 py-1.5">
                    {drCrLabel(row.closingDr, row.closingCr)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer — single closing balance, right-aligned */}
      <div className="border-t border-zinc-400 bg-white px-4 py-1 flex select-none font-mono text-[11px] font-bold text-zinc-900">
        <span className="flex-1">Grand Total</span>
        <span className="w-44 text-right pr-4">
          {drCrLabel(data.closingDr, data.closingCr)}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT — drill-down stack controller
// ══════════════════════════════════════════════════════════════════════════

export function TrialBalanceLayout() {
  const [stack, setStack] = React.useState<Screen[]>([{ type: "trial-balance" }]);
  const current = stack[stack.length - 1];

  const push = (screen: Screen) => setStack((prev) => [...prev, screen]);
  const pop  = () => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));

  // Global Escape to go back (screens also handle it, but this is fallback)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack.length > 1) { e.preventDefault(); pop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stack.length]);

  if (current.type === "trial-balance") {
    return (
      <TrialBalanceScreen
        onDrillGroup={(g) => push({ type: "group-summary", group: g })}
      />
    );
  }
  if (current.type === "group-summary") {
    return (
      <GroupSummaryScreen
        group={current.group}
        onDrillLedger={(ledger_id, ledger_name) =>
          push({ type: "ledger-monthly", ledger_id, ledger_name })
        }
        onBack={pop}
      />
    );
  }
  if (current.type === "ledger-monthly") {
    return (
      <LedgerMonthlySummaryScreen
        ledger_id={current.ledger_id}
        ledger_name={current.ledger_name}
        onBack={pop}
      />
    );
  }
  return null;
}
