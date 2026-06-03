import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import type { StockGroupType, UnitType } from "@/types/api";
import { loadFormState, saveFormState, clearFormState } from "@/utils/formPersistence";
import BomListModal from "./components/BomListModal";
import BomComponentsModal, { type BomEntry } from "./components/BomComponentsModal";

interface FormData {
  name: string;
  alias: string;
  group_id: string;
  unit_id: string;
  rate_of_duty: string;
  has_bom: boolean;
  bom_name: string;
  opening_quantity: string;
  opening_rate: string;
}

const INITIAL: FormData = {
  name: "",
  alias: "",
  group_id: "",
  unit_id: "",
  rate_of_duty: "0",
  has_bom: false,
  bom_name: "",
  opening_quantity: "",
  opening_rate: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// LIST OF UNITS / GROUPS side panel
// ─────────────────────────────────────────────────────────────────────────────
function ListSidePanel({
  title,
  items,
  selected,
  onSelect,
  onClose,
  primaryLabel = "Not Applicable",
  showCreate = false,
  onCreateNew,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  primaryLabel?: string;
  showCreate?: boolean;
  onCreateNew?: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-52 border-l border-zinc-300 flex flex-col bg-white shrink-0">
      <div className="bg-zinc-800 text-white text-xs px-3 py-1.5 font-medium">{title}</div>
      <input
        ref={inputRef}
        className="px-3 py-1.5 text-xs outline-none border-b border-zinc-200 placeholder-zinc-400"
        placeholder="Search..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter" && filtered.length > 0) { onSelect(filtered[0].id); onClose(); }
        }}
      />
      <div className="flex-1 overflow-y-auto">
        <div
          className={`flex items-center px-3 py-1 text-xs cursor-pointer border-b border-zinc-100 ${
            !selected ? "bg-yellow-100 font-medium" : "hover:bg-zinc-50"
          }`}
          onClick={() => { onSelect(""); onClose(); }}
        >
          <span className="text-zinc-800 mr-1">♦</span>
          <span className="text-zinc-800">{primaryLabel}</span>
        </div>
        {showCreate && (
          <div
            className="flex items-center px-3 py-1 text-xs cursor-pointer border-b border-zinc-100 hover:bg-zinc-50"
            onClick={() => { onCreateNew?.(); onClose(); }}
          >
            <span className="text-blue-600 mr-1">✦</span>
            <span className="text-blue-600 font-medium">Create New</span>
          </div>
        )}
        {filtered.map(item => (
          <div
            key={item.id}
            className={`px-3 py-1 text-xs cursor-pointer border-b border-zinc-100 ${
              selected === item.id ? "bg-yellow-100 font-medium text-zinc-900" : "hover:bg-zinc-50 text-zinc-800"
            }`}
            onClick={() => { onSelect(item.id); onClose(); }}
          >
            {item.label}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 px-3 py-1.5">
        <button onClick={onClose} className="text-xs text-zinc-500 hover:text-zinc-800">Esc: Close</button>
      </div>
    </div>
  );
}

export default function StockItemCreate() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;
  const persistKey = companyId ? `stockItemCreate_${companyId}` : null;
  const hasRestored = useRef(false);

  const [form, setForm] = useState<FormData>(
    () => loadFormState<any>(persistKey ?? "")?.form ?? INITIAL
  );
  const [stockGroups, setStockGroups] = useState<StockGroupType[]>([]);
  const [units, setUnits] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"group" | "unit" | null>(null);

  const [showBomList, setShowBomList] = useState(false);
  const [showBomComponents, setShowBomComponents] = useState(false);
  const [currentBomName, setCurrentBomName] = useState("");
  const [boms, setBoms] = useState<BomEntry[]>([]);
  const savePendingRef = useRef(false);

  // ── Fetch on every mount so newly-created units appear when returning from UnitCreate ──
  useEffect(() => {
    const cid = selectedCompany?.company_id;
    if (!cid) return;
    window.api.stockGroup.getAll(cid).then(r => {
      if (r.success) setStockGroups(r.stockGroups ?? []);
    });
    window.api.unit.getAll(cid).then(r => {
      if (r.success) setUnits(r.units ?? []);
    });
  }, []);

  useEffect(() => {
    if (!persistKey) return;
    if (!hasRestored.current) { hasRestored.current = true; return; }
    saveFormState(persistKey, { form });
  }, [persistKey, form]);

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }));

  const setVal = (key: keyof FormData, value: any) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleBomToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yes = e.target.value === "Yes";
    setForm(f => ({ ...f, has_bom: yes, bom_name: yes ? f.bom_name : "" }));
    if (!yes) setBoms([]);
  };

  const handleBomSelect = (name: string) => {
    setCurrentBomName(name);
    setShowBomList(false);
    setShowBomComponents(true);
  };

  const handleBomAccept = (entry: BomEntry) => {
    setBoms(prev => {
      const updated = [...prev, entry];
      if (savePendingRef.current) {
        executeSave(updated);
        savePendingRef.current = false;
      }
      return updated;
    });
    setForm(f => ({ ...f, bom_name: f.bom_name || entry.bomName }));
    setShowBomComponents(false);
  };

  const handleBomListClose = () => {
    setShowBomList(false);
    savePendingRef.current = false;
  };

  const handleBomComponentsClose = () => {
    setShowBomComponents(false);
    savePendingRef.current = false;
  };

  const selectedGroupLabel = form.group_id
    ? (stockGroups.find(g => String(g.sg_id) === form.group_id)?.name ?? "Primary")
    : "Primary";

  const selectedUnitLabel = form.unit_id
    ? (units.find(u => String(u.unit_id) === form.unit_id)?.symbol ?? "Not Applicable")
    : "Not Applicable";

  const openingQty = parseFloat(form.opening_quantity) || 0;
  const openingRate = parseFloat(form.opening_rate) || 0;
  const openingValue = openingQty * openingRate;

  const executeSave = async (bomsToSave: BomEntry[] = boms) => {
    if (!companyId) return;
    setLoading(true); setError(null);
    try {
      const result = await window.api.stockItem.create({
        company_id: companyId,
        name: form.name.trim(),
        alias: form.alias.trim() || undefined,
        group_id: form.group_id ? Number(form.group_id) : undefined,
        unit_id: form.unit_id ? Number(form.unit_id) : undefined,
        rate_of_duty: Number(form.rate_of_duty) || 0,
        has_bom: form.has_bom,
        bom_name: form.has_bom ? (bomsToSave[0]?.bomName || form.bom_name).trim() || undefined : undefined,
        opening_quantity: Number(form.opening_quantity) || 0,
        opening_rate: Number(form.opening_rate) || 0,
        gst_applicable: "Not Applicable",
        gst_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        igst_rate: 0,
        type_of_supply: "Goods",
        reorder_level: 0,
        reorder_quantity: 0,
        track_batches: 0,
        track_expiry: 0,
      });
      if (result.success) {
        setSuccess(`"${form.name}" created.`);
        setForm(INITIAL);
        setBoms([]);
        if (persistKey) clearFormState(persistKey);
        hasRestored.current = false;
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to create stock item.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = useCallback(() => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!companyId) { setError("No company selected."); return; }

    if (form.has_bom && boms.length === 0) {
      savePendingRef.current = true;
      setShowBomList(true);
      return;
    }

    executeSave(boms);
  }, [form, companyId, boms]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showBomList) { setShowBomList(false); savePendingRef.current = false; return; }
        if (showBomComponents) { setShowBomComponents(false); savePendingRef.current = false; return; }
        if (activePanel) { setActivePanel(null); return; }
        navigate("/master/create");
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.altKey && e.key.toLowerCase() === "g") { e.preventDefault(); setActivePanel(p => p === "group" ? null : "group"); }
      if (e.altKey && e.key.toLowerCase() === "u") { e.preventDefault(); setActivePanel(p => p === "unit" ? null : "unit"); }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, activePanel, showBomList, showBomComponents, navigate]);

  const inp = "w-full bg-transparent text-sm outline-none border-b border-zinc-300 focus:border-zinc-600 py-0 px-0 placeholder-zinc-300 transition-colors";

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* ── Title bar ── */}
      <div className="shrink-0 bg-zinc-900 text-white text-xs font-bold px-4 py-2 tracking-widest uppercase">
        Stock Item Creation
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div className="px-3 py-1 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between items-center shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="px-3 py-1 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between items-center shrink-0">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-2 font-bold">×</button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ══ MAIN FORM ══ */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Two-column content */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── LEFT PANEL ── */}
            <div className="flex-1 min-w-0 px-6 pt-4 pb-2 overflow-y-auto flex flex-col gap-0 border-r border-zinc-200">
              {/* GENERAL */}
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">General</div>

              {/* Name */}
              <div className="flex items-center min-h-[26px]">
                <span className="w-24 shrink-0 text-sm text-zinc-700">Name</span>
                <span className="text-zinc-400 mr-3 text-sm">:</span>
                <input autoFocus className={inp} value={form.name} onChange={set("name")} placeholder="Enter item name" />
              </div>

              {/* (alias) */}
              <div className="flex items-center min-h-[26px]">
                <span className="w-24 shrink-0 text-sm text-zinc-400">(alias)</span>
                <span className="text-zinc-400 mr-3 text-sm">:</span>
                <input className={inp} value={form.alias} onChange={set("alias")} placeholder="Optional alias" style={{ color: "#aaa" }} />
              </div>

              {/* Spacer */}
              <div className="h-5" />

              {/* Under */}
              <div
                className="flex items-center min-h-[26px] cursor-pointer group"
                onClick={() => setActivePanel(p => p === "group" ? null : "group")}
              >
                <span className="w-24 shrink-0 text-sm text-zinc-700">Under</span>
                <span className="text-zinc-400 mr-3 text-sm">:</span>
                <span className="text-sm text-zinc-900 group-hover:underline">♦ {selectedGroupLabel}</span>
              </div>

              {/* Units */}
              <div
                className="flex items-center min-h-[26px] cursor-pointer group"
                onClick={() => setActivePanel(p => p === "unit" ? null : "unit")}
              >
                <span className="w-24 shrink-0 text-sm text-zinc-700">Units</span>
                <span className="text-zinc-400 mr-3 text-sm">:</span>
                <span className="text-sm text-zinc-900 group-hover:underline">♦ {selectedUnitLabel}</span>
              </div>

              {/* ADDITIONAL DETAILS — only when unit is selected */}
              {form.unit_id && (
                <>
                  <div className="h-5" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">Additional Details</div>

                  {/* Set components (BOM) */}
                  <div className="flex items-center min-h-[26px]">
                    <span className="w-44 shrink-0 text-sm text-zinc-700">Set components (BOM)</span>
                    <span className="text-zinc-400 mr-3 text-sm">:</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        className="bg-transparent text-sm outline-none border-b border-zinc-300 focus:border-zinc-600 cursor-pointer"
                        value={form.has_bom ? "Yes" : "No"}
                        onChange={handleBomToggle}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                      {form.has_bom && boms.length > 0 && (
                        <span className="text-xs text-zinc-400">({boms.length} BOM{boms.length > 1 ? "s" : ""})</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── RIGHT PANEL: Statutory Details ── */}
            <div className="shrink-0 px-4 pt-4 pb-2 overflow-y-auto flex flex-col gap-0 border-l border-zinc-100" style={{ width: 320 }}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-semibold mb-1">Statutory Details</div>

              {/* Rate of Duty */}
              <div className="flex items-center min-h-[22px] mt-1">
                <span className="w-40 shrink-0 text-xs text-zinc-700">Rate of Duty (eg 5)</span>
                <span className="text-zinc-400 mr-2 text-xs shrink-0">:</span>
                <input
                  className="w-16 bg-transparent text-xs outline-none border-b border-zinc-300 focus:border-zinc-600 text-right tabular-nums"
                  type="number" min="0" max="100" step="0.01"
                  value={form.rate_of_duty}
                  onChange={set("rate_of_duty")}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ── Opening Balance ── */}
          <div className="shrink-0 border-t border-zinc-300">
            {/* Column headers */}
            <div className="flex items-center px-6 pt-1 pb-0 border-b border-zinc-100">
              <div className="flex-1" />
              <span className="w-36 text-right text-[10px] uppercase tracking-widest text-zinc-500 font-semibold pr-1">Quantity</span>
              <span className="w-24 text-right text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-4">Rate</span>
              <span className="w-10 text-center text-[10px] uppercase tracking-widest text-zinc-500 font-semibold ml-2">per</span>
              <span className="w-28 text-right text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">Value</span>
            </div>
            {/* Data row */}
            <div className="flex items-center px-6 py-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-zinc-700">Opening Balance</span>
                <span className="text-zinc-400 text-sm">:</span>
              </div>
              {/* Quantity */}
              <div className="w-36 flex items-center justify-end gap-1 border-b border-zinc-400 focus-within:border-zinc-700 pr-1">
                <input
                  className="w-24 bg-transparent text-sm outline-none py-0.5 text-right tabular-nums"
                  type="number" min="0" step="0.001"
                  value={form.opening_quantity}
                  onChange={set("opening_quantity")}
                  placeholder="0"
                />
                {form.unit_id && (
                  <span className="text-xs text-zinc-500 shrink-0">{selectedUnitLabel}</span>
                )}
              </div>
              {/* Rate */}
              <div className="w-24 ml-4 border-b border-zinc-400 focus-within:border-zinc-700">
                <input
                  className="w-full bg-transparent text-sm outline-none py-0.5 text-right tabular-nums pr-1"
                  type="number" min="0" step="0.01"
                  value={form.opening_rate}
                  onChange={set("opening_rate")}
                  placeholder="0.00"
                />
              </div>
              {/* per */}
              <span className="w-10 text-center text-xs text-zinc-500 ml-2 shrink-0">
                {form.unit_id ? selectedUnitLabel : ""}
              </span>
              {/* Value */}
              <span className="w-28 text-right text-sm tabular-nums text-zinc-800">
                {openingValue > 0
                  ? openingValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Side selection panel (group / unit) ── */}
        {activePanel === "group" && (
          <ListSidePanel
            title="List of Groups"
            items={stockGroups.map(g => ({ id: String(g.sg_id), label: g.name }))}
            selected={form.group_id}
            onSelect={val => { setVal("group_id", val); setActivePanel(null); }}
            onClose={() => setActivePanel(null)}
            primaryLabel="Primary"
          />
        )}
        {activePanel === "unit" && (
          <ListSidePanel
            title="List of Units"
            items={units.map(u => ({ id: String(u.unit_id), label: `${u.symbol} (${u.name})` }))}
            selected={form.unit_id}
            onSelect={val => { setVal("unit_id", val); setActivePanel(null); }}
            onClose={() => setActivePanel(null)}
            primaryLabel="Not Applicable"
            showCreate
            onCreateNew={() => navigate("/master/create/unit")}
          />
        )}
      </div>

      {/* ── Footer bar ── */}
      <div className="border-t border-zinc-200 px-4 py-2.5 flex justify-between items-center shrink-0 bg-zinc-50">
        <button
          onClick={() => navigate("/master/create")}
          className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors font-medium"
        >
          <span className="font-bold">Q</span>: Quit
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="text-sm px-6 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors font-medium"
        >
          {loading ? "Saving…" : "Accept"}
        </button>
      </div>

      {showBomList && (
        <BomListModal
          stockItemName={form.name}
          existingBoms={boms.map(b => b.bomName)}
          onSelectBom={handleBomSelect}
          onClose={handleBomListClose}
        />
      )}
      {showBomComponents && (
        <BomComponentsModal
          bomName={currentBomName}
          stockItemName={form.name}
          onClose={handleBomComponentsClose}
          onAccept={handleBomAccept}
        />
      )}
    </div>
  );
}
