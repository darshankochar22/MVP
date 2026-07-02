import { useState, useEffect, useRef } from "react";
import { VoucherPopupShell } from "@/components/tally-ui/VoucherPopupShell";
import type { CostCentreType, CostCategoryType } from "@/types/api";

interface CostCentreAllocation {
  cost_centre_id: number;
  amount: number;
  /**
   * Additive dimension (Tally cost categories). Only set when the company has
   * cost categories — legacy payloads without it keep working unchanged.
   */
  cost_category_id?: number;
}

interface Props {
  companyId: number;
  ledgerName: string;
  totalAmount: number;
  initialAllocations?: CostCentreAllocation[];
  onClose: () => void;
  onSave: (allocations: CostCentreAllocation[]) => void;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function CostCentreAllocationPopup({
  companyId,
  ledgerName,
  totalAmount,
  initialAllocations = [],
  onClose,
  onSave,
}: Props) {
  const [costCentres, setCostCentres] = useState<CostCentreType[]>([]);
  const [costCategories, setCostCategories] = useState<CostCategoryType[]>([]);
  const [allocations, setAllocations] = useState<CostCentreAllocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Percentage column edit buffer — keeps what the user is typing (e.g. "12.")
  // without the derived value fighting the input mid-keystroke.
  const [pctDraft, setPctDraft] = useState<{ index: number; value: string } | null>(null);
  // Hydrate exactly once per mount — previously a parent re-render with a new
  // initialAllocations array reference clobbered in-progress edits.
  const seededRef = useRef(false);

  // Load cost centres + cost categories
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ccRes, catRes] = await Promise.all([
          window.api.costCentre.getAll(companyId),
          window.api.costCategory.getAll(companyId),
        ]);
        if (!active) return;
        if (ccRes.success) setCostCentres(ccRes.costCentres ?? []);
        else setError(ccRes.error || "Failed to load cost centres.");
        // Category load failure is non-fatal — we fall back to flat allocation.
        if (catRes.success) setCostCategories(catRes.costCategories ?? []);
      } catch {
        if (active) setError("Error loading cost centres.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [companyId]);

  // Guard against rows with missing ids instead of asserting `cc_id!`.
  const validCentres = costCentres.filter(
    (cc): cc is CostCentreType & { cc_id: number } => typeof cc.cc_id === "number"
  );
  const validCategories = costCategories.filter(
    (c): c is CostCategoryType & { cc_cat_id: number } =>
      typeof c.cc_cat_id === "number" && c.is_active !== 0
  );
  const hasCategories = validCategories.length > 0;

  const categoryIdForCentre = (centreId: number): number => {
    const centre = validCentres.find((c) => c.cc_id === centreId);
    const catId = centre?.cost_category_id;
    if (typeof catId === "number" && validCategories.some((c) => c.cc_cat_id === catId)) {
      return catId;
    }
    return validCategories[0].cc_cat_id;
  };

  const centresForCategory = (catId: number) => {
    const matched = validCentres.filter((c) => c.cost_category_id === catId);
    return matched.length > 0 ? matched : validCentres;
  };

  // Seed allocations once, after masters have loaded.
  useEffect(() => {
    if (loading || seededRef.current) return;
    seededRef.current = true;
    if (initialAllocations.length > 0) {
      setAllocations(
        initialAllocations.map((a) =>
          hasCategories
            ? {
                ...a,
                cost_category_id:
                  typeof a.cost_category_id === "number" &&
                  validCategories.some((c) => c.cc_cat_id === a.cost_category_id)
                    ? a.cost_category_id
                    : categoryIdForCentre(a.cost_centre_id),
              }
            : { ...a }
        )
      );
    } else if (validCentres.length > 0) {
      const first = validCentres[0];
      setAllocations([
        hasCategories
          ? { cost_centre_id: first.cc_id, amount: totalAmount, cost_category_id: categoryIdForCentre(first.cc_id) }
          : { cost_centre_id: first.cc_id, amount: totalAmount },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const allocated = allocations.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const remaining = totalAmount - allocated;

  const scopeRowsOf = (catId?: number) =>
    catId != null ? allocations.filter((a) => a.cost_category_id === catId) : allocations;

  const handleAdd = (catId?: number) => {
    if (!validCentres.length) { setError("No valid cost centres available."); return; }
    const options = catId != null ? centresForCategory(catId) : validCentres;
    const scopeRows = scopeRowsOf(catId);
    const scopeAllocated = scopeRows.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const rem = round2(totalAmount - scopeAllocated);
    if (scopeRows.length > 0 && Math.abs(rem) < 0.01) { setError("Amount fully allocated."); return; }
    setError(null);
    setAllocations((prev) => [
      ...prev,
      {
        cost_centre_id: options[0].cc_id,
        amount: scopeRows.length > 0 ? rem : totalAmount,
        ...(catId != null ? { cost_category_id: catId } : {}),
      },
    ]);
  };

  const handleRemove = (i: number) => {
    if (allocations.length === 1) { setError("At least one entry is required."); return; }
    setError(null);
    setPctDraft(null);
    setAllocations((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleChange = (i: number, field: keyof CostCentreAllocation, value: number) => {
    setError(null);
    setAllocations((prev) =>
      prev.map((row, idx) => (idx === i ? { ...row, [field]: value } : row))
    );
  };

  // % convenience column: typing a % sets the row amount to that share of the
  // total. Only amounts are stored/saved.
  const handlePctChange = (i: number, raw: string) => {
    setPctDraft({ index: i, value: raw });
    const pct = parseFloat(raw);
    if (Number.isFinite(pct)) {
      handleChange(i, "amount", round2((pct / 100) * totalAmount));
    } else if (raw.trim() === "") {
      handleChange(i, "amount", 0);
    }
  };

  const pctValueFor = (i: number, amount: number) => {
    if (pctDraft?.index === i) return pctDraft.value;
    if (!totalAmount || !amount) return "";
    return String(round2((Number(amount) / totalAmount) * 100));
  };

  const handleSave = () => {
    if (!validCentres.length) {
      setError("No valid cost centres available. Create one under Master Creation first.");
      return;
    }
    if (allocations.length === 0) {
      setError("Add at least one allocation.");
      return;
    }
    if (allocations.some((a) => !a.cost_centre_id || !validCentres.some((c) => c.cc_id === a.cost_centre_id))) {
      setError("Select a valid cost centre for all entries.");
      return;
    }
    // Merge duplicate centre rows (Tally behaviour): sum their amounts instead
    // of rejecting the save.
    const merged: CostCentreAllocation[] = [];
    for (const a of allocations) {
      const dup = merged.find(
        (m) => m.cost_centre_id === a.cost_centre_id && m.cost_category_id === a.cost_category_id
      );
      if (dup) dup.amount = round2(dup.amount + (Number(a.amount) || 0));
      else merged.push({ ...a, amount: round2(Number(a.amount) || 0) });
    }
    if (hasCategories) {
      // Tally-style: every category that has rows must allocate the full amount.
      for (const cat of validCategories) {
        const rows = merged.filter((m) => m.cost_category_id === cat.cc_cat_id);
        if (rows.length === 0) continue;
        const sum = rows.reduce((s, r) => s + r.amount, 0);
        const rem = round2(totalAmount - sum);
        if (Math.abs(rem) >= 0.01) {
          setError(`Category "${cat.name}": remaining ₹${rem.toFixed(2)} must be zero.`);
          return;
        }
      }
    } else if (Math.abs(round2(totalAmount - merged.reduce((s, r) => s + r.amount, 0))) >= 0.01) {
      setError(`Remaining ₹${remaining.toFixed(2)} must be zero.`);
      return;
    }
    onSave(merged);
  };

  const renderRow = (
    row: CostCentreAllocation,
    idx: number,
    options: (CostCentreType & { cc_id: number })[]
  ) => (
    <div key={idx} className="grid grid-cols-12 items-center px-3 py-2 bg-white gap-2">
      <div className="col-span-6">
        <select value={row.cost_centre_id}
          onChange={(e) => handleChange(idx, "cost_centre_id", Number(e.target.value))}
          className="text-sm px-2 py-1 border border-gray-400 outline-none focus:border-black bg-white w-full">
          {!options.some((cc) => cc.cc_id === row.cost_centre_id) && (
            <option value={row.cost_centre_id} disabled>— unknown cost centre —</option>
          )}
          {options.map((cc) => (
            <option key={cc.cc_id} value={cc.cc_id}>{cc.name}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <input type="number" step="0.01" value={pctValueFor(idx, row.amount)}
          onChange={(e) => handlePctChange(idx, e.target.value)}
          onBlur={() => setPctDraft(null)}
          placeholder="%"
          className="text-sm px-2 py-1 border border-gray-400 outline-none focus:border-black bg-white text-right w-full font-mono" />
      </div>
      <div className="col-span-3">
        <input type="number" step="0.01" value={row.amount || ""}
          onChange={(e) => handleChange(idx, "amount", Number(e.target.value) || 0)}
          className="text-sm px-2 py-1 border border-gray-400 outline-none focus:border-black bg-white text-right w-full font-mono" />
      </div>
      <div className="col-span-1 text-center">
        <button onClick={() => handleRemove(idx)}
          className="text-gray-500 hover:text-black text-sm font-bold">&times;</button>
      </div>
    </div>
  );

  const tableHeader = (
    <div className="grid grid-cols-12 border-b border-gray-400 px-3 py-2 text-sm font-bold text-black bg-white">
      <div className="col-span-6">Cost Centre</div>
      <div className="col-span-2 text-right">%</div>
      <div className="col-span-3 text-right">Amount</div>
      <div className="col-span-1" />
    </div>
  );

  return (
    <VoucherPopupShell
      title="Cost Centre Allocations"
      headerRight={<span>Ledger: <span className="font-bold text-black">{ledgerName}</span></span>}
      onClose={onClose}
      onAccept={handleSave}
      hint={!loading && validCentres.length === 0 ? "No valid cost centres — cannot allocate" : undefined}
    >
      <div className="max-w-2xl">
        {/* Summary bar */}
        <div className="flex justify-between items-center text-sm text-black border-b border-black pb-2 mb-4">
          <div>
            Total:{" "}
            <span className="font-mono font-bold">₹{fmt(totalAmount)}</span>
          </div>
          {hasCategories ? (
            <span className="text-gray-600">Each cost category allocates the full amount</span>
          ) : (
            <div className="flex gap-6">
              <span>
                Allocated: <span className="font-mono">₹{fmt(allocated)}</span>
              </span>
              <span>
                Remaining:{" "}
                <span className={`font-mono ${Math.abs(remaining) < 0.01 ? "" : "font-bold"}`}>
                  ₹{fmt(remaining)}
                </span>
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="border border-black text-black text-sm font-bold px-3 py-2 mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold px-1">&times;</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-6 text-gray-500 text-sm italic">Loading cost centres…</div>
        ) : validCentres.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-sm border border-gray-300">
            No valid cost centres found. Create one under Master Creation first.
            Allocation cannot be accepted until a cost centre exists.
          </div>
        ) : hasCategories ? (
          <div className="space-y-6">
            {validCategories.map((cat) => {
              const rows = allocations
                .map((a, idx) => ({ a, idx }))
                .filter(({ a }) => a.cost_category_id === cat.cc_cat_id);
              const catAllocated = rows.reduce((s, { a }) => s + (Number(a.amount) || 0), 0);
              const catRemaining = round2(totalAmount - catAllocated);
              return (
                <div key={cat.cc_cat_id}>
                  <div className="flex justify-between items-center pb-1 border-b border-black mb-2">
                    <span className="text-sm font-bold text-black">{cat.name}</span>
                    {rows.length > 0 && (
                      <span className="text-sm text-black">
                        Allocated: <span className="font-mono">₹{fmt(catAllocated)}</span>
                        {"  ·  "}Remaining:{" "}
                        <span className={`font-mono ${Math.abs(catRemaining) < 0.01 ? "" : "font-bold"}`}>
                          ₹{fmt(catRemaining)}
                        </span>
                      </span>
                    )}
                  </div>
                  {rows.length > 0 && (
                    <div className="border border-gray-300">
                      {tableHeader}
                      <div className="divide-y divide-gray-200">
                        {rows.map(({ a, idx }) => renderRow(a, idx, centresForCategory(cat.cc_cat_id)))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => handleAdd(cat.cc_cat_id)}
                    className="mt-2 text-sm font-bold text-black border border-black px-3 py-1 bg-white hover:bg-gray-100 select-none">
                    + Add Cost Centre Split
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="border border-gray-300">
              {tableHeader}
              <div className="divide-y divide-gray-200">
                {allocations.map((row, i) => renderRow(row, i, validCentres))}
              </div>
            </div>
            <button onClick={() => handleAdd()}
              className="mt-4 text-sm font-bold text-black border border-black px-3 py-1 bg-white hover:bg-gray-100 select-none">
              + Add Cost Centre Split
            </button>
          </>
        )}
      </div>
    </VoucherPopupShell>
  );
}
