import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

interface LedgerRow {
  ledger_id: number;
  ledger_name: string;
  balance: number;
}

interface GroupRow {
  group_id: number;
  group_name: string;
  nature?: string;
  balance: number;
  ledgers: LedgerRow[];
  childGroups: GroupRow[];
  isPnL?: boolean;
}

interface BSData {
  assets: GroupRow[];
  liabilities: GroupRow[];
  totalAssets: number;
  totalLiabilities: number;
  netProfit?: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));

// What is currently focused, kept alongside the key so Enter can act on it.
type FocusPayload = { key: string; group?: GroupRow; ledger?: LedgerRow };

// ─── group rows ───────────────────────────────────────────────────────────────

interface GroupRowsProps {
  groups: GroupRow[];
  depth: number;
  focusedId: string | null;
  onFocus: (payload: FocusPayload) => void;
  onOpenGroup: (group: GroupRow) => void;
  onOpenLedger: (ledger: LedgerRow) => void;
  side: "L" | "A";
}

function GroupRows({
  groups,
  depth,
  focusedId,
  onFocus,
  onOpenGroup,
  onOpenLedger,
  side,
}: GroupRowsProps) {
  return (
    <>
      {groups.map((group) => {
        const key = `${side}-g-${group.group_id}-d${depth}`;
        const isFocused = focusedId === key;
        const hasChildren =
          group.childGroups.length > 0 || group.ledgers.length > 0;
        const indent = depth * 16;

        return (
          <tr
            key={key}
            className={`border-b border-zinc-100 cursor-pointer transition-colors select-none ${
              isFocused
                ? "bg-[#ffcc00] text-zinc-950 font-bold"
                : depth === 0
                ? "hover:bg-zinc-50 text-zinc-800 font-semibold"
                : "hover:bg-zinc-50 text-zinc-700"
            }`}
            onClick={() => onFocus({ key, group })}
            onDoubleClick={() => onOpenGroup(group)}
          >
            <td
              className="px-3 py-1.5 text-left"
              style={{ paddingLeft: `${12 + indent}px` }}
            >
              {hasChildren ? (
                <span className="mr-1.5 text-zinc-400 text-[9px]">▶</span>
              ) : (
                <span className="mr-1.5 text-zinc-300 text-[9px]">–</span>
              )}
              {group.group_name}
              {group.isPnL && (
                <span className="ml-2 text-[9px] text-zinc-500 italic font-normal">
                  (Net {(group.balance ?? 0) >= 0 ? "Profit" : "Loss"})
                </span>
              )}
            </td>
            <td className="px-3 py-1.5 text-right whitespace-nowrap w-36 font-mono">
              ₹{fmt(group.balance)}
            </td>
          </tr>
        );
      })}
    </>
  );
}

// ─── panel ───────────────────────────────────────────────────────────────────

interface PanelProps {
  title: string;
  groups: GroupRow[];
  total: number;
  totalLabel: string;
  focusedId: string | null;
  onFocus: (payload: FocusPayload) => void;
  onOpenGroup: (group: GroupRow) => void;
  onOpenLedger: (ledger: LedgerRow) => void;
  side: "L" | "A";
  periodLabel: string;
}

function Panel({
  title,
  groups,
  total,
  totalLabel,
  focusedId,
  onFocus,
  onOpenGroup,
  onOpenLedger,
  side,
  periodLabel,
}: PanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-300 last:border-r-0">
      {/* Panel title + period */}
      <div className="bg-[#e5eff5] border-b border-zinc-200 px-3 py-1 flex justify-between items-center select-none">
        <span className="font-mono text-[11px] font-bold text-zinc-800 tracking-wide uppercase">
          {title}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">{periodLabel}</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse font-mono text-[11px]">
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-8 text-center text-zinc-400 italic text-[11px]"
                >
                  No entries for this period.
                </td>
              </tr>
            ) : (
              <GroupRows
                groups={groups}
                depth={0}
                focusedId={focusedId}
                onFocus={onFocus}
                onOpenGroup={onOpenGroup}
                onOpenLedger={onOpenLedger}
                side={side}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="border-t-2 border-double border-zinc-400 bg-[#e5eff5] px-3 py-1.5 flex justify-between font-mono text-[11px] font-bold text-zinc-900 select-none">
        <span>{totalLabel}</span>
        <span>₹{fmt(total)}</span>
      </div>
    </div>
  );
}

// ─── main layout ──────────────────────────────────────────────────────────────

export function BalanceSheetLayout() {
  const { selectedCompany, activeFY } = useCompany();
  const navigate = useNavigate();

  const [data, setData] = React.useState<BSData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  // Holds whichever group/ledger is currently focused, so the Enter key
  // handler below knows what to drill into.
  const focusedRef = React.useRef<FocusPayload | null>(null);

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (window as any).api.report
      .balanceSheet(selectedCompany.company_id, activeFY.fy_id)
      .then((res: any) => {
        if (res?.success) setData(res);
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id]);

  const openGroup = React.useCallback(
    (group: GroupRow) => {
      navigate(`/reports/accounts/group-summary/${group.group_id}`);
    },
    [navigate]
  );

  const openLedger = React.useCallback(
    (ledger: LedgerRow) => {
      navigate(`/reports/accounts/ledger-summary/${ledger.ledger_id}`);
    },
    [navigate]
  );

  const handleFocus = React.useCallback((payload: FocusPayload) => {
    setFocusedId(payload.key);
    focusedRef.current = payload;
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!focusedRef.current) return;
      if (e.key === "Enter") {
        e.preventDefault();
        const { group, ledger } = focusedRef.current;
        if (group) openGroup(group);
        else if (ledger) openLedger(ledger);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openGroup, openLedger]);

  const periodLabel = activeFY
    ? `${activeFY.start_date} to ${activeFY.end_date}`
    : "";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading Balance Sheet...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-xs px-8 text-center">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        No data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white font-mono">
      <div className="flex flex-1 overflow-hidden">
        <Panel
          title="Liabilities"
          groups={data.liabilities}
          total={data.totalLiabilities}
          totalLabel="Total"
          focusedId={focusedId}
          onFocus={handleFocus}
          onOpenGroup={openGroup}
          onOpenLedger={openLedger}
          side="L"
          periodLabel={periodLabel}
        />
        <Panel
          title="Assets"
          groups={data.assets}
          total={data.totalAssets}
          totalLabel="Total"
          focusedId={focusedId}
          onFocus={handleFocus}
          onOpenGroup={openGroup}
          onOpenLedger={openLedger}
          side="A"
          periodLabel={periodLabel}
        />
      </div>
    </div>
  );
}