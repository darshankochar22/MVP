import * as React from "react";
import { useCompany } from "@/context/CompanyContext";

interface ItemRow {
  item_id: number;
  item_name: string;
  group_id: number | null;
  group_name: string;
  unit_name: string;
  closing_qty: number;
  closing_value: number;
  rate: number;
}

interface GroupRow {
  group_id: number | null;
  group_name: string;
  closing_qty: number;
  closing_value: number;
  item_count: number;
  items: ItemRow[];
}

interface StockSummaryData {
  items: ItemRow[];
  groups: GroupRow[];
  totalClosingQty: number;
  totalClosingValue: number;
  as_on_date: string | null;
}

// Matches BalanceSheetLayout's fmt() — plain Indian-grouped 2dp, sign handled
// separately by the caller (Tally shows negatives as "(-)1,234.00").
const fmt = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));

const fmtQty = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(val));

const signed = (val: number, formatted: string) => (val < 0 ? `(-)${formatted}` : formatted);

interface ItemRowsProps {
  items: ItemRow[];
  depth: number;
  focusedId: string | null;
  onFocus: (id: string) => void;
}

function ItemRows({ items, depth, focusedId, onFocus }: ItemRowsProps) {
  return (
    <>
      {items.map((item) => {
        const key = `i-${item.item_id}`;
        const isFocused = focusedId === key;
        return (
          <tr
            key={key}
            className={`border-b border-zinc-50 cursor-pointer select-none ${
              isFocused
                ? "bg-[#ffcc00] text-zinc-950 font-bold"
                : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
            }`}
            onClick={() => onFocus(key)}
          >
            <td
              className="px-3 py-1 text-left"
              style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
              {item.item_name}
            </td>
            <td className="px-3 py-1 text-right whitespace-nowrap w-28 font-mono">
              {item.closing_qty !== 0
                ? signed(item.closing_qty, `${fmtQty(item.closing_qty)} ${item.unit_name || ""}`.trim())
                : ""}
            </td>
            <td className="px-3 py-1 text-right whitespace-nowrap w-24 font-mono italic text-zinc-500">
              {item.closing_qty !== 0 && item.rate !== 0 ? fmt(item.rate) : ""}
            </td>
            <td className="px-3 py-1 text-right whitespace-nowrap w-32 font-mono">
              {item.closing_value !== 0 ? signed(item.closing_value, fmt(item.closing_value)) : ""}
            </td>
          </tr>
        );
      })}
    </>
  );
}

interface GroupRowsProps {
  groups: GroupRow[];
  expandedIds: Set<string>;
  focusedId: string | null;
  onFocus: (id: string) => void;
  onToggle: (id: string) => void;
}

function GroupRows({ groups, expandedIds, focusedId, onFocus, onToggle }: GroupRowsProps) {
  return (
    <>
      {groups.map((group) => {
        const key = `g-${group.group_id ?? "ungrouped"}`;
        const isExpanded = expandedIds.has(key);
        const isFocused = focusedId === key;
        const groupItems = group.items ?? [];
        const hasItems = groupItems.length > 0;

        return (
          <React.Fragment key={key}>
            <tr
              className={`border-b border-zinc-100 cursor-pointer transition-colors select-none ${
                isFocused
                  ? "bg-[#ffcc00] text-zinc-950 font-bold"
                  : "hover:bg-zinc-50 text-zinc-800 font-semibold"
              }`}
              onClick={() => onFocus(key)}
              onDoubleClick={() => hasItems && onToggle(key)}
            >
              <td className="px-3 py-1.5 text-left">
                {hasItems && (
                  <span className="mr-1.5 text-zinc-400 text-[9px]">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                )}
                {!hasItems && <span className="mr-1.5 text-zinc-300 text-[9px]">–</span>}
                {group.group_name}
              </td>
              <td className="px-3 py-1.5 text-right whitespace-nowrap w-28 font-mono">
                {group.closing_qty !== 0 ? signed(group.closing_qty, fmtQty(group.closing_qty)) : ""}
              </td>
              <td className="px-3 py-1.5 text-right whitespace-nowrap w-24 font-mono" />
              <td className="px-3 py-1.5 text-right whitespace-nowrap w-32 font-mono">
                {signed(group.closing_value, fmt(group.closing_value))}
              </td>
            </tr>

            {isExpanded && hasItems && (
              <ItemRows
                items={groupItems}
                depth={1}
                focusedId={focusedId}
                onFocus={onFocus}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

export function StockSummaryLayout() {
  const { selectedCompany, activeFY } = useCompany();

  const [data, setData] = React.useState<StockSummaryData | null>(null);
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
    (window as any).api.report
      .stockSummary(selectedCompany.company_id, activeFY.fy_id, activeFY.end_date, "FIFO")
      .then((res: any) => {
        if (res?.success) setData(res);
        else setError(res?.error || "Failed to load.");
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id, activeFY?.end_date]);

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

  const periodLabel = activeFY ? `1-Apr to ${activeFY.end_date}` : "";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading Stock Summary...
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
      <div className="bg-[#e5eff5] border-b border-zinc-200 px-3 py-1 flex justify-between items-center select-none">
        <span className="font-mono text-[11px] font-bold text-zinc-800 tracking-wide uppercase">
          Particulars
        </span>
        <span className="font-mono text-[10px] text-zinc-500">{periodLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 bg-[#e5eff5] border-b border-zinc-300 z-10">
            <tr>
              <th className="px-3 py-1 text-left font-bold text-zinc-700" />
              <th className="px-3 py-1 text-right font-bold text-zinc-700 w-28">Quantity</th>
              <th className="px-3 py-1 text-right font-bold italic text-zinc-700 w-24">Rate</th>
              <th className="px-3 py-1 text-right font-bold text-zinc-700 w-32">Value</th>
            </tr>
          </thead>
          <tbody>
            {(!data.groups || data.groups.length === 0) ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-zinc-400 italic text-[11px]">
                  No stock items found.
                </td>
              </tr>
            ) : (
              <GroupRows
                groups={data.groups}
                expandedIds={expandedIds}
                focusedId={focusedId}
                onFocus={setFocusedId}
                onToggle={toggle}
              />
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-double border-zinc-400 bg-[#e5eff5] px-3 py-1.5 flex justify-between font-mono text-[11px] font-bold text-zinc-900 select-none">
        <span>Grand Total</span>
        <span>{signed(data.totalClosingValue, fmt(data.totalClosingValue))}</span>
      </div>
    </div>
  );
}