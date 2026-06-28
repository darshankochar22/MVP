import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { PageTitleBar, RightActionPanel } from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StockGroup {
  sg_id: number;
  name: string;
}

interface StockItem {
  item_id: number;
  name: string;
  opening_rate?: number;
  unit_id?: number | null;
}

interface UnitRow {
  unit_id: number;
  symbol: string;
}

interface PriceListLine {
  particulars: string;
  item_id: number | null;
  qty_from: string;
  qty_less_than: string;
  rate: string;
  disc_percent: string;
}

const emptyLine = (): PriceListLine => ({
  particulars: "",
  item_id: null,
  qty_from: "",
  qty_less_than: "",
  rate: "",
  disc_percent: "",
});

const cellCls =
  "bg-transparent outline-none text-[11px] font-mono text-zinc-900 w-full px-1 py-0.5 border border-transparent focus:border-zinc-400 rounded";

// ─── Component ────────────────────────────────────────────────────────────────

export default function PriceListSGCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;

  // ── Masters
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [priceLevels, setPriceLevels] = useState<string[]>([]);
  const [existingLists, setExistingLists] = useState<any[]>([]);

  // ── Header fields
  const [selectedGroup, setSelectedGroup] = useState<string>("All Items");
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [applicableFrom, setApplicableFrom] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const asOnDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ── Table lines
  const [lines, setLines] = useState<PriceListLine[]>([emptyLine()]);

  // ── UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Dropdown popups
  const [showGroupList, setShowGroupList] = useState(false);
  const [showLevelList, setShowLevelList] = useState(false);
  const [activeItemDropdown, setActiveItemDropdown] = useState<number | null>(null);

  const particularRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyFromRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const qtyUpToRefs    = useRef<(HTMLInputElement | null)[]>([]);
  const rateRefs       = useRef<(HTMLInputElement | null)[]>([]);
  const discRefs       = useRef<(HTMLInputElement | null)[]>([]);

  // ── Load masters
  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      try {
        if (window.api?.stockGroup) {
          const sg = await window.api.stockGroup.getAll(companyId);
          if (sg?.success) setStockGroups(sg.stockGroups ?? []);
        }
        if (window.api?.stockItem) {
          const si = await window.api.stockItem.getAll(companyId);
          if (si?.success) setStockItems((si.stockItems ?? []) as StockItem[]);
        }
        if (window.api?.unit) {
          const u = await window.api.unit.getAll(companyId);
          if (u?.success) setUnits((u.units ?? []) as UnitRow[]);
        }
        if (window.api?.priceList) {
          const pls = await window.api.priceList.getAll(companyId);
          if (pls?.success) setExistingLists((pls as any).data ?? []);
        }
        if (window.api?.priceLevels) {
          const pl = await window.api.priceLevels.get(companyId);
          if (pl?.success && pl?.data) {
            const named = (pl.data as string[]).filter((n) => n.trim() !== "");
            setPriceLevels(named);
            if (named.length > 0) setSelectedLevel(named[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load masters:", err);
      }
    };
    load();
  }, [companyId]);

  // ── Lookups
  const unitSymbolFor = useCallback(
    (item_id: number | null): string => {
      if (!item_id) return "";
      const item = stockItems.find((it) => it.item_id === item_id);
      if (!item?.unit_id) return "";
      return units.find((u) => u.unit_id === item.unit_id)?.symbol ?? "";
    },
    [stockItems, units]
  );

  const costPriceFor = useCallback(
    (item_id: number | null): number | null => {
      if (!item_id) return null;
      const item = stockItems.find((it) => it.item_id === item_id);
      return item?.opening_rate ?? null;
    },
    [stockItems]
  );

  // "As on" = most recent saved price-list line for this item & selected level,
  // with applicable_from <= asOnDate.
  const asOnFor = useCallback(
    (item_id: number | null): { rate: number; disc: number } | null => {
      if (!item_id || !selectedLevel) return null;
      const candidates = existingLists
        .filter(
          (pl) =>
            pl.price_level === selectedLevel &&
            (pl.applicable_from ?? "") <= asOnDate
        )
        .sort((a, b) =>
          (b.applicable_from ?? "").localeCompare(a.applicable_from ?? "")
        );
      for (const pl of candidates) {
        const line = (pl.lines ?? []).find((l: any) => l.item_id === item_id);
        if (line) return { rate: line.rate ?? 0, disc: line.disc_percent ?? 0 };
      }
      return null;
    },
    [existingLists, selectedLevel, asOnDate]
  );

  // ── Line helpers
  const setLineField = (
    index: number,
    field: keyof PriceListLine,
    value: string | number | null
  ) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (index === next.length - 1 && field === "particulars" && String(value).trim() !== "") {
        next.push(emptyLine());
      }
      return next;
    });
  };

  const removeLine = (index: number) => {
    setLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) return [emptyLine()];
      return next;
    });
    setTimeout(() => particularRefs.current[Math.max(0, index - 1)]?.focus(), 0);
  };

  const pickItem = (index: number, item: StockItem) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], particulars: item.name, item_id: item.item_id };
      if (index === next.length - 1) next.push(emptyLine());
      return next;
    });
    setActiveItemDropdown(null);
    setTimeout(() => qtyFromRefs.current[index]?.focus(), 0);
  };

  // ── Submit
  const handleSubmit = useCallback(async () => {
    if (!companyId)      { setError("No company selected."); return; }
    if (!selectedLevel)  { setError("Select a price level."); return; }
    if (!applicableFrom) { setError("Enter applicable from date."); return; }

    const filledLines = lines.filter((l) => l.particulars.trim() !== "");
    if (filledLines.length === 0) { setError("Add at least one item."); return; }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (window.api?.priceList) {
        const result = await window.api.priceList.create({
          company_id:      companyId,
          stock_group:     selectedGroup,
          price_level:     selectedLevel,
          applicable_from: applicableFrom,
          lines: filledLines.map((l) => ({
            item_id:       l.item_id,
            particulars:   l.particulars.trim(),
            qty_from:      parseFloat(l.qty_from)      || 0,
            qty_less_than: parseFloat(l.qty_less_than) || 0,
            rate:          parseFloat(l.rate)           || 0,
            disc_percent:  parseFloat(l.disc_percent)  || 0,
          })),
        });
        if (!result.success) throw new Error(result.error || "Save failed.");
      }
      setSuccess("Price list saved successfully.");
      setTimeout(() => {
        setSuccess(null);
        navigate("/master/create");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save price list.");
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedGroup, selectedLevel, applicableFrom, lines, navigate]);

  // ── Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showGroupList || showLevelList || activeItemDropdown !== null) {
          setShowGroupList(false);
          setShowLevelList(false);
          setActiveItemDropdown(null);
          return;
        }
        e.preventDefault();
        navigate("/master/create");
      }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, navigate, showGroupList, showLevelList, activeItemDropdown]);

  // ── Row keyboard nav
  const handleParticularKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (lines[i].particulars.trim() !== "") {
        setActiveItemDropdown(null);
        qtyFromRefs.current[i]?.focus();
      }
    }
    if (e.key === "Backspace" && lines[i].particulars === "" && lines.length > 1) {
      e.preventDefault();
      removeLine(i);
    }
  };

  const handleCellKeyDown = (
    e: React.KeyboardEvent,
    rowIndex: number,
    nextRef: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      nextRef.current[rowIndex]?.focus();
    }
  };

  const handleDiscKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const next = particularRefs.current[rowIndex + 1];
      if (next) next.focus();
    }
  };

  const formatDateDisplay = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }).replace(/ /g, "-");
  };

  const fmtRate = (n: number, sym: string) =>
    `${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${sym ? "/" + sym : ""}`;

  const actions = [
    { key: "Alt+A", label: "Accept", onClick: handleSubmit },
    { key: "Esc",   label: "Quit",   onClick: () => navigate("/master/create") },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-950">
      <PageTitleBar title="Price List" subtitle={selectedCompany?.name} />

      {error && (
        <div className="px-4 py-2 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between items-center shrink-0 font-sans">
          <span>• {error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
        </div>
      )}
      {success && (
        <div className="px-4 py-2 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between items-center shrink-0 font-sans">
          <span>• {success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700 font-bold">&times;</button>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Inline header: Under Group / Price Level / Applicable From ── */}
          <div className="border-b border-zinc-200 px-6 py-3 shrink-0 font-mono text-[11px] space-y-2">
            {/* Under Group */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 w-28">Under Group</span>
              <span className="text-zinc-300">:</span>
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-0.5 border border-transparent hover:border-zinc-300 rounded font-bold text-zinc-900"
                  onClick={() => { setShowGroupList((p) => !p); setShowLevelList(false); }}
                >
                  <span className="text-zinc-400">◆</span>
                  {selectedGroup}
                </button>
                {showGroupList && (
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-zinc-300 rounded shadow-lg w-64 max-h-56 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 flex justify-between bg-zinc-50">
                      <span>List of Stock Groups</span>
                      <button onClick={() => navigate("/master/create/stock-group")} className="text-zinc-700 hover:underline font-bold">Create</button>
                    </div>
                    {[{ sg_id: 0, name: "All Items" }, ...stockGroups].map((sg) => (
                      <div
                        key={sg.sg_id}
                        className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-50 ${selectedGroup === sg.name ? "bg-zinc-100 font-bold text-black" : "text-zinc-700"}`}
                        onClick={() => { setSelectedGroup(sg.name); setShowGroupList(false); }}
                      >
                        {sg.name === "All Items" && <span className="text-zinc-400 mr-1">◆</span>}
                        {sg.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Price Level + Applicable From */}
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 w-28">Price Level</span>
                <span className="text-zinc-300">:</span>
                <div className="relative">
                  <button
                    type="button"
                    className="px-2 py-0.5 border border-transparent hover:border-zinc-300 rounded font-bold text-zinc-900"
                    onClick={() => { setShowLevelList((p) => !p); setShowGroupList(false); }}
                  >
                    {selectedLevel || "Select…"}
                  </button>
                  {showLevelList && (
                    <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-zinc-300 rounded shadow-lg w-56 max-h-48 overflow-y-auto">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 bg-zinc-50">
                        Price Levels
                      </div>
                      {priceLevels.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-zinc-400 font-sans">
                          No price levels found.{" "}
                          <button onClick={() => navigate("/master/create/price-levels")} className="text-zinc-700 hover:underline font-bold">Create one</button>
                        </div>
                      ) : (
                        priceLevels.map((pl, i) => (
                          <div
                            key={i}
                            className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-50 ${selectedLevel === pl ? "bg-zinc-100 font-bold text-black" : "text-zinc-700"}`}
                            onClick={() => { setSelectedLevel(pl); setShowLevelList(false); }}
                          >
                            {pl}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Applicable From</span>
                <span className="text-zinc-300">:</span>
                <input
                  type="date"
                  value={applicableFrom}
                  onChange={(e) => setApplicableFrom(e.target.value)}
                  className="border border-zinc-300 rounded px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-900 bg-white focus:outline-none focus:border-zinc-500"
                />
                {applicableFrom && (
                  <span className="text-zinc-400">{formatDateDisplay(applicableFrom)}</span>
                )}
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <table className="w-full text-[11px] font-mono border-collapse">
              <thead className="sticky top-0 z-10">
                {/* Group header row */}
                <tr className="bg-zinc-100 border-b border-zinc-200">
                  <th className="px-3 py-1.5 w-12" rowSpan={2} />
                  <th className="px-3 py-1.5 w-64" rowSpan={2} />
                  <th className="px-2 py-1.5 w-48 border-l border-zinc-200" colSpan={2} rowSpan={2}>
                    <span className="text-zinc-600 font-bold">Quantities</span>
                  </th>
                  <th className="px-3 py-1.5 w-28 border-l border-zinc-200" rowSpan={2} />
                  <th className="px-3 py-1.5 w-28 border-l border-zinc-200" rowSpan={2} />
                  <th className="px-3 py-1.5 border-l border-zinc-300 text-center text-zinc-600 font-bold" colSpan={3}>
                    As on : {formatDateDisplay(asOnDate)}
                  </th>
                  <th className="w-6" rowSpan={2} />
                </tr>
                {/* Sub-column header row */}
                <tr className="bg-zinc-100 border-b border-zinc-300 text-[10px]">
                  <th className="text-right px-3 py-1 font-bold text-zinc-600 border-l border-zinc-300 w-24">Rate</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-600 w-20">Disc. %</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-600 w-28">Cost Price</th>
                </tr>
                {/* Leaf labels for left columns rendered as a third row band */}
                <tr className="bg-zinc-50 border-b border-zinc-300 text-[10px]">
                  <th className="text-left px-3 py-1 font-bold text-zinc-600">S.No.</th>
                  <th className="text-left px-3 py-1 font-bold text-zinc-600">Particulars</th>
                  <th className="text-center px-2 py-1 font-normal text-zinc-400 border-l border-zinc-200">From</th>
                  <th className="text-center px-2 py-1 font-normal text-zinc-400">Less than</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-600 border-l border-zinc-200">Rate</th>
                  <th className="text-center px-3 py-1 font-bold text-zinc-600 border-l border-zinc-200">
                    Disc. % <span className="font-normal text-zinc-400">(if any)</span>
                  </th>
                  <th className="border-l border-zinc-300" colSpan={3} />
                  <th />
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const isLastEmpty = i === lines.length - 1 && line.particulars.trim() === "";
                  const filtered = line.particulars.trim()
                    ? stockItems.filter((it) =>
                        it.name.toLowerCase().includes(line.particulars.toLowerCase())
                      )
                    : stockItems;

                  const sym = unitSymbolFor(line.item_id);
                  const cost = costPriceFor(line.item_id);
                  const asOn = asOnFor(line.item_id);

                  return (
                    <tr
                      key={i}
                      className={`border-b border-zinc-100 group ${
                        isLastEmpty ? "bg-zinc-50/60" : "hover:bg-zinc-50"
                      }`}
                    >
                      <td className="px-3 py-1 text-zinc-400 text-center align-middle">
                        {isLastEmpty ? "" : i + 1}
                      </td>

                      <td className="px-2 py-1 align-middle relative">
                        <input
                          ref={(el) => { particularRefs.current[i] = el; }}
                          className={cellCls + " font-bold"}
                          value={line.particulars}
                          placeholder={isLastEmpty ? "Select item…" : ""}
                          onChange={(e) => {
                            setLineField(i, "particulars", e.target.value);
                            setLineField(i, "item_id", null);
                            setActiveItemDropdown(i);
                          }}
                          onFocus={() => setActiveItemDropdown(i)}
                          onBlur={() => setTimeout(() => setActiveItemDropdown(null), 150)}
                          onKeyDown={(e) => handleParticularKeyDown(e, i)}
                        />
                        {activeItemDropdown === i && (
                          <div className="absolute left-0 top-full mt-0.5 z-50 bg-white border border-zinc-300 rounded shadow-lg w-64 max-h-48 overflow-y-auto">
                            <div className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 flex justify-between bg-zinc-50">
                              <span>List of Items</span>
                              <button
                                onMouseDown={(e) => { e.preventDefault(); navigate("/master/create/stock-item"); }}
                                className="text-zinc-700 hover:underline font-bold"
                              >
                                Create
                              </button>
                            </div>
                            {filtered.length === 0 ? (
                              <div className="px-3 py-2 text-xs text-zinc-400">No items found.</div>
                            ) : (
                              filtered.map((it) => (
                                <div
                                  key={it.item_id}
                                  onMouseDown={(e) => { e.preventDefault(); pickItem(i, it); }}
                                  className={`px-3 py-1.5 text-xs cursor-pointer hover:bg-zinc-50 ${
                                    line.item_id === it.item_id ? "bg-zinc-100 font-bold text-black" : "text-zinc-700"
                                  }`}
                                >
                                  {it.name}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-2 py-1 align-middle w-24 border-l border-zinc-100">
                        <input
                          ref={(el) => { qtyFromRefs.current[i] = el; }}
                          className={cellCls + " text-right"}
                          value={line.qty_from}
                          placeholder="0"
                          onChange={(e) => setLineField(i, "qty_from", e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, i, qtyUpToRefs)}
                        />
                      </td>

                      <td className="px-2 py-1 align-middle w-24">
                        <input
                          ref={(el) => { qtyUpToRefs.current[i] = el; }}
                          className={cellCls + " text-right"}
                          value={line.qty_less_than}
                          placeholder="0"
                          onChange={(e) => setLineField(i, "qty_less_than", e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, i, rateRefs)}
                        />
                      </td>

                      <td className="px-2 py-1 align-middle border-l border-zinc-100">
                        <input
                          ref={(el) => { rateRefs.current[i] = el; }}
                          className={cellCls + " text-right"}
                          value={line.rate}
                          placeholder="0.00"
                          onChange={(e) => setLineField(i, "rate", e.target.value)}
                          onKeyDown={(e) => handleCellKeyDown(e, i, discRefs)}
                        />
                      </td>

                      <td className="px-2 py-1 align-middle border-l border-zinc-100">
                        <input
                          ref={(el) => { discRefs.current[i] = el; }}
                          className={cellCls + " text-right"}
                          value={line.disc_percent}
                          placeholder="0"
                          onChange={(e) => setLineField(i, "disc_percent", e.target.value)}
                          onKeyDown={(e) => handleDiscKeyDown(e, i)}
                        />
                      </td>

                      {/* ── As on : <date> reference (read-only) ── */}
                      <td className="px-3 py-1 align-middle text-right text-zinc-500 border-l border-zinc-300 tabular-nums">
                        {asOn ? fmtRate(asOn.rate, sym) : ""}
                      </td>
                      <td className="px-3 py-1 align-middle text-right text-zinc-500 tabular-nums">
                        {asOn && asOn.disc ? `${asOn.disc}%` : ""}
                      </td>
                      <td className="px-3 py-1 align-middle text-right text-zinc-500 tabular-nums">
                        {cost != null && line.item_id ? fmtRate(cost, sym) : ""}
                      </td>

                      <td className="px-1 align-middle">
                        {!isLastEmpty && (
                          <button
                            onClick={() => removeLine(i)}
                            className="text-zinc-300 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                            tabIndex={-1}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <RightActionPanel actions={actions} />
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3 flex justify-end bg-zinc-50 shrink-0 font-sans">
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/master/create")}
            className="text-xs px-4 py-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 shadow-sm transition-colors font-medium"
          >
            Quit
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-xs px-5 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50 shadow-sm transition-colors font-medium"
          >
            {loading ? "Saving…" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
