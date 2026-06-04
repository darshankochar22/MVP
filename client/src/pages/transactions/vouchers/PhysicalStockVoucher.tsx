import type { useVoucherForm } from "../hooks/useVoucherForm";

interface Props {
  form: ReturnType<typeof useVoucherForm>;
  focusStockQty: (idx: number) => void;
  focusStockRate: (idx: number) => void;
  proceedToNextStockRow: (idx: number) => void;
}

export default function PhysicalStockVoucher({
  form,
  focusStockQty,
  focusStockRate,
  proceedToNextStockRow,
}: Props) {
  return (
    <>
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

          return (
            <div
              key={row.id}
              className="flex items-center border-b border-zinc-100 min-h-[26px] group px-3 py-1 hover:bg-zinc-50"
            >
              {/* Item Name */}
              <div className="flex-1 min-w-[200px] flex items-center gap-1">
                <input
                  data-stock-item={idx + 1}
                  type="text"
                  className="flex-1 text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
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
                      // Focus Godown field
                      const nextEl = document.querySelector(`[data-stock-godown="${idx + 1}"]`) as HTMLInputElement;
                      if (nextEl) nextEl.focus();
                    }
                  }}
                  autoComplete="off"
                />
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
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const nextEl = document.querySelector(`[data-stock-batch="${idx + 1}"]`) as HTMLInputElement;
                      if (nextEl) nextEl.focus();
                    }
                  }}
                  autoComplete="off"
                />
              </div>

              {/* Batch / Lot */}
              <div className="w-24">
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
                      const nextEl = document.querySelector(`[data-stock-mfg="${idx + 1}"]`) as HTMLInputElement;
                      if (nextEl) nextEl.focus();
                    }
                  }}
                />
              </div>

              {/* Mfg Date */}
              <div className="w-24">
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
                      const nextEl = document.querySelector(`[data-stock-expiry="${idx + 1}"]`) as HTMLInputElement;
                      if (nextEl) nextEl.focus();
                    }
                  }}
                />
              </div>

              {/* Expiry Date */}
              <div className="w-24">
                <input
                  data-stock-expiry={idx + 1}
                  type="text"
                  className="w-full text-xs bg-transparent outline-none px-1 border border-transparent focus:border-zinc-800 font-mono"
                  value={row.expiryDate || ""}
                  placeholder="YYYY-MM-DD"
                  onChange={(e) =>
                    form.handleUpdateStockRow(row.id, { expiryDate: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      focusStockQty(idx);
                    }
                  }}
                />
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
                      focusStockRate(idx);
                    }
                  }}
                />
              </div>

              {/* Rate */}
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
                      proceedToNextStockRow(idx);
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

      {/* Grand total footer */}
      <div className="flex border-t border-zinc-300 shrink-0 px-3 py-1 bg-zinc-50 border-b border-zinc-200">
        <div className="flex-1 text-xs font-bold text-zinc-700">Total Physical Balance</div>
        <div className="w-28 text-right text-xs font-bold font-mono text-zinc-900 pr-0">
          {form.totalAmount > 0
            ? form.totalAmount.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : "0.00"}
        </div>
      </div>
    </>
  );
}
