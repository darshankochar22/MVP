

---
### File: ./components/AccountSection.tsx
---

import { useRef } from "react";
import type { LedgerType } from "../../../types/api";
import type { ActiveField } from "../hooks/useVoucherForm";

interface Props {
  ledger: LedgerType | null;
  balance: string;
  searchTerm: string;
  onFieldFocus: (field: ActiveField) => void;
  onSearchChange: (term: string) => void;
}

export default function AccountSection({ ledger, balance, searchTerm, onFieldFocus, onSearchChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-2">
      <div className="flex items-center min-h-[22px]">
        <label className="w-20 text-sm shrink-0 text-black">Account</label>
        <span className="text-sm mr-2 shrink-0 w-3 text-black">:</span>
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            className="w-full text-sm px-1 py-0.5 border outline-none bg-transparent focus:bg-gray-100 focus:border-black"
            value={ledger ? ledger.name : searchTerm}
            onFocus={() => onFieldFocus({ type: 'account' })}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (!ledger) onFieldFocus({ type: 'account' });
            }}
            placeholder="Account"
          />
        </div>
      </div>
      {balance && (
        <div className="flex items-center mt-0.5">
          <label className="w-20 text-sm shrink-0" />
          <span className="text-sm mr-2 shrink-0 w-3" />
          <span className="text-xs text-gray-500 italic">
            Current balance : {balance}
          </span>
        </div>
      )}
    </div>
  );
}


---
### File: ./components/ActionFooter.tsx
---

interface Props {
  onAccept: () => void;
  onCancelVch: () => void;
  onQuit: () => void;
  isSubmitting: boolean;
  canAccept: boolean;
}

export default function ActionFooter({ onAccept, onCancelVch, onQuit, isSubmitting, canAccept }: Props) {
  return (
    <div className="border-t border-black bg-white px-4 py-2 flex items-center justify-between">
      <button
        onClick={onQuit}
        className="text-sm px-3 py-1 text-gray-600 hover:text-black hover:underline"
      >
        <span className="underline decoration-dotted">Q</span>: Quit
      </button>

      <div className="flex items-center gap-3">
        <button
          onClick={onAccept}
          disabled={isSubmitting || !canAccept}
          className="text-sm px-5 py-1 rounded bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span className="underline decoration-dotted">A</span>: Accept
        </button>
        <button
          onClick={onCancelVch}
          className="text-sm px-3 py-1 text-gray-600 hover:text-black"
        >
          Cancel Vch
        </button>
      </div>
    </div>
  );
}


---
### File: ./components/InventoryParticularsTable.tsx
---

import type { StockEntryRow, ParticularRow, ActiveField } from "../hooks/useVoucherForm";
import type { GodownType, UnitType } from "../../../types/api";

interface Props {
  stockEntries: StockEntryRow[];
  additionalEntries: ParticularRow[];
  allGodowns: GodownType[];
  allUnits: UnitType[];
  activeField: ActiveField | null;
  searchTerm: string;
  stockSearchTerm: string;
  onFieldFocus: (field: ActiveField) => void;
  onSearchChange: (term: string) => void;
  onUpdateStockRow: (id: string, updates: Partial<Omit<StockEntryRow, 'id'>>) => void;
  onAddStockRow: () => void;
  onRemoveStockRow: (id: string) => void;
  onUpdateAdditionalRow: (id: string, updates: Partial<Omit<ParticularRow, 'id'>>) => void;
  onAddAdditionalRow: () => void;
  onRemoveAdditionalRow: (id: string) => void;
  onAmountConfirm?: (row: ParticularRow, index: number) => void;
}

export default function InventoryParticularsTable({
  stockEntries,
  additionalEntries,
  allGodowns,
  allUnits,
  activeField,
  searchTerm,
  stockSearchTerm,
  onFieldFocus,
  onSearchChange,
  onUpdateStockRow,
  onAddStockRow,
  onRemoveStockRow,
  onUpdateAdditionalRow,
  onAddAdditionalRow,
  onRemoveAdditionalRow,
  onAmountConfirm
}: Props) {

  // Key handlers to auto-add rows on Enter in stock grid
  const handleStockKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      const row = stockEntries[idx];
      if (row?.stockItem && Number(row.amountRaw) > 0 && idx === stockEntries.length - 1) {
        e.preventDefault();
        onAddStockRow();
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-stock-item="${stockEntries.length + 1}"]`);
          (nextInput as HTMLInputElement)?.focus();
        }, 50);
      }
    }
  };

  const handleAdditionalKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      const row = additionalEntries[idx];
      if (row?.ledger) {
        if (onAmountConfirm) {
          e.preventDefault();
          onAmountConfirm(row, idx);
        } else if (Number(row.amountRaw) > 0 && idx === additionalEntries.length - 1) {
          e.preventDefault();
          onAddAdditionalRow();
          setTimeout(() => {
            const nextInput = document.querySelector(`[data-additional-ledger="${additionalEntries.length + 1}"]`);
            (nextInput as HTMLInputElement)?.focus();
          }, 50);
        }
      }
    }
  };

  const stockSubtotal = stockEntries.reduce((sum, r) => sum + (Number(r.amountRaw) || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-xs">
      {/* Header Grid */}
      <div className="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600 font-bold uppercase tracking-wider select-none text-[10px]">
        <div className="col-span-5">Name of Item</div>
        <div className="col-span-2">Godown</div>
        <div className="col-span-1.5 text-right pr-2">Quantity</div>
        <div className="col-span-1.5 text-right pr-2">Rate</div>
        <div className="col-span-1">Unit</div>
        <div className="col-span-1 text-right">Amount</div>
      </div>

      {/* Main Stock entries */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 min-h-0">
        {stockEntries.map((row, idx) => {
          const isActive = activeField?.type === "stockItem" && activeField.rowId === row.id;
          return (
            <div key={row.id} className="grid grid-cols-12 items-center px-3 py-1.5 hover:bg-zinc-50/50 group transition-colors">
              
              {/* 1. Item Name */}
              <div className="col-span-5 relative flex items-center gap-1">
                <input
                  data-stock-item={idx + 1}
                  type="text"
                  className="w-full bg-transparent border-b border-transparent outline-none focus:border-zinc-800 text-zinc-900 placeholder-zinc-400 py-0.5"
                  placeholder="Select Stock Item..."
                  value={isActive ? stockSearchTerm : (row.stockItem ? row.stockItem.name : "")}
                  onFocus={() => onFieldFocus({ type: 'stockItem', rowId: row.id })}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    if (!row.stockItem) onFieldFocus({ type: 'stockItem', rowId: row.id });
                  }}
                />
                {stockEntries.length > 1 && (
                  <button
                    onClick={() => onRemoveStockRow(row.id)}
                    className="text-[10px] text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 font-sans font-bold"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* 2. Godown Dropdown */}
              <div className="col-span-2 px-1">
                <select
                  className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none py-0.5 text-zinc-800"
                  value={row.godown?.godown_id || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const selected = allGodowns.find(g => g.godown_id === id) || null;
                    onUpdateStockRow(row.id, { godown: selected });
                  }}
                >
                  <option value="">Select Godown</option>
                  {allGodowns.map(g => (
                    <option key={g.godown_id} value={g.godown_id}>{g.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Quantity */}
              <div className="col-span-1.5 px-1">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none text-right px-1 py-0.5 text-zinc-900"
                  placeholder="0.00"
                  value={row.quantityRaw}
                  onChange={(e) => onUpdateStockRow(row.id, { quantityRaw: e.target.value })}
                />
              </div>

              {/* 4. Rate */}
              <div className="col-span-1.5 px-1">
                <input
                  type="text"
                  className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none text-right px-1 py-0.5 text-zinc-900"
                  placeholder="0.00"
                  value={row.rateRaw}
                  onChange={(e) => onUpdateStockRow(row.id, { rateRaw: e.target.value })}
                  onKeyDown={(e) => handleStockKeyDown(e, idx)}
                />
              </div>

              {/* 5. Unit Selector/Display */}
              <div className="col-span-1 px-1">
                <select
                  className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none py-0.5 text-zinc-700"
                  value={row.unit?.unit_id || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    const selected = allUnits.find(u => u.unit_id === id) || null;
                    onUpdateStockRow(row.id, { unit: selected });
                  }}
                >
                  <option value="">—</option>
                  {allUnits.map(u => (
                    <option key={u.unit_id} value={u.unit_id}>{u.symbol}</option>
                  ))}
                </select>
              </div>

              {/* 6. Amount Display */}
              <div className="col-span-1 text-right font-bold text-zinc-900 pr-1 select-none">
                {row.amountRaw ? Number(row.amountRaw).toFixed(2) : "0.00"}
              </div>

            </div>
          );
        })}

        {/* Subtotal Row */}
        <div className="grid grid-cols-12 px-3 py-2 bg-zinc-50/50 border-t border-zinc-200 font-bold select-none text-zinc-700">
          <div className="col-span-7">Subtotal (Items)</div>
          <div className="col-span-4 text-right pr-2"></div>
          <div className="col-span-1 text-right font-bold text-zinc-800">
            {stockSubtotal.toFixed(2)}
          </div>
        </div>

        {/* Additional Tax ledger rows */}
        <div className="bg-white">
          <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50/30 border-b border-zinc-100 flex justify-between items-center select-none">
            <span>Additional Ledgers (Taxes & Adjustments)</span>
            <button
              type="button"
              onClick={onAddAdditionalRow}
              className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors uppercase font-sans font-bold"
            >
              + Add Ledger Row
            </button>
          </div>

          <div className="divide-y divide-zinc-50">
            {additionalEntries.map((row, idx) => {
              const isAddActive = activeField?.type === "additional" && activeField.rowId === row.id;
              return (
                <div key={row.id} className="grid grid-cols-12 items-center px-3 py-1.5 hover:bg-zinc-50/30 group transition-colors">
                  
                  {/* Dr/Cr Toggle */}
                  <div className="col-span-1 text-center font-bold">
                    <select
                      className="bg-transparent font-bold outline-none text-zinc-900 cursor-pointer"
                      value={row.type}
                      onChange={(e) => onUpdateAdditionalRow(row.id, { type: e.target.value as 'Dr' | 'Cr' })}
                    >
                      <option value="Dr">Dr</option>
                      <option value="Cr">Cr</option>
                    </select>
                  </div>

                  {/* Ledger search */}
                  <div className="col-span-6 relative flex items-center gap-1">
                    <input
                      data-additional-ledger={idx + 1}
                      type="text"
                      className="w-full bg-transparent border-b border-transparent outline-none focus:border-zinc-800 text-zinc-900 placeholder-zinc-400 py-0.5"
                      placeholder="Select Ledger (GST, round off, discount...)"
                      value={isAddActive ? searchTerm : (row.ledger ? row.ledger.name : "")}
                      onFocus={() => onFieldFocus({ type: 'additional', rowId: row.id })}
                      onChange={(e) => {
                        onSearchChange(e.target.value);
                        if (!row.ledger) onFieldFocus({ type: 'additional', rowId: row.id });
                      }}
                    />
                    {row.ledgerBalance && (
                      <span className="text-[10px] text-zinc-400 font-sans italic absolute right-2 select-none">
                        (Bal: {row.ledgerBalance})
                      </span>
                    )}
                    <button
                      onClick={() => onRemoveAdditionalRow(row.id)}
                      className="text-[10px] text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 font-sans font-bold"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Empty spaces matching columns */}
                  <div className="col-span-4" />

                  {/* Amount input */}
                  <div className="col-span-1 px-1">
                    <input
                      data-additional-amount={idx + 1}
                      type="text"
                      className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none text-right px-1 py-0.5 text-zinc-900 font-bold"
                      placeholder="0.00"
                      value={row.amountRaw}
                      onChange={(e) => onUpdateAdditionalRow(row.id, { amountRaw: e.target.value })}
                      onKeyDown={(e) => handleAdditionalKeyDown(e, idx)}
                    />
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}


---
### File: ./components/LedgerPanel.tsx
---

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { LedgerType, StockItemType, GodownType } from "../../../types/api";
import type { ActiveField } from "../hooks/useVoucherForm";
import { SearchInput } from "../../../components/ui";

interface Props {
  isOpen: boolean;
  activeField: ActiveField | null;
  ledgers: LedgerType[];
  stockItems: StockItemType[];
  godowns: GodownType[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (item: any) => void;
  onClose: () => void;
  checkIsCashOrBank: (ledger: LedgerType | null) => boolean;
  checkLedgerGroup: (ledger: LedgerType | null, targetGroupNames: string[]) => boolean;
  voucherType: string;
  onInlineCreate?: (type: "ledger" | "stockItem" | "godown") => void;
}

export default function LedgerPanel({
  isOpen,
  activeField,
  ledgers,
  stockItems,
  godowns,
  loading,
  searchTerm,
  onSearchChange,
  onSelect,
  onClose,
  checkIsCashOrBank,
  checkLedgerGroup,
  voucherType,
  onInlineCreate
}: Props) {
  const navigate = useNavigate();
  const [highlightIndex, setHighlightIndex] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // 1. Determine what content we are listing
  const isStockItem = activeField?.type === "stockItem";
  const isGodown = activeField?.type === "stockGodown";

  // 2. Filter the items list based on search and context-aware business rules
  let itemsList: any[] = [];
  let title = "List of Ledger Accounts";
  let createPath = "/master/create/ledger";
  let createLabel = "+ Create Ledger";

  if (isStockItem) {
    title = "List of Stock Items";
    createPath = "/master/create/stock-item";
    createLabel = "+ Create Stock Item";
    itemsList = stockItems.filter(item =>
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.alias && item.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  } else if (isGodown) {
    title = "List of Godowns";
    createPath = "/master/create/godown";
    createLabel = "+ Create Godown";
    itemsList = godowns.filter(godown =>
      !searchTerm ||
      godown.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } else {
    // Ledgers filtering logic
    let tempLedgers = ledgers;

    if (activeField?.type === "particular") {
      if (voucherType === "Contra") {
        tempLedgers = ledgers.filter(l => checkIsCashOrBank(l));
      }
    } else if (activeField?.type === "party") {
      title = "List of Party Ledgers";
      tempLedgers = ledgers.filter(l => checkLedgerGroup(l, ["bank accounts", "bank od accounts", "bank od a/c", "bank od account", "cash-in-hand", "sundry debtors", "sundry creditors"]));
    } else if (activeField?.type === "salesPurchase") {
      title = `List of ${voucherType} Ledgers`;
      tempLedgers = ledgers.filter(l => checkLedgerGroup(l, voucherType === "Sales" ? ["sales accounts"] : ["purchase accounts"]));
    }

    itemsList = tempLedgers.filter(l =>
      !searchTerm ||
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.alias && l.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  useEffect(() => {
    setHighlightIndex(0);
  }, [searchTerm, activeField]);

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, activeField]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex(i => Math.min(i + 1, itemsList.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex(i => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (itemsList.length > 0 && highlightIndex < itemsList.length) {
          onSelect(itemsList[highlightIndex]);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, itemsList, highlightIndex, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l border-zinc-200 flex flex-col shrink-0 bg-white shadow-lg animate-fade-in font-sans">
      <div className="bg-zinc-900 text-white px-3 py-2 text-xs font-semibold uppercase tracking-wider flex justify-between items-center select-none">
        <span>{title}</span>
        <button onClick={onClose} className="text-sm font-bold hover:text-zinc-300 transition-colors">&times;</button>
      </div>

      <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={`Search ${isStockItem ? 'items' : isGodown ? 'godowns' : 'accounts'}...`}
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100">
        <div
          className="px-3 py-2 text-xs cursor-pointer hover:bg-zinc-50 text-zinc-900 font-semibold flex items-center gap-1.5 transition-colors"
          onClick={() => {
            if (onInlineCreate) {
              const targetType = isStockItem ? "stockItem" : isGodown ? "godown" : "ledger";
              onInlineCreate(targetType);
            } else {
              navigate(createPath);
            }
          }}
        >
          <span className="text-zinc-400 font-normal">+</span> {createLabel}
        </div>
        {loading && (
          <div className="px-3 py-3 text-xs text-zinc-400 italic">Loading list...</div>
        )}
        {!loading && itemsList.length === 0 && (
          <div className="px-3 py-3 text-xs text-zinc-400 italic">No matching items found</div>
        )}
          {!loading && itemsList.map((item, idx) => {
            const isSelected = idx === highlightIndex;
            const balance = (item as LedgerType).closing_balance || (item as LedgerType).opening_balance;
            const balanceDisplay = balance ? (balance > 0 ? `${Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Dr` : `${Math.abs(balance).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`) : '';
            return (
              <div
                key={item.ledger_id || item.item_id || item.godown_id}
                className={`px-3 py-2 text-xs cursor-pointer flex justify-between items-center transition-colors ${
                  isSelected ? "bg-zinc-900 text-white font-medium" : "hover:bg-zinc-50 text-zinc-800"
                }`}
                onClick={() => onSelect(item)}
                onMouseEnter={() => setHighlightIndex(idx)}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate text-xs">{item.name}</span>
                  {item.alias && (
                    <span className={`text-[10px] truncate ${isSelected ? "text-zinc-300" : "text-zinc-400"}`}>
                      ({item.alias})
                    </span>
                  )}
                  {!isStockItem && !isGodown && balanceDisplay && (
                    <span className={`text-[10px] ${isSelected ? "text-zinc-300" : "text-zinc-500"} font-sans italic`}>
                      Bal: {balanceDisplay}
                    </span>
                  )}
                </div>
                {/* Extra context metadata based on type */}
                {!isStockItem && !isGodown && item.group_name && (
                  <span className={`text-[10px] shrink-0 ml-2 font-sans px-1.5 py-0.5 rounded ${
                    isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {item.group_name}
                  </span>
                )}
                {isStockItem && item.part_number && (
                  <span className={`text-[10px] shrink-0 ml-2 font-sans px-1.5 py-0.5 rounded ${
                    isSelected ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {item.part_number}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      <div className="px-3 py-1.5 text-[10px] text-zinc-400 border-t border-zinc-100 bg-zinc-50 select-none uppercase tracking-wider font-semibold">
        &bull; End of List
      </div>
    </div>
  );
}


---
### File: ./components/NarrationSection.tsx
---

import { formatIndianCurrency } from "../utils/formatCurrency";

interface Props {
  value: string;
  totalAmount: number;
  onChange: (value: string) => void;
}

export default function NarrationSection({ value, totalAmount, onChange }: Props) {
  return (
    <div className="flex items-center border-t border-black px-3 py-1.5 bg-white">
      <label className="text-sm shrink-0 text-black">Narration</label>
      <span className="text-sm mr-2 shrink-0 w-3 text-black">:</span>
      <input
        type="text"
        className="flex-1 text-sm bg-transparent border border-transparent px-1 py-0.5 outline-none focus:bg-gray-100 focus:border-black"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter narration..."
      />
      <span className="text-sm font-medium tabular-nums w-40 text-right px-2 text-black">
        {formatIndianCurrency(totalAmount)}
      </span>
    </div>
  );
}


---
### File: ./components/ParticularsTable.tsx
---

import { useRef } from "react";
import type { ParticularRow, ActiveField } from "../hooks/useVoucherForm";

interface Props {
  rows: ParticularRow[];
  onUpdateRow: (id: string, updates: Partial<Omit<ParticularRow, "id">>) => void;
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onFieldFocus: (field: ActiveField) => void;
  onSearchChange: (term: string) => void;
  searchTerm: string;
  activeRowId: string | null;
  isJournal?: boolean;
  onAmountConfirm?: (row: ParticularRow, index: number) => void;
  voucherType?: string;
  // FIX #1 — accept pre-computed totals from the hook instead of recalculating
  debitTotal?: number;
  creditTotal?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatAmount = (n: number): string =>
  n > 0
    ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";

// ─────────────────────────────────────────────────────────────────────────────

export default function ParticularsTable({
  rows,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
  onFieldFocus,
  onSearchChange,
  searchTerm,
  activeRowId,
  isJournal = false,
  onAmountConfirm,
  voucherType,
  debitTotal,
  creditTotal,
}: Props) {
  // FIX #3 — keep a ref to `rows` so the setTimeout inside handleAmountKeyDown
  // always reads the current length even after state has updated.
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  // FIX #9 — for Receipt/Payment the hook auto-assigns Dr/Cr, so we render a
  // static badge instead of an editable dropdown.  Journal and Contra still
  // show the full dropdown so the user can change the side.
  const isSingleEntry = ["Receipt", "Payment"].includes(voucherType ?? "");

  // ── Amount handlers ────────────────────────────────────────────────────────

  const handleAmountChange = (rowId: string, value: string) => {
    onUpdateRow(rowId, { amountRaw: value });
  };

  // FIX #5 — only Enter confirms; Tab lets the browser move focus naturally.
  const handleAmountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key !== "Enter") return;

    const row = rowsRef.current[idx];
    if (!row?.ledger) return;

    e.preventDefault();

    if (onAmountConfirm) {
      // Delegate to parent — may open bill-wise / cost-centre popup
      onAmountConfirm(row, idx);
    } else if (Number(row.amountRaw) > 0) {
      // Plain progression: add a new row if we are on the last one
      if (idx === rowsRef.current.length - 1) {
        onAddRow();
      }
      // FIX #3 — use ref so the length is fresh inside the setTimeout
      setTimeout(() => {
        const nextIdx = idx + 1;
        const next = document.querySelector(
          `[data-particular-ledger="${nextIdx + 1}"]`
        ) as HTMLInputElement | null;
        next?.focus();
      }, 50);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  // FIX #1 — prefer pre-computed props; fall back to local reduce only when
  // the parent hasn't wired them up yet (defensive).
  const drTotal =
    debitTotal ??
    rows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
  const crTotal =
    creditTotal ??
    rows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);

  const isBalanced = Math.abs(drTotal - crTotal) < 0.01;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-xs">

      {/* ── Table header ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600 font-bold uppercase tracking-wider select-none text-[10px]">
        <div className="col-span-1" />
        <div className="col-span-7">Particulars</div>
        <div className="col-span-2 text-right">Debit</div>
        <div className="col-span-2 text-right">Credit</div>
      </div>

      {/* ── Rows ──────────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 min-h-0">
        {rows.map((row, idx) => {
          const isActive = activeRowId === row.id;

          return (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center px-3 py-1.5 hover:bg-zinc-50/50 group transition-colors min-h-[42px]"
            >
              {/* ── Column 1: Dr / Cr indicator ─────────────────────────────── */}
              <div className="col-span-1 flex items-center justify-center">
                {isSingleEntry ? (
                  // FIX #9 — static badge: hook auto-assigns the correct side
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded select-none ${
                      row.type === "Dr"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    {row.type}
                  </span>
                ) : (
                  // Journal / Contra — user picks the side
                  <select
                    className="bg-transparent font-bold outline-none text-zinc-900 cursor-pointer text-xs"
                    value={row.type}
                    onChange={(e) =>
                      onUpdateRow(row.id, { type: e.target.value as "Dr" | "Cr" })
                    }
                  >
                    <option value="Dr">Dr</option>
                    <option value="Cr">Cr</option>
                  </select>
                )}
              </div>

              {/* ── Column 2: Ledger name / search input ──────────────────── */}
              <div className="col-span-7 relative flex items-center gap-1">
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <input
                    data-particular-ledger={idx + 1}
                    type="text"
                    className="w-full bg-transparent border-b border-transparent outline-none focus:border-zinc-800 text-zinc-900 placeholder-zinc-400 py-0.5 font-semibold"
                    value={isActive ? searchTerm : (row.ledger?.name ?? "")}
                    placeholder={idx === 0 ? "Select Particular Ledger…" : ""}
                    onFocus={() => onFieldFocus({ type: "particular", rowId: row.id })}
                    onChange={(e) => {
                      onSearchChange(e.target.value);
                      if (!row.ledger) onFieldFocus({ type: "particular", rowId: row.id });
                    }}
                  />
                  {row.ledgerBalance && (
                    <span className="text-[10px] text-zinc-400 font-sans italic select-none">
                      Current Bal: {row.ledgerBalance}
                    </span>
                  )}
                  {/* Bill-wise / cost-centre allocation indicators */}
                  {(row.billReferences?.length || row.costCentres?.length) ? (
                    <span className="text-[9px] text-zinc-400 font-sans select-none flex gap-2">
                      {row.billReferences?.length ? (
                        <span className="text-teal-600">
                          ✓ {row.billReferences.length} bill ref{row.billReferences.length > 1 ? "s" : ""}
                        </span>
                      ) : null}
                      {row.costCentres?.length ? (
                        <span className="text-blue-600">
                          ✓ {row.costCentres.length} cost centre{row.costCentres.length > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>

                {rows.length > 1 && (
                  <button
                    onClick={() => onRemoveRow(row.id)}
                    className="text-[10px] text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1 font-sans font-bold shrink-0"
                    tabIndex={-1}
                    aria-label="Remove row"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* ── Column 3: Debit amount ─────────────────────────────────── */}
              <div className="col-span-2 px-1">
                {row.type === "Dr" ? (
                  // Active side — editable
                  <input
                    data-particular-debit={idx + 1}
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none text-right px-1 py-0.5 text-zinc-900 font-bold"
                    value={row.amountRaw}
                    placeholder="0.00"
                    onChange={(e) => handleAmountChange(row.id, e.target.value)}
                    onKeyDown={(e) => handleAmountKeyDown(e, idx)}
                  />
                ) : (
                  // FIX #2 — inactive side: read-only display so switching
                  // type doesn't make the entered amount silently disappear
                  <span className="block text-right px-1 py-0.5 text-zinc-300 select-none">
                    —
                  </span>
                )}
              </div>

              {/* ── Column 4: Credit amount ────────────────────────────────── */}
              <div className="col-span-2 px-1">
                {row.type === "Cr" ? (
                  // Active side — editable
                  <input
                    data-particular-credit={idx + 1}
                    type="text"
                    inputMode="decimal"
                    className="w-full bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-zinc-800 outline-none text-right px-1 py-0.5 text-zinc-900 font-bold"
                    value={row.amountRaw}
                    placeholder="0.00"
                    onChange={(e) => handleAmountChange(row.id, e.target.value)}
                    onKeyDown={(e) => handleAmountKeyDown(e, idx)}
                  />
                ) : (
                  // FIX #2 — inactive side: read-only
                  <span className="block text-right px-1 py-0.5 text-zinc-300 select-none">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Totals row ────────────────────────────────────────────────────────── */}
      <div
        className={`border-t-2 px-3 py-2 ${
          isBalanced && drTotal > 0
            ? "border-zinc-300 bg-zinc-50"
            : drTotal > 0
            ? "border-amber-300 bg-amber-50/40"
            : "border-zinc-300 bg-zinc-50"
        }`}
      >
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-8 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider select-none">
            {drTotal > 0 && crTotal > 0 && !isBalanced && (
              <span className="text-amber-600">
                ⚠ Difference: {Math.abs(drTotal - crTotal).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
            {isBalanced && drTotal > 0 && (
              <span className="text-zinc-500">✓ Balanced</span>
            )}
          </div>
          {/* FIX #1 — uses pre-computed totals from props */}
          <div className="col-span-2 text-right font-bold text-zinc-900">
            {formatAmount(drTotal)}
          </div>
          <div className="col-span-2 text-right font-bold text-zinc-900">
            {formatAmount(crTotal)}
          </div>
        </div>
      </div>
    </div>
  );
}

---
### File: ./components/popups/BankAllocationPopup.tsx
---

import { useState, useEffect } from "react";

interface BankDetails {
  ledger_id: number;
  transaction_type: "Cheque" | "e-Fund Transfer" | "Card" | "Others";
  instrument_number: string;
  instrument_date: string;
  bank_name: string;
  branch: string;
  amount: number;
}

interface Props {
  ledgerId: number;
  ledgerName: string;
  amount: number;
  initialDetails?: Partial<BankDetails> | null;
  onClose: () => void;
  onSave: (details: BankDetails) => void;
}

export default function BankAllocationPopup({
  ledgerId,
  ledgerName,
  amount,
  initialDetails,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<BankDetails>({
    ledger_id: ledgerId,
    transaction_type: "Cheque",
    instrument_number: "",
    instrument_date: new Date().toISOString().split("T")[0],
    bank_name: "",
    branch: "",
    amount: amount,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialDetails) {
      setForm({
        ledger_id: ledgerId,
        transaction_type: initialDetails.transaction_type || "Cheque",
        instrument_number: initialDetails.instrument_number || "",
        instrument_date: initialDetails.instrument_date || new Date().toISOString().split("T")[0],
        bank_name: initialDetails.bank_name || "",
        branch: initialDetails.branch || "",
        amount: initialDetails.amount ?? amount,
      });
    } else {
      setForm(prev => ({
        ...prev,
        ledger_id: ledgerId,
        amount: amount,
      }));
    }
  }, [ledgerId, amount, initialDetails]);

  // Alt+A and Escape shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form]);

  const handleChange = (field: keyof BankDetails, value: any) => {
    setError(null);
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // If cheque, let's validate instrument number is entered for quality check, or allow empty
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-2xl w-[450px] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Bank Allocations</span>
            <span className="text-[10px] text-zinc-400 font-mono">Ledger: {ledgerName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>

        {/* Info panel */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <span>Allocation Amount:</span>
          <span className="font-mono text-zinc-900 text-sm">₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Form Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 min-h-0">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-1.5 rounded flex justify-between items-center font-medium animate-slide-down">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 font-bold">&times;</button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Transaction Type</label>
              <select
                value={form.transaction_type}
                onChange={e => handleChange("transaction_type", e.target.value as any)}
                className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-semibold"
              >
                <option value="Cheque">Cheque</option>
                <option value="e-Fund Transfer">e-Fund Transfer</option>
                <option value="Card">Card</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {form.transaction_type === "Cheque" ? "Cheque Number" : "Transaction Ref Number"}
              </label>
              <input
                type="text"
                value={form.instrument_number}
                onChange={e => handleChange("instrument_number", e.target.value)}
                placeholder="e.g. 104829"
                className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-mono font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Instrument Date</label>
              <input
                type="date"
                value={form.instrument_date}
                onChange={e => handleChange("instrument_date", e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-mono font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Bank Name</label>
              <input
                type="text"
                value={form.bank_name}
                onChange={e => handleChange("bank_name", e.target.value)}
                placeholder="e.g. State Bank of India"
                className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Branch Name</label>
              <input
                type="text"
                value={form.branch}
                onChange={e => handleChange("branch", e.target.value)}
                placeholder="e.g. MG Road Branch"
                className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500 font-medium">Shortcuts: Alt+A Accept / Esc Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-5 py-1.5 rounded bg-zinc-950 text-white hover:bg-zinc-800 font-semibold shadow-sm transition-all hover:shadow active:scale-95 duration-100"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


---
### File: ./components/popups/BillWiseAllocationPopup.tsx
---

import { useState, useEffect } from "react";

interface BillReference {
  ledger_id: number;
  bill_name: string;
  bill_type: "New Ref" | "Agst Ref" | "Advance" | "On Account";
  amount: number;
  credit_period?: string;
}

interface Props {
  ledgerId: number;
  ledgerName: string;
  totalAmount: number;
  initialAllocations?: BillReference[];
  onClose: () => void;
  onSave: (allocations: BillReference[]) => void;
}

export default function BillWiseAllocationPopup({
  ledgerId,
  ledgerName,
  totalAmount,
  initialAllocations = [],
  onClose,
  onSave,
}: Props) {
  const [allocations, setAllocations] = useState<BillReference[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize allocations
  useEffect(() => {
    if (initialAllocations.length > 0) {
      setAllocations(initialAllocations.map(a => ({ ...a, ledger_id: ledgerId })));
    } else {
      // Create a default single allocation matching the total amount
      setAllocations([
        {
          ledger_id: ledgerId,
          bill_name: "",
          bill_type: "New Ref",
          amount: totalAmount,
          credit_period: "",
        },
      ]);
    }
  }, [ledgerId, totalAmount, initialAllocations]);

  const allocatedTotal = allocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remaining = totalAmount - allocatedTotal;

  // Alt+A and Escape keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allocations, remaining]);

  const handleAddRow = () => {
    if (Math.abs(remaining) < 0.01) {
      setError("Total amount is already fully allocated.");
      return;
    }
    setError(null);
    setAllocations(prev => [
      ...prev,
      {
        ledger_id: ledgerId,
        bill_name: "",
        bill_type: remaining > 0 ? "New Ref" : "On Account",
        amount: Math.abs(remaining),
        credit_period: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (allocations.length === 1) {
      setError("At least one allocation row is required.");
      return;
    }
    setError(null);
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof BillReference, value: any) => {
    setError(null);
    setAllocations(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        // If changing type to 'On Account', usually the bill name is empty or 'On Account'
        if (field === "bill_type" && value === "On Account") {
          updated.bill_name = "On Account";
        }
        return updated;
      })
    );
  };

  const handleSave = () => {
    if (allocations.some(a => !a.bill_name.trim())) {
      setError("Bill name is required for all references.");
      return;
    }

    if (Math.abs(remaining) >= 0.01) {
      setError(`Allocation mismatch. Remaining: ₹${remaining.toFixed(2)}. Sum must equal ₹${totalAmount.toFixed(2)}.`);
      return;
    }

    onSave(allocations);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-2xl w-[600px] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Bill-wise Allocations</span>
            <span className="text-[10px] text-zinc-400 font-mono">Ledger: {ledgerName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>

        {/* Info panel */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <div>
            <span>Total Bill Value: </span>
            <span className="font-mono text-zinc-900 text-sm">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-zinc-500">Allocated: </span>
              <span className="font-mono text-emerald-700">₹{allocatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-zinc-500">Remaining: </span>
              <span className={`font-mono ${Math.abs(remaining) < 0.01 ? "text-zinc-500" : remaining > 0 ? "text-amber-600" : "text-rose-600"}`}>
                ₹{remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Table & Form */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-0">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded flex justify-between items-center font-medium animate-slide-down">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 font-bold">&times;</button>
            </div>
          )}

          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 bg-zinc-100 border-b border-zinc-200 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="col-span-3">Type of Ref</div>
              <div className="col-span-4">Name</div>
              <div className="col-span-2 text-center">Cr Days</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-1" />
            </div>

            {/* Table Body */}
            <div className="divide-y divide-zinc-100">
              {allocations.map((item, index) => (
                <div key={index} className="grid grid-cols-12 items-center px-3 py-2 bg-white gap-2">
                  <div className="col-span-3">
                    <select
                      value={item.bill_type}
                      onChange={e => handleChange(index, "bill_type", e.target.value)}
                      className="text-xs px-2 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-medium"
                    >
                      <option value="New Ref">New Ref</option>
                      <option value="Agst Ref">Agst Ref</option>
                      <option value="Advance">Advance</option>
                      <option value="On Account">On Account</option>
                    </select>
                  </div>

                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.bill_name}
                      disabled={item.bill_type === "On Account"}
                      onChange={e => handleChange(index, "bill_name", e.target.value)}
                      placeholder={item.bill_type === "On Account" ? "On Account" : "Ref name"}
                      className="text-xs px-2.5 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full disabled:bg-zinc-50 disabled:text-zinc-400 font-semibold"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="text"
                      value={item.credit_period || ""}
                      disabled={item.bill_type === "On Account"}
                      onChange={e => handleChange(index, "credit_period", e.target.value)}
                      placeholder="e.g. 30"
                      className="text-xs px-2 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-center w-full disabled:bg-zinc-50 disabled:text-zinc-400 font-mono font-medium"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount || ""}
                      onChange={e => handleChange(index, "amount", Number(e.target.value) || 0)}
                      className="text-xs px-2 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-mono font-semibold"
                    />
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => handleRemoveRow(index)}
                      className="text-zinc-400 hover:text-rose-600 text-sm font-bold font-sans transition-colors"
                      title="Remove Row"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleAddRow}
            className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded px-2.5 py-1 hover:bg-zinc-50 transition-colors flex items-center gap-1 select-none"
          >
            <span>+</span> Add Split Row
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500 font-medium">Shortcuts: Alt+A Accept / Esc Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-5 py-1.5 rounded bg-zinc-950 text-white hover:bg-zinc-800 font-semibold shadow-sm transition-all hover:shadow active:scale-95 duration-100"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


---
### File: ./components/popups/CostCentreAllocationPopup.tsx
---

import { useState, useEffect } from "react";
import type { CostCentreType } from "@/types/api";

interface CostCentreAllocation {
  cost_centre_id: number;
  amount: number;
}

interface Props {
  companyId: number;
  ledgerName: string;
  totalAmount: number;
  initialAllocations?: CostCentreAllocation[];
  onClose: () => void;
  onSave: (allocations: CostCentreAllocation[]) => void;
}

export default function CostCentreAllocationPopup({
  companyId,
  ledgerName,
  totalAmount,
  initialAllocations = [],
  onClose,
  onSave,
}: Props) {
  const [costCentres, setCostCentres] = useState<CostCentreType[]>([]);
  const [allocations, setAllocations] = useState<CostCentreAllocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cost centres list
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await window.api.costCentre.getAll(companyId);
        if (!active) return;
        if (res.success) {
          setCostCentres(res.costCentres || []);
        } else {
          setError(res.error || "Failed to load cost centres.");
        }
      } catch (err: any) {
        console.error("Failed to load cost centres", err);
        setError("Error loading cost centres.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [companyId]);

  // Initialize allocations state
  useEffect(() => {
    if (initialAllocations.length > 0) {
      setAllocations(initialAllocations.map(a => ({ ...a })));
    } else if (costCentres.length > 0) {
      // Setup a default split
      setAllocations([
        {
          cost_centre_id: costCentres[0].cc_id!,
          amount: totalAmount,
        },
      ]);
    }
  }, [costCentres, totalAmount, initialAllocations]);

  const allocatedTotal = allocations.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const remaining = totalAmount - allocatedTotal;

  // Shortcuts Alt+A and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [allocations, remaining]);

  const handleAddRow = () => {
    if (costCentres.length === 0) {
      setError("No cost centres available.");
      return;
    }
    if (Math.abs(remaining) < 0.01) {
      setError("Voucher row amount is already fully allocated.");
      return;
    }
    setError(null);
    setAllocations(prev => [
      ...prev,
      {
        cost_centre_id: costCentres[0].cc_id!,
        amount: Math.abs(remaining),
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (allocations.length === 1) {
      setError("At least one cost centre allocation is required.");
      return;
    }
    setError(null);
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof CostCentreAllocation, value: number) => {
    setError(null);
    setAllocations(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = () => {
    if (allocations.some(a => !a.cost_centre_id)) {
      setError("Please select a cost centre for all entries.");
      return;
    }

    // Check duplicate cost centres
    const ids = allocations.map(a => a.cost_centre_id);
    const hasDuplicates = ids.some((val, i) => ids.indexOf(val) !== i);
    if (hasDuplicates) {
      setError("Duplicate cost centre selections. Merge or remove duplicates.");
      return;
    }

    if (Math.abs(remaining) >= 0.01) {
      setError(`Allocation mismatch. Remaining: ₹${remaining.toFixed(2)}. Sum must equal ₹${totalAmount.toFixed(2)}.`);
      return;
    }

    onSave(allocations);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-2xl w-[500px] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Cost Centre Allocations</span>
            <span className="text-[10px] text-zinc-400 font-mono">Ledger: {ledgerName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>

        {/* Info panel */}
        <div className="bg-zinc-50 border-b border-zinc-200 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-zinc-700">
          <div>
            <span>Total Value: </span>
            <span className="font-mono text-zinc-900 text-sm">₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-zinc-500">Allocated: </span>
              <span className="font-mono text-emerald-700">₹{allocatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="text-zinc-500">Remaining: </span>
              <span className={`font-mono ${Math.abs(remaining) < 0.01 ? "text-zinc-500" : remaining > 0 ? "text-amber-600" : "text-rose-600"}`}>
                ₹{remaining.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Table & Form */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-0">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3 py-2 rounded flex justify-between items-center font-medium animate-slide-down">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="text-rose-500 font-bold">&times;</button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-6 text-zinc-500 text-xs italic">Loading cost centres…</div>
          ) : costCentres.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 text-xs bg-zinc-50 rounded border border-zinc-200">
              No cost centres found. Go to Master Creation to add a Cost Centre first.
            </div>
          ) : (
            <>
              <div className="border border-zinc-200 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 bg-zinc-100 border-b border-zinc-200 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  <div className="col-span-7">Cost Centre</div>
                  <div className="col-span-4 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>

                {/* Table Body */}
                <div className="divide-y divide-zinc-100">
                  {allocations.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 items-center px-3 py-2 bg-white gap-2">
                      <div className="col-span-7">
                        <select
                          value={item.cost_centre_id}
                          onChange={e => handleChange(index, "cost_centre_id", Number(e.target.value))}
                          className="text-xs px-2 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-semibold"
                        >
                          {costCentres.map(cc => (
                            <option key={cc.cc_id} value={cc.cc_id}>{cc.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount || ""}
                          onChange={e => handleChange(index, "amount", Number(e.target.value) || 0)}
                          className="text-xs px-2 py-1 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-mono font-semibold"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => handleRemoveRow(index)}
                          className="text-zinc-400 hover:text-rose-600 text-sm font-bold font-sans transition-colors"
                          title="Remove Row"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddRow}
                className="text-[10px] uppercase tracking-wider font-bold text-zinc-600 hover:text-zinc-900 border border-zinc-300 rounded px-2.5 py-1 hover:bg-zinc-50 transition-colors flex items-center gap-1 select-none"
              >
                <span>+</span> Add Cost Centre Split
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500 font-medium">Shortcuts: Alt+A Accept / Esc Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={costCentres.length === 0}
              className="text-xs px-5 py-1.5 rounded bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50 font-semibold shadow-sm transition-all hover:shadow active:scale-95 duration-100"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


---
### File: ./components/popups/DatePickerPopup.tsx
---

import { useEffect, useState, useCallback } from "react";

interface Props {
  initialDate: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  label?: string;
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DatePickerPopup({ initialDate, onClose, onConfirm, label = "Date" }: Props) {
  const [viewDate, setViewDate] = useState(new Date(initialDate || Date.now()));
  const [selectedDate, setSelectedDate] = useState(new Date(initialDate || Date.now()));
  const [highlightedDay, setHighlightedDay] = useState(0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDay = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = useCallback((day: number) => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
  }, [year, month]);

  const handleConfirm = () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    onConfirm(dateStr);
    onClose();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setHighlightedDay(prev => Math.min(prev + 1, daysInMonth - 1));
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setHighlightedDay(prev => Math.max(prev - 1, 0));
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedDay(prev => Math.min(prev + 7, daysInMonth - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedDay(prev => Math.max(prev - 7, 0));
      }
      if (e.key === "Home") {
        e.preventDefault();
        setHighlightedDay(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        setHighlightedDay(daysInMonth - 1);
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        handlePrevMonth();
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        handleNextMonth();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, handleConfirm, daysInMonth, year, month]);

  const renderCalendarDays = () => {
    const weeks = [];
    let dayCounter = 1;
    let nextMonthDay = 1;
    let weekIndex = 0;

    while (dayCounter <= daysInMonth || weekIndex < startingDay / 7 + 1) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        if (weekIndex === 0 && i < startingDay) {
          const prevMonthDay = daysInPrevMonth - startingDay + i + 1;
          week.push(
            <div
              key={`prev-${i}`}
              className="h-8 w-8 flex items-center justify-center text-xs text-zinc-400"
            >
              {prevMonthDay}
            </div>
          );
        } else if (dayCounter > daysInMonth) {
          week.push(
            <div
              key={`next-${nextMonthDay}`}
              className="h-8 w-8 flex items-center justify-center text-xs text-zinc-400"
            >
              {nextMonthDay++}
            </div>
          );
        } else {
          const isHighlighted = dayCounter - 1 === highlightedDay;
          week.push(
            <div
              key={`day-${dayCounter}`}
              className={`h-8 w-8 flex items-center justify-center text-xs cursor-pointer transition-colors ${
                isHighlighted
                  ? "bg-zinc-900 text-white font-bold"
                  : isSelected(dayCounter)
                  ? "bg-blue-600 text-white font-bold"
                  : isToday(dayCounter)
                  ? "bg-blue-100 text-blue-700 font-bold border border-blue-300"
                  : "hover:bg-zinc-100 text-zinc-800"
              }`}
              onClick={() => {
                handleDaySelect(dayCounter);
                setHighlightedDay(dayCounter - 1);
              }}
              onMouseEnter={() => setHighlightedDay(dayCounter - 1)}
            >
              {dayCounter}
            </div>
          );
          dayCounter++;
        }
      }
      weeks.push(
        <div key={`week-${weekIndex}`} className="flex">
          {week}
        </div>
      );
      weekIndex++;
      if (dayCounter > daysInMonth) break;
    }

    return weeks;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl border border-zinc-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-zinc-900 text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider flex justify-between items-center">
          <span>{label} Selection</span>
          <button onClick={onClose} className="text-sm font-bold hover:text-zinc-300 transition-colors">&times;</button>
        </div>

        <div className="p-4">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-zinc-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-bold text-zinc-800">
              {monthNames[month]} {year}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-zinc-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(day => (
              <div key={day} className="h-8 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="flex flex-col">
            {renderCalendarDays()}
          </div>

          {/* Selected Date Display */}
          <div className="mt-4 pt-3 border-t border-zinc-200">
            <div className="flex items-center justify-between">
              <div className="text-xs text-zinc-600">
                Selected: <span className="font-bold text-zinc-900">{selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-1 text-xs bg-zinc-900 text-white hover:bg-zinc-800 rounded transition-colors font-semibold"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-200">
          <div className="text-[10px] text-zinc-500 flex justify-between">
            <span>↑↓←→ Navigate</span>
            <span>Enter: Accept</span>
            <span>Esc: Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
}


---
### File: ./components/popups/InlineMasterPopup.tsx
---

import { useState, useEffect, useRef } from "react";
import type { GroupType } from "@/types/api";

interface Props {
  companyId: number;
  initialType?: "ledger" | "stockItem" | "godown";
  onClose: () => void;
  onSuccess: (type: "ledger" | "stockItem" | "godown", created: any) => void;
}

export default function InlineMasterPopup({ companyId, initialType = "ledger", onClose, onSuccess }: Props) {
  const [type, setType] = useState<"ledger" | "stockItem" | "godown">(initialType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists for dropdowns
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [stockGroups, setStockGroups] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Focus ref for name input
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Forms states
  const [ledgerForm, setLedgerForm] = useState({
    name: "",
    alias: "",
    group_id: "",
    opening_balance: 0,
    is_bill_wise: 0,
    allow_cost_centres: 0,
  });

  const [stockItemForm, setStockItemForm] = useState({
    name: "",
    alias: "",
    group_id: "",
    unit_id: "",
    opening_qty: 0,
    opening_rate: 0,
    opening_value: 0,
  });

  const [godownForm, setGodownForm] = useState({
    name: "",
    alias: "",
    address: "",
  });

  // Load lists
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [gRes, sgRes, uRes] = await Promise.all([
          window.api.group.getAll(companyId),
          window.api.stockGroup.getAll(companyId),
          window.api.unit.getAll(companyId),
        ]);
        if (!active) return;
        if (gRes.success) {
          setGroups(gRes.groups || []);
          // Set default group to "Capital Account" or first group
          const defaultGroup = gRes.groups?.find((g: any) => g.name === "Capital Account") || gRes.groups?.[0];
          if (defaultGroup) {
            setLedgerForm(prev => ({ ...prev, group_id: String(defaultGroup.group_id) }));
          }
        }
        if (sgRes.success) {
          setStockGroups(sgRes.stockGroups || []);
          if (sgRes.stockGroups?.[0]) {
            setStockItemForm(prev => ({ ...prev, group_id: String(sgRes.stockGroups[0].sg_id) }));
          }
        }
        if (uRes.success) {
          setUnits(uRes.units || []);
          if (uRes.units?.[0]) {
            setStockItemForm(prev => ({ ...prev, unit_id: String(uRes.units[0].unit_id) }));
          }
        }
      } catch (err) {
        console.error("Failed to load options for inline creation", err);
      }
    })();
    return () => { active = false; };
  }, [companyId]);

  // Autofocus on mount or type change
  useEffect(() => {
    nameInputRef.current?.focus();
  }, [type]);

  // Alt+A keyboard listener inside popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [type, ledgerForm, stockItemForm, godownForm, groups, stockGroups, units]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (type === "ledger") {
        if (!ledgerForm.name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const payload = {
          company_id: companyId,
          name: ledgerForm.name.trim(),
          alias: ledgerForm.alias.trim() || undefined,
          group_id: ledgerForm.group_id ? Number(ledgerForm.group_id) : undefined,
          opening_balance: Number(ledgerForm.opening_balance) || 0,
          is_bill_wise: ledgerForm.is_bill_wise,
          allow_cost_centres: ledgerForm.allow_cost_centres,
          ledger_type: "General",
          registration_type: "Unregistered",
        };
        const res = await window.api.ledger.create(payload);
        if (res.success && res.ledger) {
          onSuccess("ledger", res.ledger);
        } else {
          setError(res.error || "Failed to create ledger.");
        }
      } else if (type === "stockItem") {
        if (!stockItemForm.name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const payload = {
          company_id: companyId,
          name: stockItemForm.name.trim(),
          alias: stockItemForm.alias.trim() || undefined,
          group_id: stockItemForm.group_id ? Number(stockItemForm.group_id) : undefined,
          unit_id: stockItemForm.unit_id ? Number(stockItemForm.unit_id) : undefined,
          opening_qty: Number(stockItemForm.opening_qty) || 0,
          opening_rate: Number(stockItemForm.opening_rate) || 0,
          opening_value: Number(stockItemForm.opening_value) || 0,
        };
        const res = await window.api.stockItem.create(payload);
        if (res.success && res.item) {
          onSuccess("stockItem", res.item);
        } else {
          setError(res.error || "Failed to create stock item.");
        }
      } else if (type === "godown") {
        if (!godownForm.name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        const payload = {
          company_id: companyId,
          name: godownForm.name.trim(),
          alias: godownForm.alias.trim() || undefined,
          address: godownForm.address.trim() || undefined,
        };
        const res = await window.api.godown.create(payload);
        if (res.success && res.godown) {
          onSuccess("godown", res.godown);
        } else {
          setError(res.error || "Failed to create godown.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-xl w-[480px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <span className="text-xs font-bold uppercase tracking-wider">Inline Master Creation</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm leading-none">&times;</button>
        </div>

        {/* Master Type Selection */}
        <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 flex gap-4 select-none">
          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-zinc-700">
            <input
              type="radio"
              checked={type === "ledger"}
              onChange={() => setType("ledger")}
              className="accent-zinc-900"
            />
            Ledger
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-zinc-700">
            <input
              type="radio"
              checked={type === "stockItem"}
              onChange={() => setType("stockItem")}
              className="accent-zinc-900"
            />
            Stock Item
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer text-zinc-700">
            <input
              type="radio"
              checked={type === "godown"}
              onChange={() => setType("godown")}
              className="accent-zinc-900"
            />
            Godown
          </label>
        </div>

        {/* Content & Form */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-0">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded flex justify-between items-center font-medium">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="text-red-500 font-bold">&times;</button>
            </div>
          )}

          {/* LEDGER FORM */}
          {type === "ledger" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={ledgerForm.name}
                  onChange={e => setLedgerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Sales Account"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 transition-colors w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Alias</label>
                <input
                  type="text"
                  value={ledgerForm.alias}
                  onChange={e => setLedgerForm(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Optional alias"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 transition-colors w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Under Group</label>
                <select
                  value={ledgerForm.group_id}
                  onChange={e => setLedgerForm(prev => ({ ...prev, group_id: e.target.value }))}
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-medium"
                >
                  {groups.map(g => (
                    <option key={g.group_id} value={g.group_id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={ledgerForm.opening_balance}
                  onChange={e => setLedgerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) || 0 }))}
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center justify-between border border-zinc-200 rounded p-2 bg-zinc-50">
                  <span className="text-xs font-semibold text-zinc-600">Bill-wise Details?</span>
                  <select
                    value={ledgerForm.is_bill_wise}
                    onChange={e => setLedgerForm(prev => ({ ...prev, is_bill_wise: Number(e.target.value) }))}
                    className="text-xs outline-none bg-transparent font-bold text-zinc-800 cursor-pointer"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border border-zinc-200 rounded p-2 bg-zinc-50">
                  <span className="text-xs font-semibold text-zinc-600">Cost Centres?</span>
                  <select
                    value={ledgerForm.allow_cost_centres}
                    onChange={e => setLedgerForm(prev => ({ ...prev, allow_cost_centres: Number(e.target.value) }))}
                    className="text-xs outline-none bg-transparent font-bold text-zinc-800 cursor-pointer"
                  >
                    <option value={0}>No</option>
                    <option value={1}>Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STOCK ITEM FORM */}
          {type === "stockItem" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Item Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={stockItemForm.name}
                  onChange={e => setStockItemForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Dell Monitor 24"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Alias</label>
                <input
                  type="text"
                  value={stockItemForm.alias}
                  onChange={e => setStockItemForm(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Optional alias"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stock Group</label>
                  <select
                    value={stockItemForm.group_id}
                    onChange={e => setStockItemForm(prev => ({ ...prev, group_id: e.target.value }))}
                    className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-medium"
                  >
                    {stockGroups.map(sg => (
                      <option key={sg.group_id} value={sg.group_id}>{sg.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Unit of Measure</label>
                  <select
                    value={stockItemForm.unit_id}
                    onChange={e => setStockItemForm(prev => ({ ...prev, unit_id: e.target.value }))}
                    className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 bg-white w-full font-medium"
                  >
                    {units.map(u => (
                      <option key={u.unit_id} value={u.unit_id}>{u.symbol} ({u.formal_name})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 mt-2" />
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Opening Balance Details</div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Qty</label>
                  <input
                    type="number"
                    value={stockItemForm.opening_qty}
                    onChange={e => {
                      const qty = Number(e.target.value) || 0;
                      setStockItemForm(prev => ({
                        ...prev,
                        opening_qty: qty,
                        opening_value: qty * prev.opening_rate
                      }));
                    }}
                    className="text-xs px-2 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Rate</label>
                  <input
                    type="number"
                    value={stockItemForm.opening_rate}
                    onChange={e => {
                      const rate = Number(e.target.value) || 0;
                      setStockItemForm(prev => ({
                        ...prev,
                        opening_rate: rate,
                        opening_value: prev.opening_qty * rate
                      }));
                    }}
                    className="text-xs px-2 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Value</label>
                  <input
                    type="number"
                    value={stockItemForm.opening_value}
                    onChange={e => setStockItemForm(prev => ({ ...prev, opening_value: Number(e.target.value) || 0 }))}
                    className="text-xs px-2 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 text-right w-full font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* GODOWN FORM */}
          {type === "godown" && (
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Godown Name</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={godownForm.name}
                  onChange={e => setGodownForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Warehouse A"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Alias</label>
                <input
                  type="text"
                  value={godownForm.alias}
                  onChange={e => setGodownForm(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Optional alias"
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 w-full font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Address</label>
                <textarea
                  value={godownForm.address}
                  onChange={e => setGodownForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street details, city, etc."
                  rows={3}
                  className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 resize-none w-full font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500 font-medium">Shortcuts: Alt+A Accept / Esc Close</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-xs px-5 py-1.5 rounded bg-zinc-950 text-white hover:bg-zinc-800 disabled:opacity-50 font-semibold shadow-sm transition-all hover:shadow active:scale-95 duration-100"
            >
              {loading ? "Creating..." : "Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


---
### File: ./components/StatusDropdown.tsx
---

import { useEffect, useState, useRef } from "react";

interface Props {
  status: "Regular" | "Post-Dated";
  onChange: (status: "Regular" | "Post-Dated") => void;
  disabled?: boolean;
}

export default function StatusDropdown({ status, onChange, disabled = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(status === "Regular" ? 0 : 1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: Array<"Regular" | "Post-Dated"> = ["Regular", "Post-Dated"];

  const handleSelect = (option: "Regular" | "Post-Dated") => {
    onChange(option);
    setIsOpen(false);
  };

  useEffect(() => {
    setHighlightedIndex(status === "Regular" ? 0 : 1);
  }, [status]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSelect(options[highlightedIndex]);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, highlightedIndex, options]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</span>
        <span className="text-zinc-400">:</span>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`text-xs px-2 py-0.5 rounded transition-colors font-semibold ${
            status === "Post-Dated"
              ? "bg-white text-zinc-700 hover:bg-zinc-50"
              : "bg-white text-zinc-700 hover:bg-zinc-50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {status}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded shadow-lg z-50 min-w-[140px] overflow-hidden">
          <div className="bg-zinc-100 px-3 py-1.5 text-[10px] font-bold text-zinc-600 uppercase tracking-wider border-b border-zinc-200">
            Select Status
          </div>
          {options.map((option, idx) => (
            <div
              key={option}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                idx === highlightedIndex
                  ? "bg-zinc-900 text-white font-semibold"
                  : "hover:bg-zinc-50 text-zinc-800"
              }`}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {option}
            </div>
          ))}
          <div className="px-3 py-1.5 text-[10px] text-zinc-400 bg-zinc-50 border-t border-zinc-100">
            ↑↓ Navigate • Enter: Select
          </div>
        </div>
      )}
    </div>
  );
}


---
### File: ./components/VoucherHeader.tsx
---

import { useState } from "react";
import DatePickerPopup from "./popups/DatePickerPopup";
import StatusDropdown from "./StatusDropdown";

interface Props {
  voucherType: string;
  voucherNumber: string;
  dateDisplay: string;
  date: string;
  onDateChange: (date: string) => void;
  supplierInvoiceNo?: string;
  onSupplierInvoiceNoChange?: (value: string) => void;
  supplierInvoiceDate?: string;
  onSupplierInvoiceDateChange?: (date: string) => void;
}

export default function VoucherHeader({
  voucherType,
  voucherNumber,
  dateDisplay,
  date,
  onDateChange,
  supplierInvoiceNo,
  onSupplierInvoiceNoChange,
  supplierInvoiceDate,
  onSupplierInvoiceDateChange,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSupplierDatePicker, setShowSupplierDatePicker] = useState(false);

  const isPurchaseVoucher = voucherType === "Purchase";

  return (
    <>
      <div className="flex items-center justify-between px-3 py-1 bg-white border-b border-gray-300">
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-black text-white px-2 py-0.5 text-xs font-medium">{voucherType}</span>
          <span className="text-gray-600">No.</span>
          <span className="font-semibold text-black">{voucherNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Field - Clickable */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Date</span>
            <span className="text-gray-400">:</span>
            <button
              onClick={() => setShowDatePicker(true)}
              className="text-xs px-1 py-0.5 hover:bg-zinc-100 transition-colors font-semibold text-zinc-800 bg-transparent border-none cursor-pointer"
              title="Click to change date (F2)"
            >
              {dateDisplay}
            </button>
          </div>
        </div>
      </div>

      {/* Supplier Invoice Fields for Purchase Voucher */}
      {isPurchaseVoucher && (
        <div className="flex items-center gap-6 px-3 py-2 bg-zinc-50 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Supplier Invoice No.</span>
            <span className="text-zinc-400">:</span>
            <input
              type="text"
              value={supplierInvoiceNo || ""}
              onChange={(e) => onSupplierInvoiceNoChange?.(e.target.value)}
              className="text-xs px-2 py-0.5 border border-zinc-300 rounded focus:border-zinc-800 outline-none bg-white w-40 font-semibold"
              placeholder="Invoice Number"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</span>
            <span className="text-zinc-400">:</span>
            <button
              onClick={() => setShowSupplierDatePicker(true)}
              className="text-xs px-1 py-0.5 hover:bg-zinc-100 transition-colors font-semibold text-zinc-800 bg-transparent border-none cursor-pointer w-32 text-left"
              title="Click to select date"
            >
              {supplierInvoiceDate ? new Date(supplierInvoiceDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "Select Date"}
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Popup */}
      {showDatePicker && (
        <DatePickerPopup
          initialDate={date}
          onClose={() => setShowDatePicker(false)}
          onConfirm={onDateChange}
          label="Voucher Date"
        />
      )}

      {/* Supplier Invoice Date Picker */}
      {showSupplierDatePicker && (
        <DatePickerPopup
          initialDate={supplierInvoiceDate || new Date().toISOString().split('T')[0]}
          onClose={() => setShowSupplierDatePicker(false)}
          onConfirm={onSupplierInvoiceDateChange!}
          label="Supplier Invoice Date"
        />
      )}
    </>
  );
}


---
### File: ./components/VoucherTypeTabs.tsx
---

interface Props {
  activeType: string;
  onChange: (type: string) => void;
}

const TYPES = ["Receipt", "Payment", "Contra", "Journal", "Sales", "Purchase"];

export default function VoucherTypeTabs({ activeType, onChange }: Props) {
  return (
    <div className="flex border-b border-black">
      {TYPES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-4 py-1 text-sm font-medium border-r border-gray-300 transition-colors ${
            activeType === t
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}


---
### File: ./Daybook.tsx
---

import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useCompany } from "../../context/CompanyContext";
import type { VoucherRecordType } from "../../types/api";
import { PageTitleBar, RightActionPanel } from "../../components/ui";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatDateDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}-${monthNames[d.getMonth()]}-${String(d.getFullYear())}`;
};

export default function Daybook() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const [entries, setEntries] = useState<VoucherRecordType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Selected Voucher details drawer
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [, setLoadingVoucher] = useState<boolean>(false);

  // Metadata for mapping IDs to names
  const [allGodowns, setAllGodowns] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  const fetchDaybook = useCallback(async () => {
    if (!companyId || !fyId) return;
    setLoading(true);
    try {
      const data = await window.api.voucher.getDaybook(companyId, fyId);
      const vouchers = (data as any)?.vouchers || data || [];
      const list = Array.isArray(vouchers) ? vouchers : [];
      setEntries(list);
    } catch (err) {
      console.error("Failed to fetch daybook:", err);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId]);

  useEffect(() => {
    fetchDaybook();
  }, [fetchDaybook]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        navigate("/transactions/vouchers");
      }
      if (e.altKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        navigate("/transactions/voucher-list");
      }
      if (e.altKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        navigate("/utilities/banking");
      }
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [navigate]);

  const daybookActions = [
    { key: "Alt+C", label: "New Voucher", onClick: () => navigate("/transactions/vouchers") },
    { key: "Alt+V", label: "Voucher Reg", onClick: () => navigate("/transactions/voucher-list") },
    { key: "Alt+B", label: "Banking", onClick: () => navigate("/utilities/banking") },
    { key: "Esc", label: "Quit", onClick: () => navigate("/") },
  ];

  // Load godowns & units metadata
  useEffect(() => {
    if (!companyId) return;
    async function loadMetadata() {
      try {
        const [godRes, unitRes] = await Promise.all([
          window.api.godown.getAll(companyId),
          window.api.unit.getAll(companyId),
        ]);
        if (godRes.success) setAllGodowns(godRes.godowns || []);
        if (unitRes.success) setAllUnits(unitRes.units || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }
    loadMetadata();
  }, [companyId]);

  const handleRowClick = async (voucherId: number) => {
    setLoadingVoucher(true);
    try {
      const res = await window.api.voucher.getById(voucherId);
      if (res.success && res.voucher) {
        setSelectedVoucher(res.voucher);
      } else {
        alert(res.error || "Failed to load voucher details");
      }
    } catch (err) {
      console.error("Failed to fetch voucher by ID:", err);
    } finally {
      setLoadingVoucher(false);
    }
  };

  const handleCancelVoucher = async (voucherId: number) => {
    if (!window.confirm("Are you sure you want to cancel this voucher? This cannot be undone.")) return;
    try {
      const res = await window.api.voucher.cancel(voucherId);
      if (res.success) {
        setSelectedVoucher(null);
        fetchDaybook();
      } else {
        alert(res.error || "Failed to cancel voucher");
      }
    } catch (err) {
      console.error("Failed to cancel voucher:", err);
    }
  };

  const grandTotal = useMemo(() => {
    if (!selectedVoucher) return 0;
    // For single entry or journal, total is the sum of Dr entries
    if (selectedVoucher.entries && selectedVoucher.entries.length > 0) {
      if (["Sales", "Purchase"].includes(selectedVoucher.voucher_type)) {
        const partyEntry = selectedVoucher.entries.find((e: any) =>
          selectedVoucher.voucher_type === "Sales" ? e.type === "Dr" : e.type === "Cr"
        );
        if (partyEntry) return partyEntry.amount;
      }
      return selectedVoucher.entries.reduce((sum: number, e: any) => {
        if (selectedVoucher.voucher_type === "Payment") {
          return e.type === "Dr" ? sum + e.amount : sum;
        } else if (selectedVoucher.voucher_type === "Receipt") {
          return e.type === "Cr" ? sum + e.amount : sum;
        } else if (selectedVoucher.voucher_type === "Contra") {
          return e.type === "Cr" ? sum + e.amount : sum;
        }
        return e.type === "Dr" ? sum + e.amount : sum;
      }, 0);
    }
    return 0;
  }, [selectedVoucher]);

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 select-none text-xs relative overflow-hidden">
      
      {/* Title Bar */}
      <PageTitleBar title="Day Book" subtitle={selectedCompany?.name} />

      {/* Main Body Layout */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Side: Daybook list */}
        <div className="flex-1 flex flex-col min-w-0 p-4 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto flex flex-col h-full">
          
          <div className="mb-3 flex justify-between items-center">
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Daily Transactions List
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Financial Period</span>
              <span className="text-xs font-bold text-zinc-800">
                {activeFY?.start_date ? formatDateDisplay(activeFY.start_date) : "—"} to {activeFY?.end_date ? formatDateDisplay(activeFY.end_date) : "—"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded border border-zinc-200 shadow-sm overflow-hidden flex-1 flex flex-col min-h-[400px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5 text-zinc-500 font-bold uppercase tracking-wider text-[10px] select-none shrink-0">
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Voucher Type</div>
              <div className="col-span-2">Voucher No.</div>
              <div className="col-span-3">Particulars (Party Name)</div>
              <div className="col-span-3 text-right">Narration</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 min-h-0 bg-white">
              {loading && (
                <div className="p-8 text-center text-zinc-400 italic">Loading daybook entries...</div>
              )}
              {!loading && entries.length === 0 && (
                <div className="p-12 text-center text-zinc-400 italic flex flex-col items-center justify-center gap-2">
                  <span>No vouchers found in this financial year.</span>
                  <Link to="/transactions/vouchers" className="text-xs text-zinc-900 font-bold underline hover:text-zinc-700">Create Voucher</Link>
                </div>
              )}
              {!loading && entries.map((entry) => (
                <div
                  key={entry.voucher_id}
                  onClick={() => entry.voucher_id && handleRowClick(entry.voucher_id)}
                  className="grid grid-cols-12 items-center px-4 py-2 hover:bg-zinc-900 hover:text-white cursor-pointer transition-colors min-h-[36px]"
                >
                  <div className="col-span-2">{formatDateDisplay(entry.date)}</div>
                  <div className="col-span-2 font-semibold">{entry.voucher_type}</div>
                  <div className="col-span-2 font-bold">{entry.voucher_number}</div>
                  <div className="col-span-3 truncate font-semibold">{entry.party_name || "—"}</div>
                  <div className="col-span-3 text-right truncate opacity-75">{entry.narration || "—"}</div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex justify-between items-center select-none shrink-0">
              <span>Total Transactions: {entries.length}</span>
              <span>&bull; End of Daybook</span>
            </div>
          </div>

        </div>
      </div>

      {/* Right Side: Action Panel */}
      <RightActionPanel actions={daybookActions} />
    </div>

      {/* Glassmorphism Backdrop Overlay for Drawer */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
          onClick={() => setSelectedVoucher(null)}
        />
      )}

      {/* Premium Slide-Over Details Drawer */}
      {selectedVoucher && (
        <div className="fixed inset-y-0 right-0 w-[550px] bg-white shadow-2xl border-l border-zinc-200 z-50 flex flex-col animate-slide-left text-xs text-zinc-800">
          
          {/* Drawer Header */}
          <div className="bg-zinc-900 text-white px-4 py-3 flex justify-between items-center shadow-md shrink-0 select-none">
            <div className="flex flex-col">
              <span className="uppercase tracking-wider font-bold text-xs">{selectedVoucher.voucher_type} Voucher Details</span>
              <span className="text-[10px] text-zinc-400 mt-0.5">Voucher No. {selectedVoucher.voucher_number}</span>
            </div>
            <button
              onClick={() => setSelectedVoucher(null)}
              className="text-zinc-400 hover:text-white text-lg font-bold font-sans transition-colors"
            >
              &times;
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-white">
            
            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 border border-zinc-100 bg-zinc-50/50 rounded">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-20 text-zinc-400">Date</span>
                  <span className="font-semibold">{formatDateDisplay(selectedVoucher.date)}</span>
                </div>
                <div className="flex">
                  <span className="w-20 text-zinc-400">Ref No.</span>
                  <span>{selectedVoucher.reference_number || "—"}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-20 text-zinc-400">Supply State</span>
                  <span className="font-semibold">{selectedVoucher.place_of_supply || "—"}</span>
                </div>
                {selectedVoucher.party_name && (
                  <div className="flex">
                    <span className="w-20 text-zinc-400">Party</span>
                    <span className="font-semibold truncate">{selectedVoucher.party_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Stock Entries (If applicable) */}
            {selectedVoucher.stock_entries && selectedVoucher.stock_entries.length > 0 && (
              <div className="border border-zinc-200 rounded overflow-hidden">
                <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-1.5 font-bold uppercase text-[9px] text-zinc-500 tracking-wider">
                  Inventory Stock Particulars
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/40 border-b border-zinc-100 text-[9px] uppercase text-zinc-400 font-bold font-sans">
                      <th className="px-3 py-1.5">Item Name</th>
                      <th className="px-2 py-1.5">Godown</th>
                      <th className="px-2 py-1.5 text-right">Quantity</th>
                      <th className="px-2 py-1.5 text-right">Rate</th>
                      <th className="px-3 py-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedVoucher.stock_entries.map((item: any, idx: number) => {
                      const godownName = allGodowns.find(g => g.godown_id === item.godown_id)?.name || "Main Location";
                      const unitSymbol = allUnits.find(u => u.unit_id === item.unit_id)?.symbol || "Nos";
                      return (
                        <tr key={idx} className="hover:bg-zinc-50/30">
                          <td className="px-3 py-2 font-semibold text-zinc-900">{item.item_name}</td>
                          <td className="px-2 py-2 text-zinc-500">{godownName}</td>
                          <td className="px-2 py-2 text-right">{item.quantity.toFixed(2)} {unitSymbol}</td>
                          <td className="px-2 py-2 text-right">{(item.rate || 0).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-bold">{(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Accounting Ledger Entries (Double-Entry matrix) */}
            <div className="border border-zinc-200 rounded overflow-hidden">
              <div className="bg-zinc-50 border-b border-zinc-200 px-3 py-1.5 font-bold uppercase text-[9px] text-zinc-500 tracking-wider">
                Accounting Double-Entry Details
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/40 border-b border-zinc-100 text-[9px] uppercase text-zinc-400 font-bold font-sans">
                    <th className="px-3 py-1.5 text-center w-12">Dr/Cr</th>
                    <th className="px-3 py-1.5">Ledger Name</th>
                    <th className="px-3 py-1.5 text-right">Debit (Dr)</th>
                    <th className="px-3 py-1.5 text-right">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {selectedVoucher.entries && selectedVoucher.entries.map((entry: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50/30">
                      <td className={`px-3 py-2 text-center font-bold ${entry.type === 'Dr' ? 'text-blue-700 bg-blue-50/10' : 'text-red-700 bg-red-50/10'}`}>
                        {entry.type}
                      </td>
                      <td className="px-3 py-2 font-semibold text-zinc-900">{entry.ledger_name}</td>
                      <td className="px-3 py-2 text-right font-bold text-zinc-800">
                        {entry.type === 'Dr' ? (entry.amount || 0).toFixed(2) : ""}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-zinc-800">
                        {entry.type === 'Cr' ? (entry.amount || 0).toFixed(2) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Total & Narration block */}
            <div className="space-y-2 border-t border-zinc-100 pt-3">
              <div className="flex justify-between items-center p-3 border border-zinc-200 rounded bg-zinc-50">
                <span className="font-bold text-zinc-600 uppercase tracking-wider">Grand Total (INR) :</span>
                <span className="text-sm font-bold text-zinc-950">
                  {grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="p-3 border border-zinc-100 rounded bg-zinc-50/20">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Narration Remarks</span>
                <p className="text-zinc-700 italic font-medium break-words">
                  {selectedVoucher.narration || "No narration remarks recorded for this transaction."}
                </p>
              </div>
            </div>

          </div>

          {/* Drawer Footer Actions */}
          <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center gap-2 shrink-0 select-none">
            <button
              onClick={() => handleCancelVoucher(selectedVoucher.voucher_id)}
              className="text-xs text-red-600 hover:text-red-800 font-bold bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded transition-colors uppercase font-sans tracking-wide"
            >
              Cancel Voucher
            </button>
            <button
              onClick={() => setSelectedVoucher(null)}
              className="text-xs text-zinc-700 hover:text-zinc-950 font-bold bg-white hover:bg-zinc-100 border border-zinc-300 px-5 py-2 rounded transition-colors uppercase font-sans tracking-wide shadow-sm"
            >
              Close Details
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

---
### File: ./hooks/useVoucherForm.ts
---

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCompany } from "../../../context/CompanyContext";
import { loadFormState, saveFormState, clearFormState } from "../../../utils/formPersistence";
import type { LedgerType, GroupType, StockItemType, GodownType, UnitType } from "../../../types/api";

// ─── ID factory ──────────────────────────────────────────────────────────────

let idCounter = 0;
const nextId = () => `row_${++idCounter}_${Date.now()}`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParticularRow {
  id: string;
  type: "Dr" | "Cr";
  ledger: LedgerType | null;
  ledgerBalance: string;
  amountRaw: string;
  costCentres?: { cost_centre_id: number; amount: number }[];
  billReferences?: {
    bill_name: string;
    bill_type: "New Ref" | "Agst Ref" | "Advance" | "On Account";
    amount: number;
    credit_period?: string;
  }[];
}

export interface StockEntryRow {
  id: string;
  stockItem: StockItemType | null;
  godown: GodownType | null;
  unit: UnitType | null;
  quantityRaw: string;
  rateRaw: string;
  amountRaw: string;
}

export type ActiveField =
  | { type: "account" }
  | { type: "party" }
  | { type: "salesPurchase" }
  | { type: "particular"; rowId: string }
  | { type: "additional"; rowId: string }
  | { type: "stockItem"; rowId: string }
  | { type: "stockGodown"; rowId: string };

export type ActiveAllocation =
  | {
      type: "billWise";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialAllocations?: any[];
    }
  | {
      type: "billWiseParty";
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialAllocations?: any[];
    }
  | {
      type: "costCentre";
      rowId: string;
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialAllocations?: any[];
    }
  | {
      type: "bankDetails";
      ledgerId: number;
      ledgerName: string;
      amount: number;
      initialDetails?: any;
    }
  | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const monthNames = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatDateDisplay = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()}-${monthNames[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
};

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ─── Default row factories ────────────────────────────────────────────────────

const makeParticularRow = (type: "Dr" | "Cr" = "Dr"): ParticularRow => ({
  id: nextId(),
  type,
  ledger: null,
  ledgerBalance: "",
  amountRaw: "",
});

const makeStockRow = (): StockEntryRow => ({
  id: nextId(),
  stockItem: null,
  godown: null,
  unit: null,
  quantityRaw: "",
  rateRaw: "",
  amountRaw: "",
});

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoucherForm() {
  const { selectedCompany, activeFY } = useCompany();

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const persistKey = companyId ? `voucherForm_${companyId}` : null;

  // Track whether the very first render has passed so the auto-save effect
  // does not immediately overwrite the just-restored state.
  const hasRestored = useRef(false);

  // ── Basic voucher meta ──────────────────────────────────────────────────────

  const [voucherType, setVoucherType] = useState<string>(
    () => loadFormState<any>(persistKey ?? "")?.voucherType ?? "Receipt"
  );
  const [voucherNumber, setVoucherNumber] = useState<string>("1");
  const [voucherNumberLoading, setVoucherNumberLoading] = useState(true);
  const [date, setDate] = useState<string>(todayStr());
  const [status, setStatus] = useState<"Regular" | "Post-Dated">("Regular");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState<string>("");
  const [supplierInvoiceDate, setSupplierInvoiceDate] = useState<string>("");
  const [narration, setNarration] = useState<string>(
    () => loadFormState<any>(persistKey ?? "")?.narration ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Advanced allocation state ───────────────────────────────────────────────

  const [activeAllocation, setActiveAllocation] = useState<ActiveAllocation>(null);
  const [partyBillReferences, setPartyBillReferences] = useState<any[]>(
    () => loadFormState<any>(persistKey ?? "")?.partyBillReferences ?? []
  );
  const [bankDetails, setBankDetails] = useState<any | null>(
    () => loadFormState<any>(persistKey ?? "")?.bankDetails ?? null
  );

  // ── Reference / invoice fields ─────────────────────────────────────────────

  const [referenceNumber, setReferenceNumber] = useState<string>(
    () => loadFormState<any>(persistKey ?? "")?.referenceNumber ?? ""
  );
  const [referenceDate, setReferenceDate] = useState<string>(todayStr());
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(
    () => loadFormState<any>(persistKey ?? "")?.placeOfSupply ?? "Select"
  );

  // ── Master data lists ───────────────────────────────────────────────────────

  const [allLedgers, setAllLedgers] = useState<LedgerType[]>([]);
  const [allGroups, setAllGroups] = useState<GroupType[]>([]);
  const [allStockItems, setAllStockItems] = useState<StockItemType[]>([]);
  const [allGodowns, setAllGodowns] = useState<GodownType[]>([]);
  const [allUnits, setAllUnits] = useState<UnitType[]>([]);
  const [ledgersLoading, setLedgersLoading] = useState(false);

  // ── Search / active field ───────────────────────────────────────────────────

  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("");
  const [stockSearchTerm, setStockSearchTerm] = useState("");
  const [activeField, setActiveField] = useState<ActiveField | null>(null);

  // ── Layout 1: Single-entry (Receipt F6, Payment F5, Contra F4) ─────────────

  const [accountLedger, setAccountLedger] = useState<LedgerType | null>(null);
  const [accountBalance, setAccountBalance] = useState<string>("");

  const [particulars, setParticulars] = useState<ParticularRow[]>(() => {
    const saved = loadFormState<any>(persistKey ?? "");
    return saved?.particulars?.length ? saved.particulars : [makeParticularRow("Dr")];
  });

  // ── Layout 2: Double-entry Journal (F7) ────────────────────────────────────

  const [journalRows, setJournalRows] = useState<ParticularRow[]>(() => {
    const saved = loadFormState<any>(persistKey ?? "");
    return saved?.journalRows?.length
      ? saved.journalRows
      : [makeParticularRow("Dr"), makeParticularRow("Cr")];
  });

  // ── Layout 3: Inventory invoice (Sales F8, Purchase F9) ───────────────────

  const [partyLedger, setPartyLedger] = useState<LedgerType | null>(
    () => loadFormState<any>(persistKey ?? "")?.partyLedger ?? null
  );
  const [partyBalance, setPartyBalance] = useState<string>("");

  const [salesPurchaseLedger, setSalesPurchaseLedger] = useState<LedgerType | null>(
    () => loadFormState<any>(persistKey ?? "")?.salesPurchaseLedger ?? null
  );
  const [salesPurchaseBalance, setSalesPurchaseBalance] = useState<string>("");

  const [stockEntries, setStockEntries] = useState<StockEntryRow[]>(() => {
    const saved = loadFormState<any>(persistKey ?? "");
    return saved?.stockEntries?.length ? saved.stockEntries : [makeStockRow()];
  });

  const [additionalEntries, setAdditionalEntries] = useState<ParticularRow[]>(
    () => loadFormState<any>(persistKey ?? "")?.additionalEntries ?? []
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Persistence snapshot
  // ─────────────────────────────────────────────────────────────────────────────

  const getSnapshot = useCallback(
    () => ({
      voucherType,
      narration,
      accountLedger,
      particulars,
      journalRows,
      partyLedger,
      salesPurchaseLedger,
      stockEntries,
      additionalEntries,
      referenceNumber,
      placeOfSupply,
      partyBillReferences,
      bankDetails,
      supplierInvoiceNo,
      supplierInvoiceDate,
    }),
    [
      voucherType, narration, accountLedger, particulars, journalRows,
      partyLedger, salesPurchaseLedger, stockEntries, additionalEntries,
      referenceNumber, placeOfSupply, partyBillReferences, bankDetails,
      supplierInvoiceNo, supplierInvoiceDate,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchContextData = useCallback(async () => {
    if (!companyId) return;
    setLedgersLoading(true);
    try {
      const [ledRes, grpRes, itemRes, godRes, unitRes] = await Promise.all([
        window.api.ledger.getAll(companyId),
        window.api.group.getAll(companyId),
        window.api.stockItem.getAll(companyId),
        window.api.godown.getAll(companyId),
        window.api.unit.getAll(companyId),
      ]);
      if (ledRes.success) setAllLedgers((ledRes as any).ledgers ?? []);
      if (grpRes.success) setAllGroups((grpRes as any).groups ?? []);
      if (itemRes.success) setAllStockItems((itemRes as any).stockItems ?? []);
      if (godRes.success) setAllGodowns((godRes as any).godowns ?? []);
      if (unitRes.success) setAllUnits((unitRes as any).units ?? []);
    } catch {
      // silently ignore — user can retry
    } finally {
      setLedgersLoading(false);
    }
  }, [companyId]);

  const fetchNextNumber = useCallback(async () => {
    if (!companyId || !fyId) return;
    setVoucherNumberLoading(true);
    try {
      const res = await window.api.voucher.getNextNumber(companyId, fyId, voucherType);
      if (res.success && res.voucher_number) {
        setVoucherNumber(String(res.voucher_number));
      }
    } catch {
      // ignore
    } finally {
      setVoucherNumberLoading(false);
    }
  }, [companyId, fyId, voucherType]);

  const fetchLedgerBalance = useCallback(
    async (ledgerId: number): Promise<string> => {
      if (!companyId || !fyId) return "";
      try {
        const res = await window.api.voucher.getLedgerBalance(ledgerId, companyId, fyId);
        if (res.success && res.balance != null) return String(res.balance);
      } catch {
        // ignore
      }
      return "";
    },
    [companyId, fyId]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────────

  // Initial load
  useEffect(() => {
    fetchContextData();
    fetchNextNumber();
  }, [fetchContextData, fetchNextNumber]);

  // Auto-save — skip the very first render (restoration just happened)
  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) {
      hasRestored.current = true;
      return;
    }
    saveFormState(persistKey, getSnapshot());
  }, [persistKey, getSnapshot]);

  // Reset form when voucher type changes
  const prevVoucherType = useRef(voucherType);
  useEffect(() => {
    if (prevVoucherType.current !== voucherType) {
      prevVoucherType.current = voucherType;
      // resetForm() is defined later — we call it via ref to avoid circular deps
      resetFormRef.current?.();
    }
  }, [voucherType]);

  // Balance sync: account ledger
  useEffect(() => {
    if (accountLedger?.ledger_id) {
      fetchLedgerBalance(accountLedger.ledger_id).then(setAccountBalance);
    } else {
      setAccountBalance("");
    }
  }, [accountLedger, fetchLedgerBalance]);

  // Balance sync: party ledger
  useEffect(() => {
    if (partyLedger?.ledger_id) {
      fetchLedgerBalance(partyLedger.ledger_id).then(setPartyBalance);
    } else {
      setPartyBalance("");
    }
  }, [partyLedger, fetchLedgerBalance]);

  // Balance sync: sales/purchase ledger
  useEffect(() => {
    if (salesPurchaseLedger?.ledger_id) {
      fetchLedgerBalance(salesPurchaseLedger.ledger_id).then(setSalesPurchaseBalance);
    } else {
      setSalesPurchaseBalance("");
    }
  }, [salesPurchaseLedger, fetchLedgerBalance]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Business logic helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /** Walk the group hierarchy to see if a ledger ultimately belongs to any of the named groups. */
  const checkLedgerGroup = useCallback(
    (ledger: LedgerType | null, targetGroupNames: string[]): boolean => {
      if (!ledger || allGroups.length === 0) return false;

      const findGroup = (groupId?: number): GroupType | undefined =>
        allGroups.find((g) => g.group_id === groupId);

      const check = (grp: GroupType): boolean => {
        if (targetGroupNames.map((n) => n.toLowerCase().trim()).includes(grp.name.toLowerCase().trim())) {
          return true;
        }
        if (grp.parent_group_id) {
          const parent = findGroup(grp.parent_group_id);
          if (parent) return check(parent);
        }
        return false;
      };

      const group = findGroup(ledger.group_id);
      return group ? check(group) : false;
    },
    [allGroups]
  );

  const checkIsCashOrBank = useCallback(
    (ledger: LedgerType | null): boolean =>
      checkLedgerGroup(ledger, [
        "bank accounts",
        "bank od accounts",
        "bank od a/c",
        "bank od account",
        "cash-in-hand",
      ]),
    [checkLedgerGroup]
  );

  /**
   * FIX #9 — auto-derive Dr/Cr for single-entry voucher types so the user
   * never has to pick it manually (matching Tally Prime behaviour).
   *
   * Receipt  → cash/bank side is Dr;  all others are Cr
   * Payment  → cash/bank side is Cr;  all others are Dr
   * Contra   → no auto-assignment (both sides are cash/bank, user picks)
   */
  const autoType = useCallback(
    (ledger: LedgerType, currentType: "Dr" | "Cr"): "Dr" | "Cr" => {
      const isCB = checkIsCashOrBank(ledger);
      if (voucherType === "Receipt") return isCB ? "Dr" : "Cr";
      if (voucherType === "Payment") return isCB ? "Cr" : "Dr";
      return currentType; // Journal / Contra / Sales / Purchase — keep as-is
    },
    [voucherType, checkIsCashOrBank]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed totals  (FIX #1 — exported so Vouchers.tsx doesn't need `as any`)
  // ─────────────────────────────────────────────────────────────────────────────

  const debitTotal = useMemo(() => {
    if (voucherType === "Journal") {
      return journalRows.reduce(
        (sum, r) => sum + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0),
        0
      );
    }
    return particulars.reduce(
      (sum, p) => sum + (p.type === "Dr" ? Number(p.amountRaw) || 0 : 0),
      0
    );
  }, [voucherType, particulars, journalRows]);

  const creditTotal = useMemo(() => {
    if (voucherType === "Journal") {
      return journalRows.reduce(
        (sum, r) => sum + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0),
        0
      );
    }
    return particulars.reduce(
      (sum, p) => sum + (p.type === "Cr" ? Number(p.amountRaw) || 0 : 0),
      0
    );
  }, [voucherType, particulars, journalRows]);

  const totalAmount = useMemo(() => {
    if (voucherType === "Journal") return debitTotal;

    if (voucherType === "Sales" || voucherType === "Purchase") {
      const stockSum = stockEntries.reduce((s, r) => s + (Number(r.amountRaw) || 0), 0);
      const adjSum = additionalEntries.reduce((s, r) => {
        const amt = Number(r.amountRaw) || 0;
        if (voucherType === "Sales") return r.type === "Cr" ? s + amt : s - amt;
        return r.type === "Dr" ? s + amt : s - amt;
      }, 0);
      return Math.max(0, stockSum + adjSum);
    }

    // Receipt / Payment / Contra
    return particulars.reduce((s, p) => s + (Number(p.amountRaw) || 0), 0);
  }, [voucherType, debitTotal, particulars, stockEntries, additionalEntries]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Particular row handlers (single-entry layouts)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddParticularRow = useCallback(() => {
    setParticulars((prev) => [...prev, makeParticularRow("Dr")]);
  }, []);

  const handleUpdateParticularRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      // FIX #9 — auto-assign Dr/Cr when a ledger is selected for Receipt/Payment
      if (updates.ledger && ["Receipt", "Payment"].includes(voucherType)) {
        setParticulars((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            const derivedType = autoType(updates.ledger!, p.type);
            return { ...p, ...updates, type: derivedType };
          })
        );
      } else {
        setParticulars((prev) =>
          prev.map((p) => (p.id !== id ? p : { ...p, ...updates }))
        );
      }

      // Fetch balance after ledger selection
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setParticulars((prev) =>
          prev.map((p) => (p.id !== id ? p : { ...p, ledgerBalance: bal }))
        );
      }
    },
    [voucherType, autoType, fetchLedgerBalance]
  );

  const handleRemoveParticularRow = useCallback((id: string) => {
    setParticulars((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Journal row handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddJournalRow = useCallback(() => {
    setJournalRows((prev) => {
      const lastType = prev[prev.length - 1]?.type ?? "Dr";
      return [...prev, makeParticularRow(lastType)];
    });
  }, []);

  const handleUpdateJournalRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setJournalRows((prev) =>
        prev.map((r) => (r.id !== id ? r : { ...r, ...updates }))
      );
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setJournalRows((prev) =>
          prev.map((r) => (r.id !== id ? r : { ...r, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveJournalRow = useCallback((id: string) => {
    setJournalRows((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Stock entry handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddStockRow = useCallback(() => {
    setStockEntries((prev) => [...prev, makeStockRow()]);
  }, []);

  const handleUpdateStockRow = useCallback(
    async (id: string, updates: Partial<Omit<StockEntryRow, "id">>) => {
      setStockEntries((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, ...updates };
          // Auto-compute amount when quantity or rate changes
          if (updates.quantityRaw !== undefined || updates.rateRaw !== undefined) {
            const qty = Number(updated.quantityRaw) || 0;
            const rate = Number(updated.rateRaw) || 0;
            updated.amountRaw = qty > 0 && rate > 0 ? (qty * rate).toFixed(2) : "";
          }
          return updated;
        })
      );
    },
    []
  );

  const handleRemoveStockRow = useCallback((id: string) => {
    setStockEntries((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Additional ledger row handlers (Sales/Purchase taxes & adjustments)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddAdditionalRow = useCallback(() => {
    // Default type: Sales → Cr (tax adds to revenue side), Purchase → Dr
    setAdditionalEntries((prev) => [
      ...prev,
      makeParticularRow(voucherType === "Sales" ? "Cr" : "Dr"),
    ]);
  }, [voucherType]);

  const handleUpdateAdditionalRow = useCallback(
    async (id: string, updates: Partial<Omit<ParticularRow, "id">>) => {
      setAdditionalEntries((prev) =>
        prev.map((p) => (p.id !== id ? p : { ...p, ...updates }))
      );
      if (updates.ledger?.ledger_id) {
        const bal = await fetchLedgerBalance(updates.ledger.ledger_id);
        setAdditionalEntries((prev) =>
          prev.map((p) => (p.id !== id ? p : { ...p, ledgerBalance: bal }))
        );
      }
    },
    [fetchLedgerBalance]
  );

  const handleRemoveAdditionalRow = useCallback((id: string) => {
    setAdditionalEntries((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Active field / search panel
  // ─────────────────────────────────────────────────────────────────────────────

  const handleFieldFocus = useCallback(
    (field: ActiveField) => {
      setActiveField(field);

      // Populate the search box with the currently selected item's name
      // so the user sees it highlighted and can start filtering immediately.
      let currentName = "";
      if (field.type === "account") {
        currentName = accountLedger?.name ?? "";
      } else if (field.type === "party") {
        currentName = partyLedger?.name ?? "";
      } else if (field.type === "salesPurchase") {
        currentName = salesPurchaseLedger?.name ?? "";
      } else if (field.type === "particular") {
        const row =
          particulars.find((p) => p.id === field.rowId) ??
          journalRows.find((p) => p.id === field.rowId);
        currentName = row?.ledger?.name ?? "";
      } else if (field.type === "additional") {
        const row = additionalEntries.find((p) => p.id === field.rowId);
        currentName = row?.ledger?.name ?? "";
      } else if (field.type === "stockItem") {
        const row = stockEntries.find((p) => p.id === field.rowId);
        currentName = row?.stockItem?.name ?? "";
      }

      setLedgerSearchTerm(currentName);
      setStockSearchTerm(currentName);
    },
    [
      accountLedger, partyLedger, salesPurchaseLedger,
      particulars, journalRows, additionalEntries, stockEntries,
    ]
  );

  const handleFieldBlur = useCallback(() => {
    setActiveField(null);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Universal selection handler (called when user clicks an item in LedgerPanel)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleLedgerPanelSelect = useCallback(
    (item: any) => {
      if (!activeField) return;

      switch (activeField.type) {
        case "account":
          setAccountLedger(item as LedgerType);
          break;

        case "party":
          setPartyLedger(item as LedgerType);
          break;

        case "salesPurchase":
          setSalesPurchaseLedger(item as LedgerType);
          break;

        case "particular": {
          const ledger = item as LedgerType;
          if (voucherType === "Journal") {
            handleUpdateJournalRow(activeField.rowId, { ledger });
          } else {
            handleUpdateParticularRow(activeField.rowId, { ledger });
          }
          break;
        }

        case "additional":
          handleUpdateAdditionalRow(activeField.rowId, { ledger: item as LedgerType });
          break;

        case "stockItem": {
          const stockItem = item as StockItemType;
          const matchingUnit = allUnits.find((u) => u.unit_id === stockItem.unit_id) ?? null;
          handleUpdateStockRow(activeField.rowId, { stockItem, unit: matchingUnit });
          break;
        }

        default:
          break;
      }

      // Close the panel immediately to prevent cross-field confusion
      setActiveField(null);
      setLedgerSearchTerm("");
      setStockSearchTerm("");
    },
    [
      activeField, voucherType, allUnits,
      handleUpdateParticularRow, handleUpdateJournalRow,
      handleUpdateAdditionalRow, handleUpdateStockRow,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Form reset
  // ─────────────────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    if (persistKey) clearFormState(persistKey);
    hasRestored.current = false;

    setAccountLedger(null);
    setAccountBalance("");
    setPartyLedger(null);
    setPartyBalance("");
    setSalesPurchaseLedger(null);
    setSalesPurchaseBalance("");

    setParticulars([makeParticularRow("Dr")]);
    setJournalRows([makeParticularRow("Dr"), makeParticularRow("Cr")]);
    setStockEntries([makeStockRow()]);
    setAdditionalEntries([]);

    setActiveAllocation(null);
    setPartyBillReferences([]);
    setBankDetails(null);

    setReferenceNumber("");
    setNarration("");
    setError(null);
    setSuccess(null);
    setActiveField(null);
    setLedgerSearchTerm("");
    setStockSearchTerm("");
    setSupplierInvoiceNo("");
    setSupplierInvoiceDate("");
    setStatus("Regular");
    setDate(todayStr());

    fetchNextNumber();
  }, [persistKey, fetchNextNumber]);

  // Keep a stable ref so the voucherType-change effect can call resetForm
  // without it being listed as a dependency (which would cause an infinite loop).
  const resetFormRef = useRef<() => void>(resetForm);
  useEffect(() => {
    resetFormRef.current = resetForm;
  }, [resetForm]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────────

  const validate = useCallback((): string | null => {
    if (!companyId) return "No company selected.";
    if (!fyId) return "No active financial year.";

    if (["Receipt", "Payment", "Contra"].includes(voucherType)) {
      const filled = particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0);
      if (filled.length < 2)
        return "At least two ledger entries are required (one Debit and one Credit).";

      if (voucherType === "Contra") {
        for (const row of filled) {
          if (!checkIsCashOrBank(row.ledger))
            return "Contra vouchers may only use Cash/Bank accounts.";
        }
      }

      if (Math.abs(debitTotal - creditTotal) > 0.01)
        return `Debit (${debitTotal.toFixed(2)}) and Credit (${creditTotal.toFixed(2)}) must balance.`;

      if (debitTotal <= 0) return "Total amount must be greater than zero.";
    }

    if (voucherType === "Journal") {
      const filled = journalRows.filter((r) => r.ledger && Number(r.amountRaw) > 0);
      if (filled.length < 2) return "At least two valid Journal entries are required.";
      if (Math.abs(debitTotal - creditTotal) > 0.01)
        return `Debit (${debitTotal.toFixed(2)}) and Credit (${creditTotal.toFixed(2)}) must balance.`;
      if (debitTotal <= 0) return "Journal amount must be greater than zero.";
    }

    if (["Sales", "Purchase"].includes(voucherType)) {
      if (!partyLedger) return "Party A/c Name is required.";
      if (!salesPurchaseLedger) return `${voucherType} Ledger is required.`;
      if (partyLedger.ledger_id === salesPurchaseLedger.ledger_id)
        return `Party and ${voucherType} ledger cannot be the same account.`;

      const filledItems = stockEntries.filter(
        (r) => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0
      );
      if (filledItems.length === 0) return "At least one Stock Item with quantity and rate is required.";
      if (totalAmount <= 0) return "Total amount must be greater than zero.";
    }

    return null;
  }, [
    companyId, fyId, voucherType,
    particulars, journalRows, stockEntries,
    partyLedger, salesPurchaseLedger,
    debitTotal, creditTotal, totalAmount,
    checkIsCashOrBank,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      let entries: any[] = [];
      let stock_entries: any[] = [];

      // ── Build entries per voucher type ──────────────────────────────────────

      if (["Receipt", "Payment", "Contra"].includes(voucherType)) {
        const filled = particulars.filter((p) => p.ledger && Number(p.amountRaw) > 0);
        entries = filled.map((p) => ({
          ledger_id: p.ledger!.ledger_id,
          ledger_name: p.ledger!.name,
          type: p.type,
          amount: Number(p.amountRaw),
          currency: "INR",
          cost_centres: p.costCentres,
        }));
      } else if (voucherType === "Journal") {
        const filled = journalRows.filter((r) => r.ledger && Number(r.amountRaw) > 0);
        entries = filled.map((r) => ({
          ledger_id: r.ledger!.ledger_id,
          ledger_name: r.ledger!.name,
          type: r.type,
          amount: Number(r.amountRaw),
          currency: "INR",
          cost_centres: r.costCentres,
        }));
      } else if (["Sales", "Purchase"].includes(voucherType)) {
        const filledItems = stockEntries.filter(
          (r) => r.stockItem && Number(r.quantityRaw) > 0 && Number(r.rateRaw) > 0
        );
        const stockSubtotal = filledItems.reduce((s, r) => s + (Number(r.amountRaw) || 0), 0);

        stock_entries = filledItems.map((r) => ({
          stock_item_id: r.stockItem!.item_id ?? null,
          item_name: r.stockItem!.name,
          godown_id: r.godown?.godown_id ?? null,
          unit_id: r.unit?.unit_id ?? null,
          quantity: Number(r.quantityRaw),
          rate: Number(r.rateRaw),
          amount: Number(r.amountRaw),
        }));

        // Sales: Party Dr (total), Sales Cr (subtotal), taxes ±
        // Purchase: Purchase Dr (subtotal), taxes ±, Party Cr (total)
        const partyType = voucherType === "Sales" ? "Dr" : "Cr";
        const spType = voucherType === "Sales" ? "Cr" : "Dr";

        entries = [
          {
            ledger_id: partyLedger!.ledger_id,
            ledger_name: partyLedger!.name,
            type: partyType,
            amount: totalAmount,
            currency: "INR",
          },
          {
            ledger_id: salesPurchaseLedger!.ledger_id,
            ledger_name: salesPurchaseLedger!.name,
            type: spType,
            amount: stockSubtotal,
            currency: "INR",
          },
          ...additionalEntries
            .filter((p) => p.ledger && Number(p.amountRaw) > 0)
            .map((p) => ({
              ledger_id: p.ledger!.ledger_id,
              ledger_name: p.ledger!.name,
              type: p.type,
              amount: Number(p.amountRaw),
              currency: "INR",
              cost_centres: p.costCentres,
            })),
        ];
      }

      // ── Collect bill references ─────────────────────────────────────────────

      let finalBillReferences: any[] = [];

      if (["Receipt", "Payment", "Contra"].includes(voucherType)) {
        finalBillReferences = particulars
          .filter((p) => p.ledger && p.billReferences?.length)
          .flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })));
      } else if (voucherType === "Journal") {
        finalBillReferences = journalRows
          .filter((r) => r.ledger && r.billReferences?.length)
          .flatMap((r) => r.billReferences!.map((b) => ({ ...b, ledger_id: r.ledger!.ledger_id })));
      } else if (["Sales", "Purchase"].includes(voucherType)) {
        if (partyLedger && partyBillReferences.length > 0) {
          finalBillReferences = partyBillReferences.map((b) => ({
            ...b,
            ledger_id: partyLedger.ledger_id,
          }));
        }
        const additionalRefs = additionalEntries
          .filter((p) => p.ledger && p.billReferences?.length)
          .flatMap((p) => p.billReferences!.map((b) => ({ ...b, ledger_id: p.ledger!.ledger_id })));
        finalBillReferences = [...finalBillReferences, ...additionalRefs];
      }

      // ── Final payload ───────────────────────────────────────────────────────

      const payload: any = {
        company_id: companyId!,
        fy_id: fyId!,
        voucher_type: voucherType,
        date,
        status,
        supplier_invoice_no: supplierInvoiceNo || null,
        supplier_invoice_date: supplierInvoiceDate || null,
        reference_number: referenceNumber || null,
        reference_date: referenceDate || null,
        place_of_supply: placeOfSupply !== "Select" ? placeOfSupply : null,
        narration: narration || null,
        party_ledger_id: ["Sales", "Purchase"].includes(voucherType)
          ? partyLedger?.ledger_id ?? null
          : null,
        party_name: ["Sales", "Purchase"].includes(voucherType)
          ? partyLedger?.name ?? null
          : null,
        is_accounting_voucher: 1,
        is_invoice: ["Sales", "Purchase"].includes(voucherType) ? 1 : 0,
        is_inventory_voucher: ["Sales", "Purchase"].includes(voucherType) ? 1 : 0,
        is_post_dated: status === "Post-Dated" ? 1 : 0,
        entries,
        stock_entries,
        bill_references: finalBillReferences.length > 0 ? finalBillReferences : undefined,
        bank_details: bankDetails || undefined,
      };

      const res = await window.api.voucher.create(payload);
      if (res.success) {
        const savedNumber = voucherNumber;
        resetForm();
        setSuccess(`Voucher No. ${savedNumber} saved successfully.`);
      } else {
        setError(res.error || "Failed to save voucher.");
      }
    } catch (e: any) {
      setError(e?.message || "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    companyId, fyId, voucherType,
    date, status,
    supplierInvoiceNo, supplierInvoiceDate,
    referenceNumber, referenceDate, placeOfSupply,
    narration, totalAmount,
    particulars, journalRows,
    partyLedger, salesPurchaseLedger,
    stockEntries, additionalEntries,
    partyBillReferences, bankDetails,
    voucherNumber, resetForm,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived display values
  // ─────────────────────────────────────────────────────────────────────────────

  const dateDisplay = useMemo(() => formatDateDisplay(date), [date]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────────────

  return {
    // ── Voucher meta ──────────────────────────────────────────────────────────
    voucherType,
    setVoucherType,
    voucherNumber,          // string (FIX #4 — was treated as number in VoucherHeader)
    voucherNumberLoading,
    date,
    setDate,
    dateDisplay,
    status,
    setStatus,
    supplierInvoiceNo,
    setSupplierInvoiceNo,
    supplierInvoiceDate,
    setSupplierInvoiceDate,
    narration,
    setNarration,

    // ── Computed totals (FIX #1 — all three exported) ─────────────────────────
    totalAmount,
    debitTotal,
    creditTotal,

    // ── Submission state ──────────────────────────────────────────────────────
    isSubmitting,
    error,
    setError,
    success,
    setSuccess,
    handleSubmit,
    resetForm,

    // ── Advanced allocations ──────────────────────────────────────────────────
    activeAllocation,
    setActiveAllocation,
    partyBillReferences,
    setPartyBillReferences,
    bankDetails,
    setBankDetails,

    // ── Reference / invoice ───────────────────────────────────────────────────
    referenceNumber,
    setReferenceNumber,
    referenceDate,
    setReferenceDate,
    placeOfSupply,
    setPlaceOfSupply,

    // ── Master data lists ─────────────────────────────────────────────────────
    allLedgers,
    allStockItems,
    allGodowns,
    allUnits,
    ledgersLoading,
    fetchContextData,

    // ── Search / panel state ──────────────────────────────────────────────────
    ledgerSearchTerm,
    setLedgerSearchTerm,
    stockSearchTerm,
    setStockSearchTerm,
    activeField,
    handleFieldFocus,
    handleFieldBlur,
    handleLedgerPanelSelect,

    // ── Layout 1 — single-entry (F4 Contra, F5 Payment, F6 Receipt) ───────────
    accountLedger,
    accountBalance,
    particulars,
    setParticulars,
    handleUpdateParticularRow,
    handleAddParticularRow,
    handleRemoveParticularRow,

    // ── Layout 2 — journal (F7) ───────────────────────────────────────────────
    journalRows,
    setJournalRows,
    handleUpdateJournalRow,
    handleAddJournalRow,
    handleRemoveJournalRow,

    // ── Layout 3 — inventory invoice (F8 Sales, F9 Purchase) ──────────────────
    partyLedger,
    partyBalance,
    salesPurchaseLedger,
    salesPurchaseBalance,
    stockEntries,
    handleUpdateStockRow,
    handleAddStockRow,
    handleRemoveStockRow,
    additionalEntries,
    setAdditionalEntries,
    handleUpdateAdditionalRow,
    handleAddAdditionalRow,
    handleRemoveAdditionalRow,

    // ── Context helpers ───────────────────────────────────────────────────────
    checkIsCashOrBank,
    checkLedgerGroup,
    companyId,
    fyId,
  };
}

---
### File: ./ui/AmountDisplay.tsx
---

/**
 * AmountDisplay — formats a number as an INR amount string consistently.
 * Use for all monetary values across the app.
 */

interface Props {
  amount: number;
  /** Show the ₹ symbol (default true) */
  showSymbol?: boolean;
  className?: string;
}

const formatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount: number, showSymbol = true): string {
  return `${showSymbol ? "₹" : ""}${formatter.format(amount)}`;
}

export default function AmountDisplay({ amount, showSymbol = true, className }: Props) {
  return (
    <span className={className}>
      {formatINR(amount, showSymbol)}
    </span>
  );
}


---
### File: ./ui/index.ts
---

export { default as VoucherTypeBadge, voucherTypeSolidClass } from './VoucherTypeBadge';
export { default as LedgerField } from './LedgerField';
export { default as AmountDisplay, formatINR } from './AmountDisplay';
export { default as PageFooterBar } from './PageFooterBar';


---
### File: ./ui/LedgerField.tsx
---

/**
 * LedgerField — the label:value input row used to pick a ledger.
 * Combines the text input, balance display, and field-focus wiring.
 * Reused in the Account row, Party A/c, and Sales/Purchase Ledger rows.
 */

interface Props {
  /** Current display value (ledger name or search term) */
  value: string;
  /** Optional balance string shown in muted text next to the input */
  balance?: string;
  placeholder?: string;
  onFocus: () => void;
  onChange: (value: string) => void;
  /** Tailwind class applied to the wrapping div */
  className?: string;
}

export default function LedgerField({
  value,
  balance,
  placeholder,
  onFocus,
  onChange,
  className = "",
}: Props) {
  return (
    <div className={`flex-1 flex items-center gap-2 ${className}`}>
      <input
        type="text"
        className="flex-1 bg-transparent text-xs outline-none px-2 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded font-semibold text-zinc-800"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={e => onChange(e.target.value)}
      />
      {balance && (
        <span className="text-[10px] text-zinc-400 font-sans italic shrink-0 select-none">
          (Bal: {balance})
        </span>
      )}
    </div>
  );
}


---
### File: ./ui/PageFooterBar.tsx
---

/**
 * PageFooterBar — bottom status/navigation bar used on list pages.
 * Shows a count label on the left and a back/keyboard-hint on the right.
 */

interface Props {
  countLabel: string;
  backLabel?: string;
  onBack?: () => void;
}

export default function PageFooterBar({ countLabel, backLabel = "Esc → Back", onBack }: Props) {
  return (
    <div className="px-3 py-1.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 select-none">
      <span>{countLabel}</span>
      {onBack && (
        <button onClick={onBack} className="hover:text-zinc-800 transition-colors">
          {backLabel}
        </button>
      )}
    </div>
  );
}


---
### File: ./ui/VoucherTypeBadge.tsx
---

/**
 * VoucherTypeBadge — monochrome label for a voucher type string.
 * Black/white palette consistent with the app's design language.
 */

/** Solid accent class used as a background for VoucherView title bars */
export function voucherTypeSolidClass(_type: string): string {
  // All types use the same dark zinc bar — no per-type colour
  return "bg-zinc-900";
}

interface Props {
  type: string;
  size?: "xs" | "sm";
}

export default function VoucherTypeBadge({ type, size = "xs" }: Props) {
  const sizeClass = size === "sm"
    ? "text-[10px] px-2 py-0.5"
    : "text-[9px] px-1.5 py-0.5";

  return (
    <span
      className={`font-bold rounded uppercase tracking-wider select-none border border-zinc-300 bg-zinc-100 text-zinc-700 ${sizeClass}`}
    >
      {type}
    </span>
  );
}


---
### File: ./utils/formatCurrency.ts
---

export const formatIndianCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const parseIndianCurrency = (value: string): number => {
  return Number(value.replace(/,/g, '')) || 0;
};


---
### File: ./VoucherList.tsx
---

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { PageTitleBar, AlertBanner, SearchInput, DataTable, StatusBadge, RightActionPanel } from "../../components/ui";
import type { TableColumn } from "../../components/ui";
import { VoucherTypeBadge, PageFooterBar } from "./ui";

const VOUCHER_TYPES = ["Receipt", "Payment", "Contra", "Journal", "Sales", "Purchase"];

interface VoucherRow {
  voucher_id: number;
  voucher_type: string;
  voucher_number: string;
  date: string;
  narration: string | null;
  party_name: string | null;
  is_cancelled: number;
}

const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const TABLE_COLUMNS: TableColumn[] = [
  { key: "voucher_number", label: "Voucher No.",    span: "col-span-2" },
  { key: "voucher_type",   label: "Type",           span: "col-span-1" },
  { key: "date",           label: "Date",           span: "col-span-2" },
  { key: "party_name",     label: "Party / Narration", span: "col-span-4" },
  { key: "status",         label: "Status",         span: "col-span-2" },
  { key: "actions",        label: "",               span: "col-span-1", align: "right" },
];

export default function VoucherList() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const [selectedType, setSelectedType] = useState<string>("All");
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  const fetchVouchers = useCallback(async () => {
    if (!companyId || !fyId) return;
    setLoading(true);
    setError(null);
    try {
      const res: any = selectedType === "All"
        ? await window.api.voucher.getAll(companyId, fyId)
        : await window.api.voucher.getByType(companyId, fyId, selectedType);
      if (res.success) setVouchers(res.vouchers || []);
      else setError(res.error || "Failed to fetch vouchers");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId, selectedType]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        navigate("/transactions/vouchers");
      }
      if (e.altKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        navigate("/transactions/daybook");
      }
      if (e.altKey && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        navigate("/utilities/banking");
      }
      if (e.key === "Escape") {
        e.preventDefault();
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [navigate]);

  const listActions = [
    { key: "Alt+C", label: "New Voucher", onClick: () => navigate("/transactions/vouchers") },
    { key: "Alt+D", label: "Day Book", onClick: () => navigate("/transactions/daybook") },
    { key: "Alt+B", label: "Banking", onClick: () => navigate("/utilities/banking") },
    { key: "Esc", label: "Quit", onClick: () => navigate("/") },
  ];

  const filtered = vouchers.filter(v => {
    const q = search.toLowerCase();
    return (
      !q ||
      v.voucher_number?.toLowerCase().includes(q) ||
      v.party_name?.toLowerCase().includes(q) ||
      v.narration?.toLowerCase().includes(q)
    );
  });

  // Augment rows with rendered fields for DataTable
  const tableRows = filtered.map(v => ({
    ...v,
    voucher_number: v.voucher_number || "—",
    date: formatDate(v.date),
    party_name: v.party_name || v.narration || "—",
  }));

  const columns: TableColumn[] = TABLE_COLUMNS.map(col => ({
    ...col,
    render: col.key === "voucher_type"
      ? (row) => <VoucherTypeBadge type={row.voucher_type} />
      : col.key === "status"
        ? (row) => <StatusBadge label={row.is_cancelled ? "Cancelled" : "Active"} />
        : col.key === "actions"
          ? (row) => (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/transactions/voucher/${row.voucher_id}`); }}
                className="text-[10px] text-zinc-500 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-1.5 py-0.5 rounded transition-all font-sans uppercase opacity-0 group-hover:opacity-100"
              >
                View
              </button>
            )
          : undefined,
  }));

  return (
    <div className="flex-1 flex flex-col bg-white h-full text-xs select-none">
      {/* Title Bar */}
      <PageTitleBar
        title="Voucher Register"
        subtitle={selectedCompany?.name}
        actions={
          <button
            onClick={() => navigate("/transactions/vouchers")}
            className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-0.5 rounded uppercase tracking-wider transition-colors"
          >
            + New Voucher
          </button>
        }
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Side: Table & Filters */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Type Filter Tabs */}
          <div className="flex border-b border-zinc-200 bg-zinc-50 overflow-x-auto shrink-0">
            {["All", ...VOUCHER_TYPES].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
                  selectedType === type
                    ? "border-zinc-900 text-zinc-900 bg-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50/50">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by voucher no, party, narration…"
              className="max-w-sm"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />
          )}

          {/* Table */}
          <DataTable
            columns={columns}
            rows={tableRows}
            rowKey={row => row.voucher_id}
            loading={loading}
            onRowClick={row => navigate(`/transactions/voucher/${row.voucher_id}`)}
            emptyMessage={
              vouchers.length === 0
                ? "No vouchers found. Create your first voucher."
                : "No results match your search."
            }
            rowClassName={row => row.is_cancelled ? "opacity-50" : "group"}
          />
        </div>

        {/* Right Side: Action Panel */}
        <RightActionPanel actions={listActions} />
      </div>

      {/* Footer */}
      <PageFooterBar
        countLabel={`${filtered.length} voucher${filtered.length !== 1 ? "s" : ""}`}
        onBack={() => navigate("/")}
      />
    </div>
  );
}


---
### File: ./Vouchers.tsx
---

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";
import { useVoucherForm } from "./hooks/useVoucherForm";
import VoucherTypeTabs from "./components/VoucherTypeTabs";
import VoucherHeader from "./components/VoucherHeader";
import AccountSection from "./components/AccountSection";          // FIX #6 — now used
import ParticularsTable from "./components/ParticularsTable";
import InventoryParticularsTable from "./components/InventoryParticularsTable";
import LedgerPanel from "./components/LedgerPanel";
import ActionFooter from "./components/ActionFooter";
import StatusDropdown from "./components/StatusDropdown";
import NarrationSection from "./components/NarrationSection";      // FIX #7 — now used

// ── Popups ───────────────────────────────────────────────────────────────────
import BillWiseAllocationPopup from "./components/popups/BillWiseAllocationPopup";
import CostCentreAllocationPopup from "./components/popups/CostCentreAllocationPopup";
import BankAllocationPopup from "./components/popups/BankAllocationPopup";
import InlineMasterPopup from "./components/popups/InlineMasterPopup"; // FIX #5 — now used

// ── Shared UI ─────────────────────────────────────────────────────────────────
import { INDIAN_STATES } from "../../constants/states";
import { PageTitleBar, AlertBanner, RightActionPanel } from "../../components/ui";
import { LedgerField } from "./ui";

export default function Vouchers() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const form = useVoucherForm();

  // FIX #5 — inline master creation state (replaces navigate-away)
  const [inlineCreateType, setInlineCreateType] = useState<
    "ledger" | "stockItem" | "godown" | null
  >(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX #8 — stable ref for handleAcceptClick so setTimeout callbacks
  // never capture a stale closure.
  // ─────────────────────────────────────────────────────────────────────────────
  const acceptRef = useRef<() => void>(() => {});

  // FIX #8 — memoised so it is safe to list in dependency arrays
  const handleAcceptClick = useCallback(() => {
    // For Sales/Purchase: if the party ledger requires bill-wise details and
    // none have been entered yet, capture them before submitting.
    if (
      ["Sales", "Purchase"].includes(form.voucherType) &&
      form.partyLedger?.is_bill_wise === 1 &&
      form.partyBillReferences.length === 0
    ) {
      form.setActiveAllocation({
        type: "billWiseParty",
        ledgerId: form.partyLedger.ledger_id,
        ledgerName: form.partyLedger.name,
        amount: form.totalAmount,
        initialAllocations: [],
      });
      return;
    }
    form.handleSubmit();
  }, [
    form.voucherType,
    form.partyLedger,
    form.partyBillReferences,
    form.totalAmount,
    form.handleSubmit,
    form.setActiveAllocation,
  ]);

  // Keep the ref in sync so setTimeout callbacks always call the latest version
  useEffect(() => {
    acceptRef.current = handleAcceptClick;
  }, [handleAcceptClick]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Row-focus progression (moves the cursor to the next input after confirmation)
  // ─────────────────────────────────────────────────────────────────────────────

  const proceedToNextRow = useCallback(
    (idx: number) => {
      const isJournal = form.voucherType === "Journal";
      const isInventory = ["Sales", "Purchase"].includes(form.voucherType);

      if (isJournal) {
        if (idx === form.journalRows.length - 1) {
          form.handleAddJournalRow();
          setTimeout(() => {
            const next = document.querySelector(
              `[data-particular-ledger="${form.journalRows.length + 1}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        } else {
          setTimeout(() => {
            const next = document.querySelector(
              `[data-particular-ledger="${idx + 2}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        }
      } else if (isInventory) {
        if (idx === form.additionalEntries.length - 1) {
          form.handleAddAdditionalRow();
          setTimeout(() => {
            const next = document.querySelector(
              `[data-additional-ledger="${form.additionalEntries.length + 1}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        } else {
          setTimeout(() => {
            const next = document.querySelector(
              `[data-additional-ledger="${idx + 2}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        }
      } else {
        if (idx === form.particulars.length - 1) {
          form.handleAddParticularRow();
          setTimeout(() => {
            const next = document.querySelector(
              `[data-particular-ledger="${form.particulars.length + 1}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        } else {
          setTimeout(() => {
            const next = document.querySelector(
              `[data-particular-ledger="${idx + 2}"]`
            ) as HTMLInputElement | null;
            next?.focus();
          }, 50);
        }
      }
    },
    [
      form.voucherType,
      form.journalRows,
      form.additionalEntries,
      form.particulars,
      form.handleAddJournalRow,
      form.handleAddAdditionalRow,
      form.handleAddParticularRow,
    ]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Amount confirmation — triggers bill-wise / cost-centre popups when needed,
  // or simply moves focus to the next row.
  // ─────────────────────────────────────────────────────────────────────────────

  const handleParticularAmountConfirm = useCallback(
    (row: any, index: number) => {
      const { ledger, amountRaw, id } = row;
      const amount = Number(amountRaw) || 0;

      if (!ledger || amount <= 0) {
        proceedToNextRow(index);
        return;
      }

      if (ledger.is_bill_wise === 1) {
        form.setActiveAllocation({
          type: "billWise",
          rowId: id,
          ledgerId: ledger.ledger_id,
          ledgerName: ledger.name,
          amount,
          initialAllocations: row.billReferences ?? [],
        });
      } else if (ledger.allow_cost_centres === 1) {
        form.setActiveAllocation({
          type: "costCentre",
          rowId: id,
          ledgerId: ledger.ledger_id,
          ledgerName: ledger.name,
          amount,
          initialAllocations: row.costCentres ?? [],
        });
      } else {
        proceedToNextRow(index);
      }
    },
    [form.setActiveAllocation, proceedToNextRow]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Popup save handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleSaveBillWise = useCallback(
    (allocations: any[]) => {
      // Party bill-wise (Sales/Purchase) — save then proceed to submit
      if (form.activeAllocation?.type === "billWiseParty") {
        form.setPartyBillReferences(allocations);
        form.setActiveAllocation(null);
        // FIX #8 — use ref so the callback is never stale
        setTimeout(() => acceptRef.current(), 50);
        return;
      }

      const alloc = form.activeAllocation;
      if (!alloc || !("rowId" in alloc)) return;
      const { rowId } = alloc;

      const isJournal = form.voucherType === "Journal";
      const isInventory = ["Sales", "Purchase"].includes(form.voucherType);

      // Determine which list the row lives in
      const rowsList = isJournal
        ? form.journalRows
        : isInventory
        ? form.additionalEntries
        : form.particulars;

      const targetRow = rowsList.find((r) => r.id === rowId);
      if (!targetRow) return;

      // Save the bill references
      if (isJournal) {
        form.handleUpdateJournalRow(rowId, { billReferences: allocations });
      } else if (isInventory) {
        form.handleUpdateAdditionalRow(rowId, { billReferences: allocations });
      } else {
        form.handleUpdateParticularRow(rowId, { billReferences: allocations });
      }

      // If the ledger also requires cost-centre allocation, chain into that popup
      if (targetRow.ledger?.allow_cost_centres === 1) {
        form.setActiveAllocation({
          type: "costCentre",
          rowId,
          ledgerId: targetRow.ledger.ledger_id,
          ledgerName: targetRow.ledger.name,
          amount: Number(targetRow.amountRaw) || 0,
          initialAllocations: (targetRow as any).costCentres ?? [],
        });
      } else {
        form.setActiveAllocation(null);
        const idx = rowsList.findIndex((r) => r.id === rowId);
        proceedToNextRow(idx);
      }
    },
    [
      form.activeAllocation,
      form.voucherType,
      form.journalRows,
      form.additionalEntries,
      form.particulars,
      form.setPartyBillReferences,
      form.setActiveAllocation,
      form.handleUpdateJournalRow,
      form.handleUpdateAdditionalRow,
      form.handleUpdateParticularRow,
      proceedToNextRow,
    ]
  );

  const handleSaveCostCentre = useCallback(
    (allocations: any[]) => {
      const alloc = form.activeAllocation;
      if (!alloc || !("rowId" in alloc)) return;
      const { rowId } = alloc;

      const isJournal = form.voucherType === "Journal";
      const isInventory = ["Sales", "Purchase"].includes(form.voucherType);

      const rowsList = isJournal
        ? form.journalRows
        : isInventory
        ? form.additionalEntries
        : form.particulars;

      if (isJournal) {
        form.handleUpdateJournalRow(rowId, { costCentres: allocations });
      } else if (isInventory) {
        form.handleUpdateAdditionalRow(rowId, { costCentres: allocations });
      } else {
        form.handleUpdateParticularRow(rowId, { costCentres: allocations });
      }

      form.setActiveAllocation(null);
      const idx = rowsList.findIndex((r) => r.id === rowId);
      proceedToNextRow(idx);
    },
    [
      form.activeAllocation,
      form.voucherType,
      form.journalRows,
      form.additionalEntries,
      form.particulars,
      form.setActiveAllocation,
      form.handleUpdateJournalRow,
      form.handleUpdateAdditionalRow,
      form.handleUpdateParticularRow,
      proceedToNextRow,
    ]
  );

  const handleSaveBankDetails = useCallback(
    (details: any) => {
      form.setBankDetails(details);
      form.setActiveAllocation(null);
      // FIX #8 — use ref so the callback is never stale
      setTimeout(() => acceptRef.current(), 50);
    },
    [form.setBankDetails, form.setActiveAllocation]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // FIX #2 — canAccept now uses exported debitTotal / creditTotal (no `as any`)
  // ─────────────────────────────────────────────────────────────────────────────

  const canAccept = useMemo(() => {
    if (form.isSubmitting) return false;

    if (["Receipt", "Payment", "Contra"].includes(form.voucherType)) {
      const filled = form.particulars.filter(
        (p) => !!p.ledger && (Number(p.amountRaw) || 0) > 0
      );
      const hasDebit = filled.some((p) => p.type === "Dr");
      const hasCredit = filled.some((p) => p.type === "Cr");
      return filled.length >= 2 && hasDebit && hasCredit;
    }

    if (form.voucherType === "Journal") {
      const filled = form.journalRows.filter(
        (r) => !!r.ledger && (Number(r.amountRaw) || 0) > 0
      );
      // FIX #2 — form.debitTotal / form.creditTotal are now properly exported
      return (
        filled.length >= 2 &&
        Math.abs(form.debitTotal - form.creditTotal) < 0.01
      );
    }

    if (["Sales", "Purchase"].includes(form.voucherType)) {
      return (
        !!form.partyLedger &&
        !!form.salesPurchaseLedger &&
        form.stockEntries.some(
          (s) => !!s.stockItem && (Number(s.amountRaw) || 0) > 0
        )
      );
    }

    return false;
  }, [
    form.isSubmitting,
    form.voucherType,
    form.particulars,
    form.journalRows,
    form.debitTotal,   // FIX #2
    form.creditTotal,  // FIX #2
    form.partyLedger,
    form.salesPurchaseLedger,
    form.stockEntries,
  ]);

  const handleInventorySearchChange = useCallback(
    (term: string) => {
      if (form.activeField?.type === "stockItem") {
        form.setStockSearchTerm(term);
      } else {
        form.setLedgerSearchTerm(term);
      }
    },
    [form.activeField, form.setStockSearchTerm, form.setLedgerSearchTerm]
  );


  const voucherActions = useMemo(
    () => [
      {
        key: "F4",
        label: "Contra",
        onClick: () => form.setVoucherType("Contra"),
        active: form.voucherType === "Contra",
      },
      {
        key: "F5",
        label: "Payment",
        onClick: () => form.setVoucherType("Payment"),
        active: form.voucherType === "Payment",
      },
      {
        key: "F6",
        label: "Receipt",
        onClick: () => form.setVoucherType("Receipt"),
        active: form.voucherType === "Receipt",
      },
      {
        key: "F7",
        label: "Journal",
        onClick: () => form.setVoucherType("Journal"),
        active: form.voucherType === "Journal",
      },
      {
        key: "F8",
        label: "Sales",
        onClick: () => form.setVoucherType("Sales"),
        active: form.voucherType === "Sales",
      },
      {
        key: "F9",
        label: "Purchase",
        onClick: () => form.setVoucherType("Purchase"),
        active: form.voucherType === "Purchase",
      },
      {
        key: "Alt+C",
        label: "Create Ledger",
        // FIX #5 — opens inline popup instead of navigating away
        onClick: () => setInlineCreateType("ledger"),
      },
      {
        key: "Ctrl+A",
        label: "Accept",
        onClick: handleAcceptClick,
        disabled: !canAccept,
      },
      { key: "Esc", label: "Quit", onClick: () => navigate("/") },
    ],
    [form.voucherType, form.setVoucherType, handleAcceptClick, canAccept, navigate]
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Keyboard shortcuts
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Voucher type switching
      if (e.key === "F4") { e.preventDefault(); form.setVoucherType("Contra"); }
      if (e.key === "F5") { e.preventDefault(); form.setVoucherType("Payment"); }
      if (e.key === "F6") { e.preventDefault(); form.setVoucherType("Receipt"); }
      if (e.key === "F7") { e.preventDefault(); form.setVoucherType("Journal"); }
      if (e.key === "F8") { e.preventDefault(); form.setVoucherType("Sales"); }
      if (e.key === "F9") { e.preventDefault(); form.setVoucherType("Purchase"); }

      // Status toggle
      if (e.key === "F11") {
        e.preventDefault();
        form.setStatus((prev) => (prev === "Regular" ? "Post-Dated" : "Regular"));
      }

      // Accept: Alt+A, Ctrl+A, Cmd+A
      if ((e.altKey || e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (canAccept) handleAcceptClick();
      }

      // FIX #5 — Alt+C opens inline ledger creation, does NOT navigate away
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        setInlineCreateType("ledger");
      }

      // Quit — only when no popup/panel is open
      if (
        e.key === "Escape" &&
        !form.activeField &&
        !form.activeAllocation &&
        !inlineCreateType
      ) {
        e.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [
    form.setVoucherType,
    form.setStatus,
    form.activeField,
    form.activeAllocation,
    canAccept,
    handleAcceptClick,
    inlineCreateType,
    navigate,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────────────────

  const panelOpen = !!form.activeField;

  // The search term shown in LedgerPanel depends on what kind of field is active
  const panelSearchTerm =
    form.activeField?.type === "stockItem"
      ? form.stockSearchTerm
      : form.ledgerSearchTerm;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col bg-white h-full text-xs select-none">

      {/* ── Title bar ─────────────────────────────────────────────────────────── */}
      <PageTitleBar
        title="Accounting Voucher Creation"
        subtitle={selectedCompany?.name ?? ""}
      />

      {/* ── Toasts ────────────────────────────────────────────────────────────── */}
      {form.error && (
        <AlertBanner
          type="error"
          message={form.error}
          onDismiss={() => form.setError(null)}
        />
      )}
      {form.success && (
        <AlertBanner
          type="success"
          message={form.success}
          onDismiss={() => form.setSuccess(null)}
          actions={
            <button
              onClick={() => navigate("/transactions/voucher-list")}
              className="text-[10px] text-zinc-600 underline hover:text-zinc-900 font-sans transition-colors"
            >
              View Voucher Register →
            </button>
          }
        />
      )}

      {/* ── Voucher type tabs ─────────────────────────────────────────────────── */}
      <VoucherTypeTabs activeType={form.voucherType} onChange={form.setVoucherType} />

      {/* ── Voucher number + date header ──────────────────────────────────────── */}
      <VoucherHeader
        voucherType={form.voucherType}
        voucherNumber={form.voucherNumber}   // FIX #4 — string, not number
        dateDisplay={form.dateDisplay}
        date={form.date}
        onDateChange={form.setDate}
        supplierInvoiceNo={form.supplierInvoiceNo}
        onSupplierInvoiceNoChange={form.setSupplierInvoiceNo}
        supplierInvoiceDate={form.supplierInvoiceDate}
        onSupplierInvoiceDateChange={form.setSupplierInvoiceDate}
      />

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-x-auto">
        <div className="flex-1 flex flex-col min-w-0 bg-white">

          {/* ════════════════════════════════════════════════════════════════════
              Layout 1 — Single-entry: Receipt (F6), Payment (F5), Contra (F4)
              FIX #6 — AccountSection is now rendered above ParticularsTable
          ════════════════════════════════════════════════════════════════════ */}
          {["Receipt", "Payment", "Contra"].includes(form.voucherType) && (
            <div className="flex-1 flex flex-col min-h-0">

              {/* Status bar */}
              <div className="flex items-center min-h-[36px] border-b border-zinc-100 py-1.5 px-3 bg-zinc-50/20">
                <StatusDropdown status={form.status} onChange={form.setStatus} />
              </div>

              {/* FIX #6 — Account field (Tally's top "Account" row for single-entry) */}
              <div className="border-b border-zinc-200">
                <AccountSection
                  ledger={form.accountLedger}
                  balance={form.accountBalance}
                  searchTerm={
                    form.activeField?.type === "account"
                      ? form.ledgerSearchTerm
                      : ""
                  }
                  onFieldFocus={() => form.handleFieldFocus({ type: "account" })}
                  onSearchChange={(term) => {
                    form.setLedgerSearchTerm(term);
                    form.handleFieldFocus({ type: "account" });
                  }}
                />
              </div>

              {/* Particulars grid */}
              <ParticularsTable
                rows={form.particulars}
                onUpdateRow={form.handleUpdateParticularRow}
                onAddRow={form.handleAddParticularRow}
                onRemoveRow={form.handleRemoveParticularRow}
                onFieldFocus={form.handleFieldFocus}
                onSearchChange={form.setLedgerSearchTerm}
                searchTerm={form.ledgerSearchTerm}
                activeRowId={
                  form.activeField?.type === "particular"
                    ? form.activeField.rowId
                    : null
                }
                onAmountConfirm={handleParticularAmountConfirm}
                voucherType={form.voucherType}
                debitTotal={form.debitTotal}
                creditTotal={form.creditTotal}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              Layout 2 — Journal (F7)
          ════════════════════════════════════════════════════════════════════ */}
          {form.voucherType === "Journal" && (
            <div className="flex-1 flex flex-col min-h-0">

              {/* Status bar */}
              <div className="flex items-center min-h-[36px] border-b border-zinc-100 py-1.5 px-3 bg-zinc-50/20">
                <StatusDropdown status={form.status} onChange={form.setStatus} />
              </div>

              <ParticularsTable
                rows={form.journalRows}
                onUpdateRow={form.handleUpdateJournalRow}
                onAddRow={form.handleAddJournalRow}
                onRemoveRow={form.handleRemoveJournalRow}
                onFieldFocus={form.handleFieldFocus}
                onSearchChange={form.setLedgerSearchTerm}
                searchTerm={form.ledgerSearchTerm}
                activeRowId={
                  form.activeField?.type === "particular"
                    ? form.activeField.rowId
                    : null
                }
                isJournal
                onAmountConfirm={handleParticularAmountConfirm}
                debitTotal={form.debitTotal}
                creditTotal={form.creditTotal}
              />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              Layout 3 — Inventory invoice: Sales (F8), Purchase (F9)
          ════════════════════════════════════════════════════════════════════ */}
          {["Sales", "Purchase"].includes(form.voucherType) && (
            <div className="flex-1 flex flex-col min-h-0">

              {/* Status bar */}
              <div className="flex items-center min-h-[36px] border-b border-zinc-100 py-1.5 px-3 bg-zinc-50/20">
                <StatusDropdown status={form.status} onChange={form.setStatus} />
              </div>

              {/* Party + Sales/Purchase ledger + Ref + Supply state */}
              <div className="grid grid-cols-2 gap-4 p-3 border-b border-zinc-200 bg-zinc-50/20">

                {/* Left column */}
                <div className="space-y-1.5">
                  {/* Party ledger */}
                  <div className="flex items-center min-h-[30px]">
                    <span className="w-24 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Party A/c Name
                    </span>
                    <span className="text-zinc-400 mr-2">:</span>
                    <LedgerField
                      value={
                        form.activeField?.type === "party"
                          ? form.ledgerSearchTerm
                          : form.partyLedger?.name ?? ""
                      }
                      balance={form.partyBalance}
                      placeholder="Select Party Ledger (Debtor / Creditor / Cash / Bank)…"
                      onFocus={() => form.handleFieldFocus({ type: "party" })}
                      onChange={(v) => {
                        form.setLedgerSearchTerm(v);
                        if (!form.partyLedger) form.handleFieldFocus({ type: "party" });
                      }}
                    />
                  </div>

                  {/* Sales / Purchase ledger */}
                  <div className="flex items-center min-h-[30px]">
                    <span className="w-24 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {form.voucherType} Ledger
                    </span>
                    <span className="text-zinc-400 mr-2">:</span>
                    <LedgerField
                      value={
                        form.activeField?.type === "salesPurchase"
                          ? form.ledgerSearchTerm
                          : form.salesPurchaseLedger?.name ?? ""
                      }
                      balance={form.salesPurchaseBalance}
                      placeholder={`Select ${form.voucherType} Ledger…`}
                      onFocus={() => form.handleFieldFocus({ type: "salesPurchase" })}
                      onChange={(v) => {
                        form.setLedgerSearchTerm(v);
                        if (!form.salesPurchaseLedger)
                          form.handleFieldFocus({ type: "salesPurchase" });
                      }}
                    />
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-1.5">
                  {/* Ref No. + Date */}
                  <div className="flex items-center min-h-[30px]">
                    <span className="w-28 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Ref No. &amp; Date
                    </span>
                    <span className="text-zinc-400 mr-2">:</span>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        className="w-1/2 bg-transparent text-xs outline-none px-2 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded font-semibold text-zinc-800"
                        value={form.referenceNumber}
                        onChange={(e) => form.setReferenceNumber(e.target.value)}
                        placeholder="Ref Number"
                      />
                      <input
                        type="date"
                        className="w-1/2 bg-transparent text-xs outline-none px-2 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded font-semibold text-zinc-800"
                        value={form.referenceDate}
                        onChange={(e) => form.setReferenceDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Place of supply */}
                  <div className="flex items-center min-h-[30px]">
                    <span className="w-28 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Place of Supply
                    </span>
                    <span className="text-zinc-400 mr-2">:</span>
                    <select
                      className="flex-1 bg-transparent text-xs outline-none px-1.5 py-0.5 border border-transparent hover:border-zinc-200 focus:border-zinc-800 transition-colors bg-white/50 rounded font-semibold text-zinc-800 cursor-pointer"
                      value={form.placeOfSupply}
                      onChange={(e) => form.setPlaceOfSupply(e.target.value)}
                    >
                      <option value="Select">Select Supply State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Stock + additional ledger grid
                  FIX #3 — handleInventorySearchChange routes to the correct setter */}
              <InventoryParticularsTable
                stockEntries={form.stockEntries}
                additionalEntries={form.additionalEntries}
                allGodowns={form.allGodowns}
                allUnits={form.allUnits}
                activeField={form.activeField}
                searchTerm={form.ledgerSearchTerm}
                stockSearchTerm={form.stockSearchTerm}
                onFieldFocus={form.handleFieldFocus}
                onSearchChange={handleInventorySearchChange}  // FIX #3
                onUpdateStockRow={form.handleUpdateStockRow}
                onAddStockRow={form.handleAddStockRow}
                onRemoveStockRow={form.handleRemoveStockRow}
                onUpdateAdditionalRow={form.handleUpdateAdditionalRow}
                onAddAdditionalRow={form.handleAddAdditionalRow}
                onRemoveAdditionalRow={form.handleRemoveAdditionalRow}
                onAmountConfirm={handleParticularAmountConfirm}
              />
            </div>
          )}

          {/* ── FIX #7 — NarrationSection replaces the inline div ──────────────── */}
          <NarrationSection
            value={form.narration}
            totalAmount={form.totalAmount}
            onChange={form.setNarration}
          />
        </div>

        {/* ── Ledger / stock selection panel ──────────────────────────────────── */}
        {panelOpen && (
          <LedgerPanel
            isOpen={panelOpen}
            activeField={form.activeField}
            ledgers={form.allLedgers}
            stockItems={form.allStockItems}
            godowns={form.allGodowns}
            loading={form.ledgersLoading}
            searchTerm={panelSearchTerm}             // correct term per field type
            onSearchChange={
              form.activeField?.type === "stockItem"
                ? form.setStockSearchTerm
                : form.setLedgerSearchTerm
            }
            onSelect={form.handleLedgerPanelSelect}
            onClose={form.handleFieldBlur}
            checkIsCashOrBank={form.checkIsCashOrBank}
            checkLedgerGroup={form.checkLedgerGroup}
            voucherType={form.voucherType}
            // FIX #5 — opens inline popup instead of navigating away
            onInlineCreate={(type) => setInlineCreateType(type)}
          />
        )}

        {/* ── Right action panel ───────────────────────────────────────────────── */}
        <RightActionPanel actions={voucherActions} />
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <ActionFooter
        onAccept={handleAcceptClick}
        onCancelVch={form.resetForm}
        onQuit={() => navigate("/")}
        isSubmitting={form.isSubmitting}
        canAccept={canAccept}
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          Popups
      ══════════════════════════════════════════════════════════════════════════ */}

      {/* Bill-wise allocation (particulars / journal row) */}
      {form.activeAllocation?.type === "billWise" && (
        <BillWiseAllocationPopup
          ledgerId={form.activeAllocation.ledgerId}
          ledgerName={form.activeAllocation.ledgerName}
          totalAmount={form.activeAllocation.amount}
          initialAllocations={form.activeAllocation.initialAllocations ?? []}
          onClose={() => form.setActiveAllocation(null)}
          onSave={handleSaveBillWise}
        />
      )}

      {/* Bill-wise allocation (party ledger on Sales/Purchase) */}
      {form.activeAllocation?.type === "billWiseParty" && (
        <BillWiseAllocationPopup
          ledgerId={form.activeAllocation.ledgerId}
          ledgerName={form.activeAllocation.ledgerName}
          totalAmount={form.activeAllocation.amount}
          initialAllocations={form.partyBillReferences}
          onClose={() => form.setActiveAllocation(null)}
          onSave={handleSaveBillWise}
        />
      )}

      {/* Cost-centre allocation */}
      {form.activeAllocation?.type === "costCentre" && (
        <CostCentreAllocationPopup
          companyId={selectedCompany!.company_id}
          ledgerName={form.activeAllocation.ledgerName}
          totalAmount={form.activeAllocation.amount}
          initialAllocations={form.activeAllocation.initialAllocations ?? []}
          onClose={() => form.setActiveAllocation(null)}
          onSave={handleSaveCostCentre}
        />
      )}

      {/* Bank details */}
      {form.activeAllocation?.type === "bankDetails" && (
        <BankAllocationPopup
          ledgerId={form.activeAllocation.ledgerId}
          ledgerName={form.activeAllocation.ledgerName}
          amount={form.activeAllocation.amount}
          initialDetails={form.bankDetails}
          onClose={() => form.setActiveAllocation(null)}
          onSave={handleSaveBankDetails}
        />
      )}

      {/* FIX #5 — Inline master creation popup (ledger / stock item / godown) */}
      {inlineCreateType && (
        <InlineMasterPopup
          companyId={selectedCompany!.company_id}
          initialType={inlineCreateType}
          onClose={() => setInlineCreateType(null)}
          onSuccess={async (_type, created) => {
            // Refresh all master lists so the new item appears immediately
            await form.fetchContextData();
            setInlineCreateType(null);
            // Auto-select the newly created item into whichever field is active
            if (created) {
              form.handleLedgerPanelSelect(created);
            }
          }}
        />
      )}
    </div>
  );
}

---
### File: ./VoucherView.tsx
---

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SectionCard, AlertBanner } from "../../components/ui";
import { VoucherTypeBadge, AmountDisplay, PageFooterBar } from "./ui";

interface VoucherEntry {
  entry_id: number;
  ledger_id: number;
  ledger_name: string;
  type: "Dr" | "Cr";
  amount: number;
  currency: string;
}

interface StockEntry {
  stock_entry_id: number;
  item_name: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Voucher {
  voucher_id: number;
  voucher_type: string;
  voucher_number: string;
  date: string;
  reference_number: string | null;
  reference_date: string | null;
  narration: string | null;
  party_name: string | null;
  party_ledger_id: number | null;
  place_of_supply: string | null;
  is_invoice: number;
  is_cancelled: number;
  created_at: string;
  entries: VoucherEntry[];
  stock_entries: StockEntry[];
}

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A single labelled detail cell inside the header card */
function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5">
      <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-0.5">{label}</div>
      <div className="text-zinc-800 font-semibold truncate" title={value}>{value}</div>
    </div>
  );
}

/** Dr / Cr badge pill for entry rows */
function DrCrBadge({ type }: { type: "Dr" | "Cr" }) {
  const cls = type === "Dr"
    ? "bg-black text-white"
    : "bg-zinc-600 text-white";
  return (
    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${cls}`}>{type}</span>
  );
}


function TableHeader({ cols }: { cols: { label: string; span: string; align?: string }[] }) {
  return (
    <div className="grid grid-cols-12 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-500 select-none">
      {cols.map(c => (
        <div key={c.label} className={`${c.span} ${c.align ?? ""}`}>{c.label}</div>
      ))}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function VoucherView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await window.api.voucher.getById(Number(id));
        if (res.success) setVoucher(res.voucher as Voucher);
        else setError(res.error || "Voucher not found");
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!voucher) return;
    if (!window.confirm(`Cancel voucher ${voucher.voucher_number}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const res = await window.api.voucher.cancel(voucher.voucher_id);
      if (res.success) setVoucher(prev => prev ? { ...prev, is_cancelled: 1 } : prev);
      else setError(res.error || "Failed to cancel");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!voucher) return;
    if (!window.confirm(`Permanently delete voucher ${voucher.voucher_number}?`)) return;
    try {
      const res = await window.api.voucher.delete(voucher.voucher_id);
      if (res.success) navigate("/transactions/voucher-list");
      else setError(res.error || "Failed to delete");
    } catch (e: any) {
      setError(e.message);
    }
  };

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 text-xs">
        Loading voucher…
      </div>
    );
  }

  if (error && !voucher) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500 text-xs">
        <span className="text-red-600">{error}</span>
        <button onClick={() => navigate(-1)} className="underline hover:text-zinc-900">← Go Back</button>
      </div>
    );
  }

  if (!voucher) return null;

  // ── Computed totals ──
  const drTotal    = voucher.entries.filter(e => e.type === "Dr").reduce((s, e) => s + e.amount, 0);
  const crTotal    = voucher.entries.filter(e => e.type === "Cr").reduce((s, e) => s + e.amount, 0);
  const stockTotal = voucher.stock_entries.reduce((s, e) => s + e.amount, 0);
  const balanced   = Math.abs(drTotal - crTotal) < 0.01;

  const accentClass = "bg-zinc-900";

  // Header detail cells (skip nulls)
  const headerCells: { label: string; value: string }[] = [
    { label: "Voucher No.", value: voucher.voucher_number },
    { label: "Type",        value: voucher.voucher_type },
    { label: "Date",        value: formatDate(voucher.date) },
    ...(voucher.party_name       ? [{ label: "Party",          value: voucher.party_name }]                   : []),
    ...(voucher.reference_number ? [{ label: "Ref No.",        value: voucher.reference_number }]             : []),
    ...(voucher.reference_date   ? [{ label: "Ref Date",       value: formatDate(voucher.reference_date) }]   : []),
    ...(voucher.place_of_supply  ? [{ label: "Place of Supply",value: voucher.place_of_supply }]              : []),
    ...(voucher.narration        ? [{ label: "Narration",      value: voucher.narration }]                    : []),
  ];

  return (
    <div className="flex-1 flex flex-col bg-white h-full text-xs select-none">

      {/* Coloured Title Bar */}
      <div className={`px-4 py-2.5 text-white flex justify-between items-center shadow-sm shrink-0 ${accentClass}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors text-sm">←</button>
          <div>
            <div className="text-sm font-bold tracking-wide uppercase">
              {voucher.voucher_type} Voucher — {voucher.voucher_number}
            </div>
            <div className="text-[10px] text-white/60 font-sans">
              {formatDate(voucher.date)}
              {voucher.is_cancelled ? " · CANCELLED" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!voucher.is_cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              Cancel Voucher
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-[10px] bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded uppercase tracking-wider transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && <AlertBanner type="error" message={error} onDismiss={() => setError(null)} />}

      {/* Body */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">

        {/* Header Details Card */}
        <SectionCard title="Voucher Details">
          <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-y divide-zinc-100">
            {headerCells.map(({ label, value }) => (
              <DetailCell key={label} label={label} value={value} />
            ))}
          </div>
        </SectionCard>

        {/* Accounting Entries */}
        {voucher.entries.length > 0 && (
          <SectionCard
            title="Accounting Entries"
            headerRight={
              <div className="flex gap-3 text-[10px] text-zinc-500">
                <span>Dr: <span className="font-bold text-zinc-800"><AmountDisplay amount={drTotal} /></span></span>
                <span>Cr: <span className="font-bold text-zinc-800"><AmountDisplay amount={crTotal} /></span></span>
              </div>
            }
          >
            <TableHeader cols={[
              { label: "Dr/Cr", span: "col-span-1", align: "text-center" },
              { label: "Ledger Account", span: "col-span-7" },
              { label: "Amount", span: "col-span-4", align: "text-right" },
            ]} />

            {voucher.entries.map(entry => (
              <div key={entry.entry_id} className="grid grid-cols-12 px-3 py-2 border-b border-zinc-100 items-center hover:bg-zinc-50/50 transition-colors">
                <div className="col-span-1 text-center">
                  <DrCrBadge type={entry.type} />
                </div>
                <div className="col-span-7 text-zinc-800 font-semibold truncate">
                  {entry.ledger_name || `Ledger #${entry.ledger_id}`}
                </div>
                <div className="col-span-4 text-right font-bold text-zinc-900">
                  <AmountDisplay amount={entry.amount} />
                </div>
              </div>
            ))}

            {/* Balance indicator */}
            <div className={`px-3 py-1.5 text-[10px] font-bold text-right border-t border-zinc-100 ${balanced ? "bg-zinc-50 text-zinc-700" : "bg-zinc-900 text-white"}`}>
              {balanced
                ? "✓ Balanced"
                : `⚠ Difference: `}
              {!balanced && <AmountDisplay amount={Math.abs(drTotal - crTotal)} />}
            </div>
          </SectionCard>
        )}

        {/* Inventory / Stock Entries */}
        {voucher.stock_entries.length > 0 && (
          <SectionCard title="Inventory Particulars">
            <TableHeader cols={[
              { label: "Item Name", span: "col-span-5" },
              { label: "Qty",       span: "col-span-2", align: "text-right" },
              { label: "Rate",      span: "col-span-2", align: "text-right" },
              { label: "Amount",    span: "col-span-3", align: "text-right" },
            ]} />

            {voucher.stock_entries.map(item => (
              <div key={item.stock_entry_id} className="grid grid-cols-12 px-3 py-2 border-b border-zinc-100 items-center hover:bg-zinc-50/50 transition-colors">
                <div className="col-span-5 text-zinc-800 font-semibold truncate">{item.item_name || "—"}</div>
                <div className="col-span-2 text-right text-zinc-600">{item.quantity}</div>
                <div className="col-span-2 text-right text-zinc-600"><AmountDisplay amount={item.rate} /></div>
                <div className="col-span-3 text-right font-bold text-zinc-900"><AmountDisplay amount={item.amount} /></div>
              </div>
            ))}

            {/* Stock total row */}
            <div className="grid grid-cols-12 px-3 py-2 bg-zinc-50 border-t border-zinc-200">
              <div className="col-span-9 font-bold text-zinc-700 uppercase text-[10px] tracking-wider">Total Inventory Value</div>
              <div className="col-span-3 text-right font-bold text-zinc-900"><AmountDisplay amount={stockTotal} /></div>
            </div>
          </SectionCard>
        )}

        {/* Type badge (visual flourish at bottom) */}
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <VoucherTypeBadge type={voucher.voucher_type} size="sm" />
          <span>Voucher ID: {voucher.voucher_id}</span>
          <span>·</span>
          <span>Created: {formatDate(voucher.created_at)}</span>
        </div>
      </div>

      <PageFooterBar
        countLabel={`Voucher #${voucher.voucher_id}`}
        backLabel="← Back to List"
        onBack={() => navigate("/transactions/voucher-list")}
      />
    </div>
  );
}
