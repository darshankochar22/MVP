import { useState, useEffect, useCallback, useRef } from "react";
import type { BatchAllocation } from "../../types";

// Stock Item Allocations sub-screen (TallyPrime "Batch / Lot" allocation).
// Splits a line quantity across one or more godown + batch rows, each with
// optional mfg + expiry dates, actual/billed quantities, rate and discount.
// Strict grayscale per UI.md — no hue, emphasis via weight/border only.

interface ActiveBatch {
  name: string;
  mfg_date: string | null;
  expiry_date: string | null;
  balance: number;
}

interface GodownOption {
  godown_id?: number;
  name: string;
}

interface Props {
  companyId: number;
  itemId: number;
  itemName: string;
  totalQuantity: number;
  rate: number;
  unitSymbol?: string;
  voucherDate: string;        // ISO yyyy-mm-dd
  trackMfg: boolean;
  trackExpiry: boolean;
  isInward: boolean;
  godowns?: GodownOption[];
  initialAllocations?: BatchAllocation[];
  /** When true, totalQuantity is not a fixed target — the line quantity is the
   *  sum of the batch rows entered here (popup opened on item selection). */
  quantityDriven?: boolean;
  /** Show the Batch / Lot No. (+ Mfg/Expiry) column. False = godown-only
   *  allocation for items that don't maintain batches. */
  showBatch?: boolean;
  onClose: () => void;
  onSave: (allocations: BatchAllocation[]) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getDate()}-${MONTHS[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Accept a real date OR a period like "2 years" / "2 Months" / "2 Days" and
// resolve it to an ISO date relative to `baseIso` (img 15-18).
function parseExpiry(input: string, baseIso: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";
  const direct = new Date(raw);
  if (!isNaN(direct.getTime()) && /\d{4}|[A-Za-z]{3}/.test(raw) && !/year|month|day|yr|mo|wk|week/i.test(raw)) {
    return toIso(direct);
  }
  const m = raw.match(/^(\d+)\s*(year|years|yr|month|months|mo|week|weeks|wk|day|days)$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    const unit = m[2].toLowerCase();
    const base = new Date(baseIso);
    if (isNaN(base.getTime())) return "";
    if (unit.startsWith("year") || unit === "yr") base.setFullYear(base.getFullYear() + n);
    else if (unit.startsWith("mo")) base.setMonth(base.getMonth() + n);
    else if (unit.startsWith("week") || unit === "wk") base.setDate(base.getDate() + n * 7);
    else base.setDate(base.getDate() + n);
    return toIso(base);
  }
  return ""; // unrecognised — leave blank, user can retype
}

const num = (v: number | undefined) =>
  v ? v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

export default function BatchAllocationPopup({
  companyId, itemId, itemName, totalQuantity, rate, unitSymbol,
  voucherDate, trackMfg, trackExpiry, isInward, godowns = [], initialAllocations = [],
  quantityDriven = false, showBatch = true,
  onClose, onSave,
}: Props) {
  const defaultGodown = godowns[0]?.name ?? "";

  const emptyRow = (): BatchAllocation => ({
    batch_number: "",
    godown: defaultGodown,
    quantity: quantityDriven ? 0 : totalQuantity,
    actual_quantity: quantityDriven ? 0 : totalQuantity,
    rate,
    disc_percent: 0,
  });

  const [rows, setRows] = useState<BatchAllocation[]>(
    initialAllocations.length ? initialAllocations.map((a) => ({ ...a })) : [emptyRow()]
  );
  const [activeBatches, setActiveBatches] = useState<ActiveBatch[]>([]);
  const [openListRow, setOpenListRow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const listRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load existing batches (with balances) for the "List of Active Batches".
  useEffect(() => {
    if (!companyId || !itemId) return;
    (window as any).api.report.batchBalances(companyId, itemId).then((res: any) => {
      if (res?.success) setActiveBatches(res.batches ?? []);
    }).catch(() => {});
  }, [companyId, itemId]);

  // Close the active-batches dropdown on outside click.
  useEffect(() => {
    if (openListRow === null) return;
    const onDown = (e: MouseEvent) => {
      const el = listRefs.current[openListRow];
      if (el && !el.contains(e.target as Node)) setOpenListRow(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [openListRow]);

  const billed = (r: BatchAllocation) => Number(r.quantity) || 0;
  const actual = (r: BatchAllocation) => Number(r.actual_quantity ?? r.quantity) || 0;
  const lineAmount = (r: BatchAllocation) =>
    billed(r) * (Number(r.rate) || 0) * (1 - (Number(r.disc_percent) || 0) / 100);

  const totalActual = rows.reduce((s, r) => s + actual(r), 0);
  const totalBilled = rows.reduce((s, r) => s + billed(r), 0);
  const totalAmount = rows.reduce((s, r) => s + lineAmount(r), 0);
  const remaining = totalQuantity - totalBilled;

  const update = (i: number, patch: Partial<BatchAllocation>) => {
    setError(null);
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  // Actual drives Billed until the user overrides Billed independently.
  const setActual = (i: number, v: number) => {
    setError(null);
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== i) return r;
        const linked = (Number(r.quantity) || 0) === (Number(r.actual_quantity) || 0);
        return { ...r, actual_quantity: v, quantity: linked ? v : r.quantity };
      })
    );
  };

  const pickExisting = (i: number, b: ActiveBatch) => {
    update(i, { batch_number: b.name, mfg_date: b.mfg_date ?? undefined, expiry_date: b.expiry_date ?? undefined });
    setOpenListRow(null);
  };

  const addRow = () => {
    setError(null);
    setRows((prev) => [...prev, emptyRow()]);
  };

  const removeRow = (i: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSave = useCallback(() => {
    if (showBatch && rows.some((r) => !r.batch_number.trim())) {
      setError("Every row needs a Batch / Lot No.");
      return;
    }
    if (quantityDriven) {
      if (totalBilled <= 0) {
        setError("Enter a quantity for at least one batch.");
        return;
      }
    } else if (Math.abs(remaining) >= 0.0001) {
      setError(`Allocated ${totalBilled} of ${totalQuantity} ${unitSymbol ?? ""} — remaining ${remaining} must be zero.`);
      return;
    }
    onSave(rows.map((r) => ({
      batch_number: r.batch_number.trim(),
      godown: r.godown || undefined,
      mfg_date: trackMfg ? (r.mfg_date || undefined) : undefined,
      expiry_date: trackExpiry ? (r.expiry_date || undefined) : undefined,
      quantity: Number(r.quantity) || 0,
      actual_quantity: Number(r.actual_quantity ?? r.quantity) || 0,
      rate: Number(r.rate) || rate,
      disc_percent: Number(r.disc_percent) || 0,
    })));
  }, [rows, remaining, totalBilled, totalQuantity, unitSymbol, trackMfg, trackExpiry, rate, quantityDriven, showBatch, onSave]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.altKey && (e.key === "a" || e.key === "A")) { e.preventDefault(); handleSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handleSave]);

  // Shared column widths — header rows, data rows and totals must match.
  const cell = "shrink-0";
  const W = {
    godown: "w-28",
    batch: "w-52",
    qty: "w-32",
    rate: "w-20",
    per: "w-10",
    disc: "w-14",
    amount: "w-24",
    del: "w-5",
  };
  const inputCls = "text-xs px-1.5 py-1 border border-zinc-300 w-full outline-none focus:border-zinc-800";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/40 pt-16 select-none">
      <div className={`bg-white border border-zinc-400 shadow-2xl ${showBatch ? "w-[900px]" : "w-[660px]"} flex flex-col max-h-[82vh]`}>
        {/* Title bar */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider">Stock Item Allocations</span>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm">&times;</button>
        </div>

        <div className="px-4 py-2 border-b border-zinc-200 text-center">
          <div className="text-sm font-semibold">
            Item Allocations for : <span className="font-bold">{itemName}</span>
          </div>
          <div className="text-[11px] text-zinc-600 mt-0.5">
            {isInward ? "Inward" : "Outward"} ·{" "}
            {quantityDriven ? "Enter batch quantities" : `Up to ${totalQuantity} ${unitSymbol ?? ""} @ ${rate}`}
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-3">
          {error && (
            <div className="border border-zinc-400 text-zinc-900 text-xs px-3 py-2 flex justify-between items-center font-semibold">
              <span>• {error}</span>
              <button onClick={() => setError(null)} className="font-bold">&times;</button>
            </div>
          )}

          <div className="border border-zinc-300">
            {/* Header row 1 — column groups */}
            <div className="flex bg-zinc-100 px-3 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600 gap-2">
              <div className={`${cell} ${W.godown}`}>Godown</div>
              {showBatch && <div className={`${cell} ${W.batch} text-center`}>Batch / Lot No.</div>}
              <div className={`${cell} ${W.qty} text-center`}>Quantity</div>
              <div className={`${cell} ${W.rate} text-right`}>Rate</div>
              <div className={`${cell} ${W.per} text-center`}>per</div>
              <div className={`${cell} ${W.disc} text-right`}>Disc %</div>
              <div className={`${cell} ${W.amount} text-right`}>Amount</div>
              <div className={`${cell} ${W.del}`} />
            </div>
            {/* Header row 2 — sub-columns */}
            <div className="flex bg-zinc-100 border-b border-zinc-300 px-3 pb-1.5 text-[9px] font-bold uppercase tracking-wide text-zinc-500 gap-2">
              <div className={`${cell} ${W.godown}`} />
              {showBatch && (
                <div className={`${cell} ${W.batch} flex gap-1`}>
                  <div className="flex-1">{trackMfg ? "Mfg Dt." : ""}</div>
                  <div className="flex-1">{trackExpiry ? "Expiry Date" : ""}</div>
                </div>
              )}
              <div className={`${cell} ${W.qty} flex gap-1`}>
                <div className="flex-1 text-right">Actual</div>
                <div className="flex-1 text-right">Billed</div>
              </div>
              <div className={`${cell} ${W.rate}`} />
              <div className={`${cell} ${W.per}`} />
              <div className={`${cell} ${W.disc}`} />
              <div className={`${cell} ${W.amount}`} />
              <div className={`${cell} ${W.del}`} />
            </div>

            {/* Data rows */}
            <div className="divide-y divide-zinc-100">
              {rows.map((row, i) => {
                const baseIso = (trackMfg && row.mfg_date) ? row.mfg_date : voucherDate;
                return (
                  <div key={i} className="flex items-start px-3 py-2 gap-2">
                    {/* Godown */}
                    <div className={`${cell} ${W.godown}`}>
                      {godowns.length > 0 ? (
                        <select
                          value={row.godown ?? ""}
                          onChange={(e) => update(i, { godown: e.target.value })}
                          className={`${inputCls} bg-white`}
                        >
                          <option value="" />
                          {godowns.map((g) => (
                            <option key={g.godown_id ?? g.name} value={g.name}>{g.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={row.godown ?? ""}
                          onChange={(e) => update(i, { godown: e.target.value })}
                          placeholder="Location"
                          className={inputCls}
                        />
                      )}
                    </div>

                    {/* Batch / Lot No. + Mfg Dt. / Expiry Date (stacked) */}
                    {showBatch && (
                    <div className={`${cell} ${W.batch} relative`} ref={(el) => { listRefs.current[i] = el; }}>
                      <input
                        type="text"
                        value={row.batch_number}
                        onChange={(e) => update(i, { batch_number: e.target.value })}
                        onFocus={() => setOpenListRow(i)}
                        placeholder="New Number…"
                        className={`${inputCls} font-semibold`}
                      />
                      {(trackMfg || trackExpiry) && (
                        <div className="flex gap-1 mt-1">
                          <div className="flex-1">
                            {trackMfg && (
                              <input
                                type="date"
                                value={row.mfg_date ?? ""}
                                onChange={(e) => update(i, { mfg_date: e.target.value })}
                                className={`${inputCls} font-mono`}
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            {trackExpiry && (
                              <input
                                type="text"
                                defaultValue={row.expiry_date ? fmtDate(row.expiry_date) : ""}
                                onBlur={(e) => {
                                  const iso = parseExpiry(e.target.value, baseIso);
                                  update(i, { expiry_date: iso || undefined });
                                  e.target.value = iso ? fmtDate(iso) : e.target.value;
                                }}
                                placeholder="date / 2 years"
                                className={`${inputCls} font-mono`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                      {openListRow === i && activeBatches.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-400 shadow-xl z-30 max-h-44 overflow-y-auto">
                          <div className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 sticky top-0">List of Active Batches</div>
                          <div className="flex bg-zinc-100 text-[9px] font-bold text-zinc-600 px-2 py-1 border-b border-zinc-200">
                            <div className="flex-1">Name</div>
                            <div className="w-20">Expiry</div>
                            <div className="w-16 text-right">Balance</div>
                          </div>
                          {activeBatches.map((b) => (
                            <button
                              key={b.name}
                              type="button"
                              onClick={() => pickExisting(i, b)}
                              className="flex w-full text-left text-[11px] px-2 py-1 hover:bg-zinc-100 border-b border-zinc-50 last:border-0"
                            >
                              <div className="flex-1 font-semibold">{b.name}</div>
                              <div className="w-20 font-mono">{fmtDate(b.expiry_date)}</div>
                              <div className="w-16 text-right font-mono">{b.balance}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    )}

                    {/* Quantity — Actual / Billed */}
                    <div className={`${cell} ${W.qty} flex gap-1`}>
                      <input
                        type="number"
                        step="any"
                        value={row.actual_quantity || ""}
                        onChange={(e) => setActual(i, Number(e.target.value) || 0)}
                        className={`${inputCls} text-right font-mono`}
                      />
                      <input
                        type="number"
                        step="any"
                        value={row.quantity || ""}
                        onChange={(e) => update(i, { quantity: Number(e.target.value) || 0 })}
                        className={`${inputCls} text-right font-mono`}
                      />
                    </div>

                    {/* Rate */}
                    <div className={`${cell} ${W.rate}`}>
                      <input
                        type="number"
                        step="any"
                        value={row.rate || ""}
                        onChange={(e) => update(i, { rate: Number(e.target.value) || 0 })}
                        className={`${inputCls} text-right font-mono`}
                      />
                    </div>

                    {/* per (unit) */}
                    <div className={`${cell} ${W.per} text-center text-[11px] text-zinc-600 pt-1.5 font-mono`}>
                      {unitSymbol ?? ""}
                    </div>

                    {/* Disc % */}
                    <div className={`${cell} ${W.disc}`}>
                      <input
                        type="number"
                        step="any"
                        value={row.disc_percent || ""}
                        onChange={(e) => update(i, { disc_percent: Number(e.target.value) || 0 })}
                        className={`${inputCls} text-right font-mono`}
                      />
                    </div>

                    {/* Amount */}
                    <div className={`${cell} ${W.amount} text-right text-xs font-mono font-semibold pt-1.5`}>
                      {num(lineAmount(row))}
                    </div>

                    {/* Remove */}
                    <div className={`${cell} ${W.del} text-center pt-1`}>
                      <button type="button" onClick={() => removeRow(i)} className="text-zinc-400 hover:text-zinc-900 text-sm font-bold">&times;</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals row */}
            <div className="flex items-center px-3 py-2 bg-zinc-100 border-t-2 border-zinc-300 gap-2 font-bold text-xs font-mono">
              <div className={`${cell} ${W.godown}`} />
              {showBatch && <div className={`${cell} ${W.batch}`} />}
              <div className={`${cell} ${W.qty} flex gap-1`}>
                <div className="flex-1 text-right">{totalActual || ""}</div>
                <div className="flex-1 text-right">{totalBilled || ""}</div>
              </div>
              <div className={`${cell} ${W.rate}`} />
              <div className={`${cell} ${W.per}`} />
              <div className={`${cell} ${W.disc}`} />
              <div className={`${cell} ${W.amount} text-right`}>{num(totalAmount)}</div>
              <div className={`${cell} ${W.del}`} />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button onClick={addRow}
              className="text-[10px] uppercase tracking-wide font-bold text-zinc-600 hover:text-zinc-900 border border-zinc-300 px-2.5 py-1 hover:bg-zinc-50">
              + Add Batch
            </button>
            {quantityDriven ? (
              <span className="text-xs font-mono font-semibold text-zinc-900">
                Total: {totalBilled} {unitSymbol ?? ""}
              </span>
            ) : (
              <span className={`text-xs font-mono font-semibold ${Math.abs(remaining) < 0.0001 ? "text-zinc-500" : "text-zinc-900"}`}>
                Remaining: {remaining} {unitSymbol ?? ""}
              </span>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center">
          <span className="text-[10px] text-zinc-500">Alt+A: Accept · Esc: Close</span>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="text-xs px-3 py-1.5 border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 font-semibold">Cancel</button>
            <button onClick={handleSave}
              className="text-xs px-5 py-1.5 bg-zinc-900 text-white hover:bg-zinc-700 font-semibold">Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
