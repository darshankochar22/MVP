import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import {
  FormRow,
  PageTitleBar,
  RightActionPanel,
  SearchInput,
  DataTable,
  SideSelectionPanel,
} from "@/components/ui";
import type { StockGroupType, UnitType, StockItemType } from "@/types/api";
import BomListModal from "./components/BomListModal";
import BomComponentsModal, { type BomEntry } from "./components/BomComponentsModal";

const inputCls =
  "flex-1 bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent " +
  "focus:bg-zinc-100 hover:bg-zinc-50 focus:border-zinc-300 transition-colors";
const selectCls =
  "bg-transparent text-sm outline-none px-1 py-0.5 border border-transparent " +
  "cursor-pointer focus:bg-zinc-100 hover:bg-zinc-50 focus:border-zinc-300 transition-colors";

// ── Selection panel ──────────────────────────────────────────────────────────
function SelectionPanel({
  items,
  onSelect,
  onCancel,
  onCreate,
}: {
  items: StockItemType[];
  onSelect: (item: StockItemType) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
      if (e.altKey && e.key.toLowerCase() === "c") { e.preventDefault(); onCreate(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel, onCreate]);

  const filtered = items.filter(
    i =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.alias && i.alias.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      key: "name",
      label: "Item Name",
      span: "col-span-8",
      render: (r: StockItemType) => (
        <span className="font-bold text-zinc-950 uppercase">{r.name}</span>
      ),
    },
    {
      key: "alias",
      label: "Alias",
      span: "col-span-4",
      render: (r: StockItemType) => (
        <span className="text-zinc-500">{r.alias || "—"}</span>
      ),
    },
  ];

  const selectionActions = [
    { key: "Alt+C", label: "Create Item", onClick: onCreate },
    { key: "Esc",   label: "Quit",        onClick: onCancel },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none">
      <PageTitleBar title="Alter Stock Item" subtitle="Select Item to Alter" />
      <div className="p-3 bg-zinc-50 border-b border-zinc-200 shrink-0">
        <SearchInput value={search} onChange={setSearch} placeholder="Search items by name…" autoFocus />
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col bg-white border-r border-zinc-100">
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(r: StockItemType) => r.item_id}
            onRowClick={onSelect}
            emptyMessage="No stock items found."
          />
        </div>
        <RightActionPanel actions={selectionActions} />
      </div>
      <div className="border-t border-zinc-200 p-3 flex justify-end bg-zinc-50">
        <button onClick={onCancel} className="text-xs px-4 py-1.5 rounded border border-zinc-200 bg-white shadow-sm text-zinc-600 hover:bg-zinc-50 transition-colors font-medium">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── FormData ─────────────────────────────────────────────────────────────────
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

type PanelType = "group" | "unit" | null;

// ── Main alter component ─────────────────────────────────────────────────────
export default function StockItemAlter() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  const [stockItems,  setStockItems]  = useState<StockItemType[]>([]);
  const [stockGroups, setStockGroups] = useState<StockGroupType[]>([]);
  const [units,       setUnits]       = useState<UnitType[]>([]);
  const [selectedItem,setSelectedItem]= useState<StockItemType | null>(null);
  const [form,        setForm]        = useState<FormData | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);
  const [showPanel,   setShowPanel]   = useState<PanelType>(null);

  const [boms,              setBoms]              = useState<BomEntry[]>([]);
  const [showBomList,       setShowBomList]       = useState(false);
  const [showBomComponents, setShowBomComponents] = useState(false);
  const [currentBomName,    setCurrentBomName]    = useState("");

  // ── Load lists ──────────────────────────────────────────────────────────
  useEffect(() => {
    const company_id = selectedCompany?.company_id;
    if (!company_id) return;
    window.api.stockItem .getAll(company_id).then(r => { if (r.success) setStockItems(r.stockItems ?? []); });
    window.api.stockGroup.getAll(company_id).then(r => { if (r.success) setStockGroups(r.stockGroups ?? []); });
    window.api.unit      .getAll(company_id).then(r => { if (r.success) setUnits(r.units ?? []); });
  }, [selectedCompany]);

  // ── Refresh units on mount so newly-created units appear ──────────────────
  useEffect(() => {
    const company_id = selectedCompany?.company_id;
    if (!company_id) return;
    window.api.unit.getAll(company_id).then(r => {
      if (r.success) setUnits(r.units ?? []);
    });
  }, []);

  // ── Populate form when item is selected ─────────────────────────────────
  const handleSelectItem = (item: StockItemType) => {
    setSelectedItem(item);
    setForm({
      name:  item.name  ?? "",
      alias: item.alias ?? "",
      group_id: item.group_id ? String(item.group_id) : "",
      unit_id:  item.unit_id  ? String(item.unit_id)  : "",
      rate_of_duty:   String(item.rate_of_duty ?? 0),
      has_bom:  Boolean(item.has_bom),
      bom_name: item.bom_name ?? "",
      opening_quantity: String(item.opening_quantity ?? 0),
      opening_rate:     String(item.opening_rate     ?? 0),
    });
    setBoms([]);
    setShowBomList(false);
    setShowBomComponents(false);
    setError(null);
    setSuccess(null);
  };

  // ── Field helpers ────────────────────────────────────────────────────────
  const setField = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => f ? { ...f, [key]: e.target.value } : f);

  // ── BOM handlers ─────────────────────────────────────────────────────────
  const savePendingRef = useRef(false);

  const handleBomToggle = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yes = e.target.value === "Yes";
    setForm(f => f ? { ...f, has_bom: yes, bom_name: yes ? f.bom_name : "" } : f);
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
    setForm(f => f ? { ...f, bom_name: f.bom_name || entry.bomName } : f);
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

  // ── Derived labels ───────────────────────────────────────────────────────
  const selectedGroupLabel = form?.group_id
    ? stockGroups.find(g => String(g.sg_id) === form.group_id)?.name ?? "Primary"
    : "Primary";

  const selectedUnitLabel = form?.unit_id
    ? units.find(u => String(u.unit_id) === form.unit_id)?.symbol ?? "Not Applicable"
    : "Not Applicable";

  const openingValue =
    (parseFloat(form?.opening_quantity ?? "0") || 0) *
    (parseFloat(form?.opening_rate     ?? "0") || 0);

  // ── Back ─────────────────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    setSelectedItem(null);
    setForm(null);
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const executeSave = async (bomsToSave: BomEntry[] = boms) => {
    if (!form || !selectedItem) return;
    if (!selectedCompany?.company_id) { setError("No company selected."); return; }
    setLoading(true); setError(null);
    try {
      const result = await window.api.stockItem.update({
        item_id:    selectedItem.item_id,
        company_id: selectedCompany.company_id,
        name:  form.name.trim(),
        alias: form.alias.trim() || null,
        group_id: form.group_id ? Number(form.group_id) : null,
        unit_id:  form.unit_id  ? Number(form.unit_id)  : null,
        rate_of_duty:   Number(form.rate_of_duty) || 0,
        has_bom:  form.has_bom,
        bom_name: form.has_bom ? (bomsToSave[0]?.bomName || form.bom_name).trim() || null : null,
        opening_quantity: Number(form.opening_quantity) || 0,
        opening_rate:     Number(form.opening_rate)     || 0,
        reorder_level: 0, reorder_quantity: 0,
        track_batches: 0, track_expiry: 0,
      });

      if (result.success) {
        const updated = await window.api.stockItem.getAll(selectedCompany.company_id);
        if (updated.success) setStockItems(updated.stockItems ?? []);
        setSuccess(`Stock Item "${form.name}" updated successfully.`);
        setTimeout(() => { setSuccess(null); handleBack(); }, 1500);
      } else {
        setError(result.error || "Failed to update stock item.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!form || !selectedItem) return;
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!selectedCompany?.company_id) { setError("No company selected."); return; }

    if (form.has_bom && boms.length === 0) {
      savePendingRef.current = true;
      setShowBomList(true);
      return;
    }

    executeSave(boms);
  }, [form, selectedItem, selectedCompany, boms]);

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!selectedItem) return;
    if (!window.confirm(`Delete stock item "${selectedItem.name}"? This cannot be undone.`)) return;
    setLoading(true); setError(null);
    try {
      const result = await window.api.stockItem.delete(selectedItem.item_id);
      if (result.success) {
        const updated = await window.api.stockItem.getAll(selectedCompany!.company_id!);
        if (updated.success) setStockItems(updated.stockItems ?? []);
        handleBack();
      } else {
        setError(result.error || "Failed to delete stock item.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [selectedItem, selectedCompany, handleBack]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showBomList) { setShowBomList(false); savePendingRef.current = false; return; }
        if (showBomComponents) { setShowBomComponents(false); savePendingRef.current = false; return; }
        if (showPanel) { setShowPanel(null); return; }
        if (selectedItem) { handleBack(); return; }
        navigate("/master/alter");
      }
      if (e.altKey && e.key.toLowerCase() === "g") { e.preventDefault(); if (selectedItem) setShowPanel(p => p === "group" ? null : "group"); }
      if (e.altKey && e.key.toLowerCase() === "u") { e.preventDefault(); if (selectedItem) setShowPanel(p => p === "unit"  ? null : "unit");  }
      if ((e.altKey || e.ctrlKey) && e.key.toLowerCase() === "a") { e.preventDefault(); handleSubmit(); }
      if (e.altKey && e.key.toLowerCase() === "d") { e.preventDefault(); handleDelete(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, handleDelete, handleBack, navigate, showPanel, selectedItem, showBomList, showBomComponents]);

  // ── Selection screen ─────────────────────────────────────────────────────
  if (!selectedItem || !form) {
    return (
      <SelectionPanel
        items={stockItems}
        onSelect={handleSelectItem}
        onCancel={() => navigate("/master/alter")}
        onCreate={() => navigate("/master/create/stock-item")}
      />
    );
  }

  const alterActions = [
    { key: "Alt+G", label: "Select Group", onClick: () => setShowPanel(p => p === "group" ? null : "group") },
    { key: "Alt+U", label: "Select Unit",  onClick: () => setShowPanel(p => p === "unit"  ? null : "unit")  },
    { key: "Alt+A", label: "Accept",       onClick: handleSubmit },
    { key: "Alt+D", label: "Delete",       onClick: handleDelete },
    { key: "Esc",   label: "Back",         onClick: handleBack   },
  ];

  // ── Edit screen ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      <PageTitleBar
        title={`Stock Item Alteration: ${selectedItem.name}`}
        subtitle={selectedCompany?.name}
      />

      {/* ── Alerts ── */}
      {error && (
        <div className="px-3 py-1 border-b border-red-200 bg-red-50 text-red-700 text-xs flex justify-between items-center shrink-0">
          <span>• {error}</span>
          <button onClick={() => setError(null)} className="font-bold text-red-400 hover:text-red-700">×</button>
        </div>
      )}
      {success && (
        <div className="px-3 py-1 border-b border-green-200 bg-green-50 text-green-700 text-xs flex justify-between items-center shrink-0">
          <span>• {success}</span>
          <button onClick={() => setSuccess(null)} className="font-bold text-green-400 hover:text-green-700">×</button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

          {/* ── Two-column form area ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* ══ LEFT: General ══════════════════════════════════════════════ */}
            <div className="flex-1 min-w-0 border-r border-zinc-200 px-4 pt-4 pb-2 flex flex-col gap-0.5 overflow-y-auto">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">General</div>

              <FormRow label="Name" required labelWidth="w-48" className="flex items-center min-h-[26px]">
                <input autoFocus className={inputCls} value={form.name} onChange={setField("name")} />
              </FormRow>

              <FormRow label="(alias)" labelWidth="w-48" className="flex items-center min-h-[26px]">
                <input className={inputCls} value={form.alias} onChange={setField("alias")} />
              </FormRow>

              {/* Under */}
              <div
                className="flex items-center min-h-[26px] cursor-pointer hover:bg-zinc-50 rounded"
                onClick={() => setShowPanel(p => p === "group" ? null : "group")}
              >
                <span className="w-48 text-sm text-zinc-500 shrink-0">Under</span>
                <span className="text-zinc-400 mr-2 shrink-0">:</span>
                <span className="text-sm text-zinc-900 px-1">♦ {selectedGroupLabel}</span>
              </div>

              {/* Units */}
              <div
                className="flex items-center min-h-[26px] cursor-pointer hover:bg-zinc-50 rounded"
                onClick={() => setShowPanel(p => p === "unit" ? null : "unit")}
              >
                <span className="w-48 text-sm text-zinc-500 shrink-0">Units</span>
                <span className="text-zinc-400 mr-2 shrink-0">:</span>
                <span className="text-sm text-zinc-900 px-1">♦ {selectedUnitLabel}</span>
              </div>

              <div className="h-3" />

              {/* Additional */}
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">Additional Details</div>

              <FormRow label="Set components (BOM)" labelWidth="w-48" className="flex items-center min-h-[26px]">
                <div className="flex items-center gap-2">
                  <select className={selectCls} value={form.has_bom ? "Yes" : "No"} onChange={handleBomToggle}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  {form.has_bom && boms.length > 0 && (
                    <span className="text-xs text-zinc-400">({boms.length} BOM{boms.length > 1 ? "s" : ""})</span>
                  )}
                </div>
              </FormRow>
            </div>

            {/* ══ RIGHT: Statutory Details ════════════════════════════════════ */}
            <div className="w-[320px] shrink-0 px-4 pt-4 pb-2 flex flex-col gap-0.5 overflow-y-auto border-l border-zinc-100">
              <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">
                Statutory Details
              </div>

              {/* Rate of Duty */}
              <div className="flex items-center min-h-[24px]">
                <span className="w-40 text-xs text-zinc-600 shrink-0">Rate of Duty (eg 5)</span>
                <span className="text-zinc-400 mr-1 text-xs shrink-0">:</span>
                <input
                  className="w-20 bg-transparent text-xs outline-none px-1 py-0.5 border border-transparent focus:bg-zinc-100 hover:bg-zinc-50 focus:border-zinc-300 transition-colors tabular-nums"
                  type="number" min="0" max="100" step="0.01"
                  value={form.rate_of_duty}
                  onChange={setField("rate_of_duty")}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* ── Opening Balance footer ─────────────────────────────────── */}
          <div className="shrink-0 border-t border-zinc-200">
            {/* Column headers */}
            <div className="flex items-center px-4 pt-1.5 pb-0.5 border-b border-zinc-100">
              <span className="w-48 shrink-0" />
              <span className="w-5 shrink-0" />
              <span className="w-32 text-right text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Quantity</span>
              <span className="w-28 text-right text-[10px] uppercase tracking-widest text-zinc-400 font-semibold ml-4">Rate</span>
              <span className="w-16 text-center text-[10px] uppercase tracking-widest text-zinc-400 font-semibold ml-2">per</span>
              <span className="flex-1 text-right text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Value</span>
            </div>

            {/* Opening balance row */}
            <div className="flex items-center px-4 py-2">
              <span className="w-48 text-sm text-zinc-700 shrink-0">Opening Balance</span>
              <span className="w-5 text-zinc-400 shrink-0">:</span>

              {/* Quantity */}
              <div className="w-32 flex items-center gap-1 border-b border-zinc-300 focus-within:border-zinc-600">
                <input
                  className="w-20 bg-transparent text-sm outline-none py-0.5 text-right tabular-nums"
                  type="number" min="0" step="0.01"
                  value={form.opening_quantity}
                  onChange={setField("opening_quantity")}
                  placeholder="0"
                />
                <span className="text-sm text-zinc-600 shrink-0">
                  {form.unit_id ? selectedUnitLabel : ""}
                </span>
              </div>

              {/* Rate */}
              <div className="w-28 ml-4 border-b border-zinc-300 focus-within:border-zinc-600">
                <input
                  className="w-full bg-transparent text-sm outline-none py-0.5 text-right tabular-nums pr-1"
                  type="number" min="0" step="0.01"
                  value={form.opening_rate}
                  onChange={setField("opening_rate")}
                  placeholder="0.00"
                />
              </div>

              {/* per */}
              <span className="w-16 text-center text-sm text-zinc-600 ml-2 shrink-0">
                {form.unit_id ? selectedUnitLabel : ""}
              </span>

              {/* Value */}
              <span className="flex-1 text-right text-sm font-mono text-zinc-800 tabular-nums">
                {openingValue > 0
                  ? openingValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Side selection panels ── */}
        {showPanel === "group" && (
          <SideSelectionPanel
            title="List of Groups"
            items={stockGroups
              .filter(g => g.name.toLowerCase() !== "primary")
              .map(g => ({ id: g.sg_id, label: g.name }))}
            selected={form.group_id}
            onSelect={val => setForm(f => f ? { ...f, group_id: val } : f)}
            onClose={() => setShowPanel(null)}
            showPrimary
          />
        )}
        {showPanel === "unit" && (
          <SideSelectionPanel
            title="List of Units"
            items={[
              { id: "create", label: "Create New Unit" },
              ...units.map(u => ({ id: String(u.unit_id), label: `${u.symbol} (${u.name})` })),
            ]}
            selected={form.unit_id}
            onSelect={val => {
              if (val === "create") navigate("/master/create/unit");
              else { setForm(f => f ? { ...f, unit_id: val } : f); setShowPanel(null); }
            }}
            onClose={() => setShowPanel(null)}
            showPrimary
            primaryLabel="Not Applicable"
          />
        )}

        <RightActionPanel actions={alterActions} />
      </div>

      {/* ── Footer bar ── */}
      <div className="border-t border-zinc-200 px-4 py-2.5 flex justify-between items-center shrink-0">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs px-4 py-1.5 rounded border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 transition-colors font-medium"
        >
          Delete
        </button>
        <div className="flex gap-3">
          <button onClick={handleBack} className="text-xs px-4 py-1.5 rounded border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors">
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm px-6 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? "Saving…" : "Accept"}
          </button>
        </div>
      </div>

      {/* ── BOM modals ── */}
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