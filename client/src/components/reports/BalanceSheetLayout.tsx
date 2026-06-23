import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

interface GroupRow {
  group_id: number;
  group_name: string;
  nature?: string;
  balance: number;
  ledgers: { ledger_id: number; ledger_name: string; balance: number }[];
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

// ─── group rows (flat, top-level only — matches Tally's Balance Sheet) ───────

interface GroupRowsProps {
  groups: GroupRow[];
  focusedId: string | null;
  onFocus: (key: string, group: GroupRow) => void;
  onOpenGroup: (group: GroupRow) => void;
  side: "L" | "A";
}

function GroupRows({ groups, focusedId, onFocus, onOpenGroup, side }: GroupRowsProps) {
  return (
    <>
      {groups.map((group) => {
        const key = `${side}-g-${group.group_id}`;
        const isFocused = focusedId === key;

        return (
          <tr
            key={key}
            className={`border-b border-zinc-100 cursor-pointer transition-colors select-none ${
              isFocused
                ? "bg-[#ffcc00] text-zinc-950 font-bold"
                : "hover:bg-zinc-50 text-zinc-800 font-semibold"
            }`}
            onClick={() => onFocus(key, group)}
            onDoubleClick={() => onOpenGroup(group)}
          >
            <td className="px-3 py-1.5 text-left">
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
  onFocus: (key: string, group: GroupRow) => void;
  onOpenGroup: (group: GroupRow) => void;
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
  side,
  periodLabel,
}: PanelProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-zinc-300 last:border-r-0">
      <div className="bg-[#e5eff5] border-b border-zinc-200 px-3 py-1 flex justify-between items-center select-none">
        <span className="font-mono text-[11px] font-bold text-zinc-800 tracking-wide uppercase">
          {title}
        </span>
        <span className="font-mono text-[10px] text-zinc-500">{periodLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse font-mono text-[11px]">
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-zinc-400 italic text-[11px]">
                  No entries for this period.
                </td>
              </tr>
            ) : (
              <GroupRows
                groups={groups}
                focusedId={focusedId}
                onFocus={onFocus}
                onOpenGroup={onOpenGroup}
                side={side}
              />
            )}
          </tbody>
        </table>
      </div>

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
  const focusedGroupRef = React.useRef<GroupRow | null>(null);

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

  const handleFocus = React.useCallback((key: string, group: GroupRow) => {
    setFocusedId(key);
    focusedGroupRef.current = group;
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!focusedGroupRef.current) return;
      if (e.key === "Enter") {
        e.preventDefault();
        openGroup(focusedGroupRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openGroup]);

  const periodLabel = activeFY ? `as at ${activeFY.start_date}` : "";

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
          side="A"
          periodLabel={periodLabel}
        />
      </div>
    </div>
  );
}