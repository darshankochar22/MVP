import type { useVoucherForm } from "../hooks/useVoucherForm";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
  /** Enter on Quantity → add another godown row for the SAME item (Tally flow). */
  physicalStockQtyEnter: (idx: number) => void;
  /** Double-Enter on an empty next-godown row → finish item, start a new one. */
  physicalStockGodownNewItem: (rowId: string) => void;
}

export default function PhysicalStockVoucher({
  form,
  physicalStockQtyEnter,
  physicalStockGodownNewItem,
}: Props) {
  return (
    <>
      {/* Voucher heading */}
      <div className="text-center font-bold text-sm py-1 border-b border-zinc-300 shrink-0 bg-white">
        Physical Stock Verification
      </div>

      {/* Physical Stock Table Header */}
      <div className="flex border-b border-black shrink-0 px-3 py-0.5 bg-zinc-100 text-xs font-bold text-zinc-800">
        <div className="flex-1 min-w-[200px]">Name of Item</div>
        <div className="w-32">Godown</div>
        <div className="w-24">Batch / Lot</div>
        <div className="w-24">Mfg Date</div>
        <div className="w-24">Expiry Date</div>
        <div className="w-24 text-right">Quantity</div>
        <div className="w-24 text-right">Rate</div>
        <div className="w-28 text-right">Amount</div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-white">
        {form.stockEntries.map((row, idx) => {
          const isActive =
            form.activeField?.type === "stockItem" &&
            form.activeField.rowId === row.id;
          const isGodownActive =
            form.activeField?.type === "stockGodown" &&
            form.activeField.rowId === row.id;

          // Item name shows once per consecutive same-item group; the godown rows
          // beneath it inherit the item. Batch columns only for batch-tracked items.
          const prevRow = idx > 0 ? form.stockEntries[idx - 1] : null;
          const isFirstOfGroup =
            !prevRow || !prevRow.stockItem || prevRow.stockItem.item_id !== row.stockItem?.item_id;
          const isBatch = Number((row.stockItem as any)?.track_batches) === 1;

          return (
            <div
              key={row.id}
              className="flex items-center border-b border-zinc-100 min-h-[26px] group px-3 py-1 hover:bg-zinc-50"
            >
              {/* Item Name — only on the first row of each item group */}
              <div className="flex-1 min-w-[200px] flex items-center gap-1">
                {isFirstOfGroup ? (
                  <input
                    data-stock-item={idx + 1}
                    type="text"
                    className="flex-1 text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono font-semibold"
                    value={isActive ? form.stockSearchTerm : (row.stockItem?.name ?? "")}
                    placeholder={idx === 0 ? "Select Item…" : ""}
                    onFocus={() =>
                      form.handleFieldFocus({ type: "stockItem", rowId: row.id })
                    }
                    onChange={(e) => {
                      form.setStockSearchTerm(e.target.value);
                      if (!row.stockItem)
                        form.handleFieldFocus({ type: "stockItem", rowId: row.id });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && row.stockItem) {
                        e.preventDefault();
                        (document.querySelector(`[data-stock-godown="${idx + 1}"]`) as HTMLInputElement | null)?.focus();
                      }
                    }}
                    autoComplete="off"
                  />
                ) : (
                  <span className="flex-1 px-1" />
                )}
                {form.stockEntries.length > 1 && (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => form.handleRemoveStockRow(row.id)}
                    className="text-xs text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Godown */}
              <div className="w-32">
                <input
                  data-stock-godown={idx + 1}
                  type="text"
                  className="w-full text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                  value={isGodownActive ? form.ledgerSearchTerm : (row.godown?.name ?? "")}
                  placeholder="Select Godown…"
                  onFocus={() =>
                    form.handleFieldFocus({ type: "stockGodown", rowId: row.id })
                  }
                  onChange={(e) => {
                    form.setLedgerSearchTerm(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    if (row.godown) {
                      e.preventDefault();
                      const sel = isBatch ? `[data-stock-batch="${idx + 1}"]` : `[data-stock-qty="${idx + 1}"]`;
                      (document.querySelector(sel) as HTMLInputElement | null)?.focus();
                      return;
                    }
                    if (form.ledgerSearchTerm) return; // typing a godown name → let the panel select it
                    // Empty godown: 1st Enter closes the List of Godowns, 2nd Enter starts a new item.
                    e.preventDefault();
                    e.stopPropagation();
                    if (isGodownActive) form.handleFieldBlur();
                    else physicalStockGodownNewItem(row.id);
                  }}
                  autoComplete="off"
                />
              </div>

              {/* Batch / Lot — batch-tracked items only */}
              <div className="w-24">
                {isBatch && (
                  <input
                    data-stock-batch={idx + 1}
                    type="text"
                    className="w-full text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                    value={row.batchNo || ""}
                    placeholder="Batch No…"
                    onChange={(e) =>
                      form.handleUpdateStockRow(row.id, { batchNo: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (document.querySelector(`[data-stock-mfg="${idx + 1}"]`) as HTMLInputElement | null)?.focus();
                      }
                    }}
                  />
                )}
              </div>

              {/* Mfg Date — batch-tracked items only */}
              <div className="w-24">
                {isBatch && (
                  <input
                    data-stock-mfg={idx + 1}
                    type="text"
                    className="w-full text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                    value={row.mfgDate || ""}
                    placeholder="YYYY-MM-DD"
                    onChange={(e) =>
                      form.handleUpdateStockRow(row.id, { mfgDate: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (document.querySelector(`[data-stock-expiry="${idx + 1}"]`) as HTMLInputElement | null)?.focus();
                      }
                    }}
                  />
                )}
              </div>

              {/* Expiry Date — batch-tracked items only */}
              <div className="w-24">
                {isBatch && (
                  <input
                    data-stock-expiry={idx + 1}
                    type="text"
                    className="w-full text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                    value={row.expiryDate || ""}
                    placeholder="date / 6 Months"
                    onChange={(e) =>
                      form.handleUpdateStockRow(row.id, { expiryDate: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (document.querySelector(`[data-stock-qty="${idx + 1}"]`) as HTMLInputElement | null)?.focus();
                      }
                    }}
                  />
                )}
              </div>

              {/* Quantity */}
              <div className="w-24 text-right pr-1">
                <input
                  data-stock-qty={idx + 1}
                  type="text"
                  inputMode="decimal"
                  className="w-full text-right text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono font-semibold"
                  value={row.quantityRaw}
                  onChange={(e) =>
                    form.handleUpdateStockRow(row.id, { quantityRaw: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      // Tally flow: do not go to Amount — add another godown row for this item.
                      physicalStockQtyEnter(idx);
                    }
                  }}
                />
              </div>

              {/* Rate (optional valuation) */}
              <div className="w-24 text-right pr-1">
                <input
                  data-stock-rate={idx + 1}
                  type="text"
                  inputMode="decimal"
                  className="w-full text-right text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                  value={row.rateRaw}
                  onChange={(e) =>
                    form.handleUpdateStockRow(row.id, { rateRaw: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      physicalStockQtyEnter(idx);
                    }
                  }}
                />
              </div>

              {/* Amount */}
              <div className="w-28 text-right text-xs font-semibold font-mono text-zinc-900 select-none">
                {row.amountRaw
                  ? Number(row.amountRaw).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : ""}
              </div>
            </div>
          );
        })}

        {/* Filler rows */}
        {Array.from({ length: Math.max(0, 8 - form.stockEntries.length) }).map((_, i) => (
          <div
            key={`sf-${i}`}
            className="flex border-b border-zinc-50 min-h-[26px] px-3"
          />
        ))}
      </div>
    </>
  );
}
