import { useEffect, useMemo, useState, useRef } from "react";
import type { UnitType } from "../../../types/api";

interface LedgerListPanelProps {
  title: string;
  items: any[];
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onSelect: (item: any) => void;
  onClose: () => void;
  onCreateNew: () => void;
  createLabel: string;
  /** When provided (stock-item selection), shows an "End of List" row that ends item entry. */
  onEndOfList?: () => void;
  height?: string;
  stockBalances?: Record<number, number>;
  /** Per-godown balances (keyed by godown_id) for the item being entered — shown in the godown picker. */
  godownBalances?: Record<number, number>;
  /** Unit symbol appended to godown balances (the current item's unit). */
  balanceUnit?: string;
  allUnits?: UnitType[];
}

export default function LedgerListPanel({
  title,
  items,
  searchTerm,
  onSearchChange,
  onSelect,
  onClose,
  onCreateNew,
  createLabel,
  onEndOfList,
  height = "h-full",
  stockBalances,
  godownBalances,
  balanceUnit,
  allUnits,
}: LedgerListPanelProps) {
  const [hi, setHi] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (it) =>
          !searchTerm ||
          it.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (it.alias && it.alias.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [items, searchTerm]
  );

  useEffect(() => { setHi(0); }, [searchTerm]);

  useEffect(() => {
    const el = listRef.current?.querySelector("[data-hi]") as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setHi((p) => Math.min(p + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setHi((p) => Math.max(p - 1, 0)); }
      if (e.key === "Enter") { e.preventDefault(); if (filtered[hi]) onSelect(filtered[hi]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, hi, onSelect, onClose]);

  return (
    <div className={`w-64 border-l border-black flex flex-col shrink-0 bg-white ${height}`}>
      <div className="bg-black text-white px-2 py-1 text-xs font-semibold select-none flex justify-between items-center">
        <span>{title}</span>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 font-bold leading-none"
        >
          &times;
        </button>
      </div>

      <div className="border-b border-gray-300">
        <input
          autoFocus
          type="text"
          className="w-full text-xs outline-none px-2 py-1 bg-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search..."
        />
      </div>

      <div
        className="px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 border-b border-gray-200 text-black select-none"
        onClick={onCreateNew}
      >
        {createLabel}
      </div>

      {onEndOfList && (
        <div
          className="px-2 py-1 text-xs cursor-pointer hover:bg-gray-100 border-b border-gray-200 text-black select-none italic"
          onClick={onEndOfList}
        >
          &#9670; End of List
        </div>
      )}

      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
        {filtered.map((item, idx) => (
          <div
            key={item.ledger_id ?? item.item_id ?? item.godown_id ?? item.employee_id ?? item.attendance_type_id ?? item.pay_head_id ?? idx}
            data-hi={idx === hi ? "true" : undefined}
            className={`px-2 py-0.5 text-xs cursor-pointer select-none flex justify-between items-center ${
              idx === hi
                ? "bg-[#f0c040] text-black font-semibold"
                : "text-black hover:bg-gray-50"
            }`}
            onClick={() => onSelect(item)}
            onMouseEnter={() => setHi(idx)}
          >
            <span>{item.name}</span>
            {stockBalances && item.item_id != null && (
              <span className="text-[10px] text-gray-500 tabular-nums">
                {Number(stockBalances[item.item_id] ?? 0).toFixed(2)}{" "}
                {allUnits?.find((u) => u.unit_id === item.unit_id)?.symbol ?? ""}
              </span>
            )}
            {godownBalances && item.godown_id != null && (
              <span className="text-[10px] text-gray-500 tabular-nums">
                {Number(godownBalances[item.godown_id] ?? 0).toLocaleString("en-IN")}{balanceUnit ? ` ${balanceUnit}` : ""}
              </span>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-2 py-2 text-xs text-gray-400 italic">No results</div>
        )}
      </div>

      <div className="border-t border-gray-200 px-2 py-1 text-[10px] text-gray-500 select-none bg-gray-50">
        ↑↓ Navigate &nbsp;·&nbsp; Enter Select
      </div>
    </div>
  );
}
