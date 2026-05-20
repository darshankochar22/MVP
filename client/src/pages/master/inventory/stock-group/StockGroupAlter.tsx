import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import type { StockGroupType } from "@/types/api";

function Row({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center min-h-[32px]">
      <span className="w-56 text-sm text-zinc-400 shrink-0 py-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <span className="text-zinc-600 mr-2">:</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputCls = "w-full bg-transparent text-sm outline-none py-1 px-1 rounded-sm placeholder:text-zinc-400";
const selectCls = "w-full bg-transparent text-sm outline-none py-1 px-1 rounded-sm cursor-pointer";

interface SidePanelProps {
  title: string;
  items: { id: string | number; label: string }[];
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function SidePanel({ title, items, selected, onSelect, onClose }: SidePanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-0 right-0 h-full w-64 bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-200 flex justify-between items-center shrink-0">
        <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">{title}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            className={`px-3 py-2 text-sm cursor-pointer ${selected === String(item.id) ? "text-black font-semibold bg-zinc-100" : "text-zinc-700 hover:bg-zinc-50"}`}
            onClick={() => { onSelect(String(item.id)); onClose(); }}
          >
            {item.label}
          </div>
        ))}
        {items.length === 0 && (
          <div className="px-3 py-2 text-sm text-zinc-400">No groups found</div>
        )}
      </div>
    </div>
  );
}

function SelectionPanel({
  groups,
  onSelect,
  onCancel,
}: {
  groups: StockGroupType[];
  onSelect: (g: StockGroupType) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Stock Group</span>
        <span className="text-xs text-zinc-500">Esc to cancel</span>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Select Group to Alter</div>
        <input
          ref={inputRef}
          className="w-full text-sm bg-transparent border-b border-zinc-300 outline-none py-1 placeholder:text-zinc-400"
          placeholder="Search groups..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {filtered.length === 0 && (
          <div className="text-sm text-zinc-400 py-4">No groups found</div>
        )}
        {filtered.map(g => (
          <div
            key={g.sg_id}
            onClick={() => onSelect(g)}
            className="py-2 text-sm text-zinc-700 hover:text-black cursor-pointer border-b border-zinc-100 last:border-0"
          >
            {g.name}
          </div>
        ))}
      </div>

      <div className="px-6 py-3 flex justify-end shrink-0">
        <button
          onClick={onCancel}
          className="text-sm px-4 py-1.5 rounded border text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface FormData {
  name: string;
  alias: string;
  parent_group_id: string;
  should_quantities_be_added: string;
  hsn_sac_code: string;
  hsn_sac_description: string;
  gst_rate: string;
  cgst_rate: string;
  sgst_rate: string;
}

type PanelType = "under" | null;

export default function StockGroupAlter() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  const [stockGroups, setStockGroups] = useState<StockGroupType[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StockGroupType | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState<PanelType>(null);

  useEffect(() => {
    const company_id = selectedCompany?.company_id;
    if (!company_id) return;
    window.api.stockGroup.getAll(company_id).then(r => {
      if (r.success) setStockGroups(r.stockGroups ?? []);
    });
  }, [selectedCompany]);

  const handleSelectGroup = (g: StockGroupType) => {
    setSelectedGroup(g);
    setForm({
      name: g.name ?? "",
      alias: g.alias ?? "",
      parent_group_id: g.parent_group_id ? String(g.parent_group_id) : "",
      should_quantities_be_added: String(g.should_quantities_be_added ?? 1),
      hsn_sac_code: g.hsn_sac_code ?? "",
      hsn_sac_description: g.hsn_sac_description ?? "",
      gst_rate: String(g.gst_rate ?? 0),
      cgst_rate: String(g.cgst_rate ?? 0),
      sgst_rate: String(g.sgst_rate ?? 0),
    });
    setError(null);
  };

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => f ? { ...f, [key]: e.target.value } : f);

  const handleGstChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const half = val === "" ? "0" : String(parseFloat(val) / 2);
    setForm(f => f ? { ...f, gst_rate: val, cgst_rate: half, sgst_rate: half } : f);
  };

  const validate = (): string | null => {
    if (!form?.name.trim()) return "Name is required.";
    if (!selectedCompany?.company_id) return "No company selected.";
    const gst = Number(form.gst_rate);
    const cgst = Number(form.cgst_rate);
    const sgst = Number(form.sgst_rate);
    if (gst < 0 || cgst < 0 || sgst < 0) return "GST rates cannot be negative.";
    if (gst > 100 || cgst > 100 || sgst > 100) return "GST rates cannot exceed 100%.";
    return null;
  };

  const handleSubmit = useCallback(async () => {
    if (!form || !selectedGroup) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true); setError(null);
    try {
      const result = await window.api.stockGroup.update({
        sg_id: selectedGroup.sg_id,
        company_id: selectedCompany!.company_id,
        name: form.name.trim(),
        alias: form.alias.trim() || null,
        parent_group_id: form.parent_group_id ? Number(form.parent_group_id) : null,
        should_quantities_be_added: Number(form.should_quantities_be_added),
        hsn_sac_code: form.hsn_sac_code.trim() || null,
        hsn_sac_description: form.hsn_sac_description.trim() || null,
        gst_rate: Number(form.gst_rate) || 0,
        cgst_rate: Number(form.cgst_rate) || 0,
        sgst_rate: Number(form.sgst_rate) || 0,
      });

      if (result.success) {
        // Refresh list
        const updated = await window.api.stockGroup.getAll(selectedCompany!.company_id!);
        if (updated.success) setStockGroups(updated.stockGroups ?? []);

        setSuccess(`Stock Group "${form.name}" updated.`);
        setTimeout(() => {
          setSuccess(null);
          setSelectedGroup(null);
          setForm(null);
        }, 2000);
      } else {
        setError(result.error || "Failed to update stock group.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [form, selectedGroup, selectedCompany]);

  const handleDelete = useCallback(async () => {
    if (!selectedGroup) return;
    if (!window.confirm(`Delete "${selectedGroup.name}"? This cannot be undone.`)) return;

    setLoading(true); setError(null);
    try {
      const result = await window.api.stockGroup.delete(selectedGroup.sg_id);
      if (result.success) {
        const updated = await window.api.stockGroup.getAll(selectedCompany!.company_id!);
        if (updated.success) setStockGroups(updated.stockGroups ?? []);
        setSelectedGroup(null);
        setForm(null);
      } else {
        setError(result.error || "Failed to delete stock group.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [selectedGroup, selectedCompany]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPanel) { setShowPanel(null); return; }
        if (selectedGroup) { setSelectedGroup(null); setForm(null); return; }
        navigate("/master/alter");
      }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, navigate, showPanel, selectedGroup]);

  const underOptions = stockGroups.filter(g =>
    selectedGroup ? String(g.sg_id) !== String(selectedGroup.sg_id) : true
  );

  const selectedUnderLabel = form?.parent_group_id
    ? stockGroups.find(g => String(g.sg_id) === form.parent_group_id)?.name ?? "Primary"
    : "Primary";


  if (!selectedGroup || !form) {
    return (
      <SelectionPanel
        groups={stockGroups.filter(g => !g.is_predefined)}
        onSelect={handleSelectGroup}
        onCancel={() => navigate("/master/alter")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">

      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Stock Group</span>
        <span className="text-xs text-zinc-500">Ctrl+A to accept &nbsp;|&nbsp; Esc to go back</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">

        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">General</div>
          <Row label="Name" required>
            <input autoFocus className={inputCls} value={form.name} onChange={set("name")} placeholder="Stock group name" />
          </Row>
          <Row label="Alias">
            <input className={inputCls} value={form.alias} onChange={set("alias")} placeholder="Short name (optional)" />
          </Row>
          <Row label="Under">
            <button
              type="button"
              onClick={() => setShowPanel("under")}
              className="w-full text-left text-sm py-1 px-1 bg-transparent outline-none text-zinc-700 hover:text-black transition-colors"
            >
              {selectedUnderLabel}
            </button>
          </Row>
          <Row label="Should Quantities be Added">
            <select className={selectCls} value={form.should_quantities_be_added} onChange={set("should_quantities_be_added")}>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </Row>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">HSN / SAC</div>
          <Row label="HSN / SAC Code">
            <input className={inputCls} value={form.hsn_sac_code} onChange={set("hsn_sac_code")} placeholder="e.g. 1001" />
          </Row>
          <Row label="Description">
            <input className={inputCls} value={form.hsn_sac_description} onChange={set("hsn_sac_description")} placeholder="HSN description (optional)" />
          </Row>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">GST Rates</div>
          <Row label="GST Rate (%)">
            <input className={inputCls} type="number" min="0" max="100" step="0.01" value={form.gst_rate} onChange={handleGstChange} />
          </Row>
          <Row label="CGST Rate (%)">
            <input className={inputCls} type="number" min="0" max="100" step="0.01" value={form.cgst_rate} onChange={set("cgst_rate")} />
          </Row>
          <Row label="SGST Rate (%)">
            <input className={inputCls} type="number" min="0" max="100" step="0.01" value={form.sgst_rate} onChange={set("sgst_rate")} />
          </Row>
        </div>

      </div>

      {success && (
        <div className="px-6 py-2 border-t border-green-900 bg-green-950 text-green-400 text-sm shrink-0">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="px-6 py-2 border-t border-red-900 bg-red-950 text-red-400 text-sm flex justify-between items-center shrink-0">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-xs ml-4 hover:opacity-70">dismiss</button>
        </div>
      )}

      <div className="px-6 py-3 flex justify-between items-center shrink-0">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-sm px-4 py-1.5 rounded border border-red-300 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          Delete
        </button>
        <div className="flex gap-3">
          <button
            onClick={() => { setSelectedGroup(null); setForm(null); }}
            className="text-sm px-4 py-1.5 rounded border text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm px-5 py-1.5 rounded bg-black text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors font-medium"
          >
            {loading ? "Saving..." : "Accept"}
          </button>
        </div>
      </div>

      {showPanel === "under" && (
        <SidePanel
          title="Stock Groups"
          items={underOptions.map(g => ({ id: g.sg_id, label: g.name }))}
          selected={form.parent_group_id}
          onSelect={val => setForm(f => f ? { ...f, parent_group_id: val } : f)}
          onClose={() => setShowPanel(null)}
        />
      )}

    </div>
  );
}