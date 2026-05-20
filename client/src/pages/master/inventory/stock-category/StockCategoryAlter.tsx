import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import type { StockCategoryType } from "@/types/api";

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
    <div ref={ref} className="absolute top-0 right-0 h-full w-64 bg-white border-l border-zinc-200 shadow-xl z-50 flex flex-col">
      <div className="px-3 py-2 border-b border-zinc-200 flex justify-between items-center shrink-0">
        <span className="text-xs font-semibold text-zinc-600 tracking-wide uppercase">{title}</span>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 text-xs">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div
          className={`px-3 py-2 text-sm cursor-pointer ${selected === "" ? "text-black font-semibold bg-zinc-100" : "text-zinc-700 hover:bg-zinc-50"}`}
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
        {items.length === 0 && (
          <div className="px-3 py-2 text-sm text-zinc-400">No categories found</div>
        )}
      </div>
    </div>
  );
}

function SelectionPanel({
  categories,
  onSelect,
  onCancel,
}: {
  categories: StockCategoryType[];
  onSelect: (c: StockCategoryType) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Stock Category</span>
        <span className="text-xs text-zinc-500">Esc to cancel</span>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Select Category to Alter</div>
        <input
          ref={inputRef}
          className="w-full text-sm bg-transparent border-b border-zinc-300 outline-none py-1 placeholder:text-zinc-400"
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6">
        {filtered.length === 0 && (
          <div className="text-sm text-zinc-400 py-4">No categories found</div>
        )}
        {filtered.map(c => (
          <div
            key={c.sc_id}
            onClick={() => onSelect(c)}
            className="py-2 text-sm text-zinc-700 hover:text-black cursor-pointer border-b border-zinc-100 last:border-0"
          >
            {c.name}
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
  description: string;
  parent_category_id: string;
}

export default function StockCategoryAlter() {
  const navigate = useNavigate();
  const { selectedCompany } = useCompany();

  const [categories, setCategories] = useState<StockCategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<StockCategoryType | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    const company_id = selectedCompany?.company_id;
    if (!company_id) return;
    window.api.stockCategory.getAll(company_id).then(r => {
      if (r.success) setCategories(r.stockCategories ?? []);
    });
  }, [selectedCompany]);

  const handleSelectCategory = (c: StockCategoryType) => {
    setSelectedCategory(c);
    setForm({
      name: c.name ?? "",
      alias: c.alias ?? "",
      description: c.description ?? "",
      parent_category_id: c.parent_category_id ? String(c.parent_category_id) : "",
    });
    setError(null);
  };

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => f ? { ...f, [key]: e.target.value } : f);

  const validate = (): string | null => {
    if (!form?.name.trim()) return "Name is required.";
    if (!selectedCompany?.company_id) return "No company selected.";
    return null;
  };

  const handleSubmit = useCallback(async () => {
    if (!form || !selectedCategory) return;
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true); setError(null);
    try {
      const result = await window.api.stockCategory.update({
        sc_id: selectedCategory.sc_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        parent_category_id: form.parent_category_id ? Number(form.parent_category_id) : null,
      });

      if (result.success) {
        const updated = await window.api.stockCategory.getAll(selectedCompany!.company_id!);
        if (updated.success) setCategories(updated.stockCategories ?? []);
        setSuccess(`Stock Category "${form.name}" updated.`);
        setTimeout(() => {
          setSuccess(null);
          setSelectedCategory(null);
          setForm(null);
        }, 2000);
      } else {
        setError(result.error || "Failed to update stock category.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [form, selectedCategory, selectedCompany]);

  const handleDelete = useCallback(async () => {
    if (!selectedCategory) return;
    if (!window.confirm(`Delete "${selectedCategory.name}"? This cannot be undone.`)) return;

    setLoading(true); setError(null);
    try {
      const result = await window.api.stockCategory.delete(selectedCategory.sc_id);
      if (result.success) {
        const updated = await window.api.stockCategory.getAll(selectedCompany!.company_id!);
        if (updated.success) setCategories(updated.stockCategories ?? []);
        setSelectedCategory(null);
        setForm(null);
      } else {
        setError(result.error || "Failed to delete stock category.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCompany]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showPanel) { setShowPanel(false); return; }
        if (selectedCategory) { setSelectedCategory(null); setForm(null); return; }
        navigate("/master/alter");
      }
      if (e.ctrlKey && e.key === "a") { e.preventDefault(); handleSubmit(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSubmit, navigate, showPanel, selectedCategory]);

  const underOptions = categories.filter(c =>
    selectedCategory ? String(c.sc_id) !== String(selectedCategory.sc_id) : true
  );

  const selectedLabel = form?.parent_category_id
    ? categories.find(c => String(c.sc_id) === form.parent_category_id)?.name ?? "Primary"
    : "Primary";

  if (!selectedCategory || !form) {
    return (
      <SelectionPanel
        categories={categories}
        onSelect={handleSelectCategory}
        onCancel={() => navigate("/master/alter")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      <div className="px-6 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-base">Alter Stock Category</span>
        <span className="text-xs text-zinc-500">Ctrl+A to accept &nbsp;|&nbsp; Esc to go back</span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">General</div>
          <Row label="Name" required>
            <input autoFocus className={inputCls} value={form.name} onChange={set("name")} placeholder="Category name" />
          </Row>
          <Row label="Alias">
            <input className={inputCls} value={form.alias} onChange={set("alias")} placeholder="Short name (optional)" />
          </Row>
          <Row label="Description">
            <input className={inputCls} value={form.description} onChange={set("description")} placeholder="Short description (optional)" />
          </Row>
          <Row label="Under">
            <button
              type="button"
              onClick={() => setShowPanel(true)}
              className="w-full text-left text-sm py-1 px-1 bg-transparent outline-none text-zinc-700 hover:text-black transition-colors"
            >
              {selectedLabel}
            </button>
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
            onClick={() => { setSelectedCategory(null); setForm(null); }}
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
          title="List of Categories"
          items={underOptions.map(c => ({ id: c.sc_id, label: c.name }))}
          selected={form.parent_category_id}
          onSelect={val => setForm(f => f ? { ...f, parent_category_id: val } : f)}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
}
