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
  onAmountConfirm?: (row: ParticularRow, index: number) => void;
  voucherType?: string;
  debitTotal?: number;
  creditTotal?: number;
}


const formatAmount = (n: number): string =>
  n > 0
    ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "";


export default function ParticularsTable({
  rows,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
  onFieldFocus,
  onSearchChange,
  searchTerm,
  activeRowId,
  onAmountConfirm,
  voucherType,
  debitTotal,
  creditTotal,
}: Props) {
  const rowsRef = useRef(rows);
  rowsRef.current = rows;


  const isSingleEntry = ["Receipt", "Payment"].includes(voucherType ?? "");

  const handleAmountChange = (rowId: string, value: string) => {
    onUpdateRow(rowId, { amountRaw: value });
  };

  const handleAmountKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key !== "Enter") return;

    const row = rowsRef.current[idx];
    if (!row?.ledger) return;

    e.preventDefault();

    if (onAmountConfirm) {
      onAmountConfirm(row, idx);
    } else if (Number(row.amountRaw) > 0) {
      if (idx === rowsRef.current.length - 1) {
        onAddRow();
      }
      setTimeout(() => {
        const nextIdx = idx + 1;
        const next = document.querySelector(
          `[data-particular-ledger="${nextIdx + 1}"]`
        ) as HTMLInputElement | null;
        next?.focus();
      }, 50);
    }
  };

  const drTotal =
    debitTotal ??
    rows.reduce((s, r) => s + (r.type === "Dr" ? Number(r.amountRaw) || 0 : 0), 0);
  const crTotal =
    creditTotal ??
    rows.reduce((s, r) => s + (r.type === "Cr" ? Number(r.amountRaw) || 0 : 0), 0);

  const isBalanced = Math.abs(drTotal - crTotal) < 0.01;


  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white text-xs">
      <div className="grid grid-cols-12 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600 font-bold uppercase tracking-wider select-none text-[10px]">
        <div className="col-span-1" />
        <div className="col-span-7">Particulars</div>
        <div className="col-span-2 text-right">Debit</div>
        <div className="col-span-2 text-right">Credit</div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 min-h-0">
        {rows.map((row, idx) => {
          const isActive = activeRowId === row.id;

          return (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center px-3 py-1.5 hover:bg-zinc-50/50 group transition-colors min-h-[42px]"
            >
              <div className="col-span-1 flex items-center justify-center">
                {isSingleEntry ? (
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

              <div className="col-span-2 px-1">
                {row.type === "Dr" ? (
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
                  <span className="block text-right px-1 py-0.5 text-zinc-300 select-none">
                    —
                  </span>
                )}
              </div>

              <div className="col-span-2 px-1">
                {row.type === "Cr" ? (
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
                  <span className="block text-right px-1 py-0.5 text-zinc-300 select-none">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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