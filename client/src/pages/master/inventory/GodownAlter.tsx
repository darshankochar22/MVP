import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../../context/CompanyContext";
import type { GodownType } from "../../../types/api";

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
    <div
      ref={ref}
      className="absolute top-0 right-0 h-full w-64 bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col"
    >
      <div className="px-3 py-2 border-b border-zinc-200 flex justify-between items-center shrink-0">
        <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">{title}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div
          className={`px-3 py-2 text-sm cursor-pointer ${selected === "" ? "text-black font-semibold bg-zinc-100" : "text-black hover:bg-zinc-50"}`}
          onClick={() => { onSelect(""); onClose(); }}
        >
          Primary
        </div>
        {items.map(item => (
          <div
            key={item.id}
            className={`px-3 py-2 text-sm cursor-pointer ${selected === String(item.id) ? "text-black font-semibold bg-zinc-100" : "text-zinc-700 hover:bg-zinc-50"}`}
            onClick={() => { onSelect(String(item.id)); onClose(); }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectionPanel({
  godowns,
  onSelect,
  onCancel,
}: {
  godowns: GodownType[];
  onSelect: (g: GodownType) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = godowns.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Godown</span>
        <span className="text-xs text-zinc-500">Esc to cancel</span>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Select Godown to Alter</div>
        <input
          ref={inputRef}
          className="w-full text-sm bg-transparent border-b border-zinc-300 outline-none py-1 placeholder:text-zinc-400"
          placeholder="Search godowns..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {filtered.length === 0 && (
          <div className="text-sm text-zinc-400 py-4">No godowns found</div>
        )}
        {filtered.map(g => (
          <div
            key={g.godown_id}
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
  parent_godown_id: string;
  allow_storage_of_materials: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function GodownAlter() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  const [godowns, setGodowns] = useState<GodownType[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<GodownType | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const company_id = selectedCompany?.company_id;
    if (!company_id) return;
    window.api.godown.getAll(company_id).then(r => {
      if (r.success) setGodowns(r.godowns ?? []);
    });
  }, [selectedCompany]);

  const handleSelectGodown = (g: GodownType) => {
    setSelectedGodown(g);
    setForm({
      name: g.name ?? "",
      alias: g.alias ?? "",
      parent_godown_id: g.parent_godown_id ? String(g.parent_godown_id) : "",
      allow_storage_of_materials: String(g.allow_storage_of_materials ?? 1),
      address: g.address ?? "",
      city: g.city ?? "",
      state: g.state ?? "",
      pincode: g.pincode ?? "",
    });
    setError(null);
  };

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => f ? { ...f, [key]: e.target.value } : f);

  const validate = (): string | null => {
    if (!form?.name.trim()) return "Name is required.";
    if (!selectedCompany?.company_id) return "No company selected.";
    if (form.pincode && !/^\d{0,6}$/.test(form.pincode)) return "Pincode must be numeric (max 6 digits).";
    return null;
  };

  const handleSubmit = useCallback(async () => {
    if (!form || !selectedGodown) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true); setError(null);
    try {
      const result = await window.api.godown.update({
        godown_id: selectedGodown.godown_id,
        company_id: selectedCompany!.company_id,
        name: form.name.trim(),
        alias: form.alias.trim() || null,
        parent_godown_id: form.parent_godown_id ? Number(form.parent_godown_id) : null,
        allow_storage_of_materials: Number(form.allow_storage_of_materials),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        pincode: form.pincode.trim() || null,
      });

      if (result.success) {
        const updated = await window.api.godown.getAll(selectedCompany!.company_id!);
        if (updated.success) setGodowns(updated.godowns ?? []);

        setSuccess(`Godown "${form.name}" updated.`);
        setTimeout(() => {
          setSuccess(null);
          setSelectedGodown(null);
          setForm(null);
        }, 2000);
      } else {
        setError(result.error || "Failed to update godown.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [form, selectedGodown, selectedCompany]);

  const handleDelete = useCallback(async () => {
    if (!selectedGodown) return;
    if (!window.confirm(`Delete "${selectedGodown.name}"? This cannot be undone.`)) return;

    setLoading(true); setError(null);
    try {
      const result = await window.api.godown.delete(selectedGodown.godown_id);
      if (result.success) {
        const updated = await window.api.godown.getAll(selectedCompany!.company_id!);
        if (updated.success) setGodowns(updated.godowns ?? []);
        setSelectedGodown(null);
        setForm(null);
      } else {
        setError(result.error || "Failed to delete godown.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [selectedGodown, selectedCompany]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPanel) { setShowPanel(false); return; }
        if (selectedGodown) { setSelectedGodown(null); setForm(null); return; }
        navigate("/master/alter");
      }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, navigate, showPanel, selectedGodown]);

  // Exclude the godown being edited from the parent options (prevent self-referencing)
  const parentOptions = godowns.filter(g =>
    selectedGodown ? String(g.godown_id) !== String(selectedGodown.godown_id) : true
  );

  const selectedGodownLabel = form?.parent_godown_id
    ? godowns.find(g => String(g.godown_id) === form.parent_godown_id)?.name ?? "Primary"
    : "Primary";

  if (!selectedGodown || !form) {
    return (
      <SelectionPanel
        godowns={godowns}
        onSelect={handleSelectGodown}
        onCancel={() => navigate("/master/alter")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Godown</span>
        <span className="text-xs text-zinc-500">Ctrl+A to accept &nbsp;|&nbsp; Esc to go back</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">General</div>
          <Row label="Name" required>
            <input autoFocus className={inputCls} value={form.name} onChange={set("name")} placeholder="Godown / location name" />
          </Row>
          <Row label="Alias">
            <input className={inputCls} value={form.alias} onChange={set("alias")} placeholder="Short name (optional)" />
          </Row>
          <Row label="Under">
            <button
              type="button"
              onClick={() => setShowPanel(true)}
              className="w-full text-left text-sm py-1 px-1 bg-transparent outline-none text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
            >
              {selectedGodownLabel}
            </button>
          </Row>
          <Row label="Allow Storage of Materials">
            <select className={inputCls + " cursor-pointer"} value={form.allow_storage_of_materials} onChange={set("allow_storage_of_materials")}>
              <option value="1">Yes</option>
              <option value="0">No</option>
            </select>
          </Row>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Address</div>
          <Row label="Address">
            <input className={inputCls} value={form.address} onChange={set("address")} placeholder="Street / building (optional)" />
          </Row>
          <Row label="City">
            <input className={inputCls} value={form.city} onChange={set("city")} placeholder="City (optional)" />
          </Row>
          <Row label="State">
            <input className={inputCls} value={form.state} onChange={set("state")} placeholder="State (optional)" />
          </Row>
          <Row label="Pincode">
            <input className={inputCls} value={form.pincode} onChange={set("pincode")} placeholder="6-digit pincode (optional)" maxLength={6} />
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
            onClick={() => { setSelectedGodown(null); setForm(null); }}
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

      {showPanel && (
        <SidePanel
          title="List of Godowns"
          items={parentOptions.map(g => ({ id: g.godown_id, label: g.name }))}
          selected={form.parent_godown_id}
          onSelect={val => setForm(f => f ? { ...f, parent_godown_id: val } : f)}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}