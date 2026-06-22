import * as React from "react";
import { useCompany } from "@/context/CompanyContext";

interface LedgerRow {
  ledger_id: number;
  ledger_name: string;
  balance: number;
}

interface GroupRow {
  group_id: number;
  group_name: string;
  balance: number;
  ledgers: LedgerRow[];
  childGroups: GroupRow[];
}

type PLRowItem =
  | { kind: "group"; group: GroupRow }
  | { kind: "flat"; key: string; label: string; amount: number };

interface PLData {
  expenseRows: PLRowItem[];
  incomeRows: PLRowItem[];
  totalExpense: number;
  totalIncome: number;
}

const fmt = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));

interface GroupRowsProps {
  groups: GroupRow[];
  depth: number;
  expandedIds: Set<string>;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onToggle: (id: string) => void;
  side: "E" | "I";
}

function GroupRows({
  groups,
  depth,
  expandedIds,
  focusedId,
  onFocus,
  onToggle,
  side,
}: GroupRowsProps) {
  return (
    <>
      {groups.map((group) => {
        const key = `${side}-g-${group.group_id}-d${depth}`;
        const isExpanded = expandedIds.has(key);
        const isFocused = focusedId === key;
        const hasChildren =
          group.childGroups.length > 0 || group.ledgers.length > 0;
        const indent = depth * 16;

        return (
          <React.Fragment key={key}>
            <tr
              className={`border-b border-zinc-100 cursor-pointer transition-colors select-none ${
                isFocused
                  ? "bg-[#ffcc00] text-zinc-950 font-bold"
                  : depth === 0
                  ? "hover:bg-zinc-50 text-zinc-800 font-semibold"
                  : "hover:bg-zinc-50 text-zinc-700"
              }`}
              onClick={() => onFocus(key)}
              onDoubleClick={() => hasChildren && onToggle(key)}
            >
              <td
                className="px-3 py-1.5 text-left"
                style={{ paddingLeft: `${12 + indent}px` }}
              >
                {hasChildren && (
                  <span className="mr-1.5 text-zinc-400 text-[9px]">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                )}
                {!hasChildren && (
                  <span className="mr-1.5 text-zinc-300 text-[9px]">–</span>
                )}
                {group.group_name}
              </td>
              <td className="px-3 py-1.5 text-right whitespace-nowrap w-36 font-mono">
                {fmt(group.balance)}
              </td>
            </tr>

            {isExpanded && (
              <>
                {group.childGroups.length > 0 && (
                  <GroupRows
                    groups={group.childGroups}
                    depth={depth + 1}
                    expandedIds={expandedIds}
                    focusedId={focusedId}
                    onFocus={onFocus}
                    onToggle={onToggle}
                    side={side}
                  />
                )}
                {group.ledgers.map((l) => {
                  const lKey = `${side}-l-${l.ledger_id}-d${depth}`;
                  return (
                    <tr
                      key={lKey}
                      className={`border-b border-zinc-50 cursor-pointer select-none ${
                        focusedId === lKey
                          ? "bg-[#ffcc00] text-zinc-950 font-bold"
                          : "bg-zinc-50 hover:bg-zinc-100 text-zinc-600 italic"
                      }`}
                      onClick={() => onFocus(lKey)}
                    >
                      <td
                        className="px-3 py-1 text-left"
                        style={{ paddingLeft: `${12 + (depth + 1) * 16}px` }}
                      >
                        {l.ledger_name}
                      </td>
                      <td className="px-3 py-1 text-right whitespace-nowrap w-36 font-mono">
                        {fmt(l.balance)}
                      </td>
                    </tr>
                  );
                })}
              </>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function FlatRow({
  label,
  amount,
  isFocused,
  onFocus,
}: {
  label: string;
  amount: number;
  isFocused: boolean;
  onFocus: () => void;
}) {
  return (
    <tr
      className={`border-b border-zinc-100 cursor-pointer select-none ${
        isFocused
          ? "bg-[#ffcc00] text-zinc-950 font-bold"
          : "hover:bg-zinc-50 text-zinc-800 italic font-semibold"
      }`}
      onClick={onFocus}
    >
      <td className="px-3 py-1.5 text-left">
        <span className="mr-1.5 text-zinc-300 text-[9px]">–</span>
        {label}
      </td>
      <td className="px-3 py-1.5 text-right whitespace-nowrap w-36 font-mono">
        {fmt(amount)}
      </td>
    </tr>
  );
}

interface PanelProps {
  title: string;
  rows: PLRowItem[];
  total: number;
  expandedIds: Set<string>;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onToggle: (id: string) => void;
  side: "E" | "I";
  periodLabel: string;
}

function Panel({
  title,
  rows,
  total,
  expandedIds,
  focusedId,
  onFocus,
  onToggle,
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-3 py-8 text-center text-zinc-400 italic text-[11px]">
                  No entries for this period.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                if (row.kind === "group") {
                  return (
                    <GroupRows
                      key={`${side}-g-${row.group.group_id}-d0`}
                      groups={[row.group]}
                      depth={0}
                      expandedIds={expandedIds}
                      focusedId={focusedId}
                      onFocus={onFocus}
                      onToggle={onToggle}
                      side={side}
                    />
                  );
                }
                const flatKey = `${side}-f-${row.key}`;
                return (
                  <FlatRow
                    key={flatKey}
                    label={row.label}
                    amount={row.amount}
                    isFocused={focusedId === flatKey}
                    onFocus={() => onFocus(flatKey)}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-double border-zinc-400 bg-[#e5eff5] px-3 py-1.5 flex justify-between font-mono text-[11px] font-bold text-zinc-900 select-none">
        <span>Total</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

export function ProfitLossLayout() {
  const { selectedCompany, activeFY } = useCompany();

  const [data, setData] = React.useState<PLData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const api = (window as any).api;
    if (!api?.report?.profitLoss) {
      setError("Backend handler 'report.profitLoss' isn't wired up yet.");
      setLoading(false);
      return;
    }

    api.report
      .profitLoss(selectedCompany.company_id, activeFY.fy_id)
      .then((res: any) => {
        if (res?.success) setData(res);
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id]);

  const toggle = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!focusedId) return;
      if (e.key === "Enter") {
        e.preventDefault();
        toggle(focusedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedId, toggle]);

  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading Profit &amp; Loss A/c...
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
          title="Particulars"
          rows={data.expenseRows}
          total={data.totalExpense}
          expandedIds={expandedIds}
          focusedId={focusedId}
          onFocus={setFocusedId}
          onToggle={toggle}
          side="E"
          periodLabel={periodLabel}
        />
        <Panel
          title="Particulars"
          rows={data.incomeRows}
          total={data.totalIncome}
          expandedIds={expandedIds}
          focusedId={focusedId}
          onFocus={setFocusedId}
          onToggle={toggle}
          side="I"
          periodLabel={periodLabel}
        />
      </div>
    </div>
  );
}