import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

// ── Types ────────────────────────────────────────────────────────────────────

interface StockItemEntry {
  item_id: number;
  name: string;
}

interface TxRow {
  date: string;
  party_name: string | null;
  quantity: number;
  rate: number;
  disc_amount: number;
  amount: number;
}

interface GodownRow {
  godown_id: number | null;
  godown_name: string;
  batch: string;
  qty: number;
}

interface CategoryItem {
  item_id: number;
  item_name: string;
  closing_qty: number;
  closing_value: number;
  last_sale_rate: number;
}

interface QueryResult {
  item: {
    item_id: number;
    name: string;
    group_name: string;
    category_name: string;
    unit_name: string;
    closing_qty: number;
    closing_value: number;
    last_sale_rate: number | null;
  };
  purchases: TxRow[];
  sales: TxRow[];
  godownDetails: GodownRow[];
  categoryItems: CategoryItem[];
}

// ── Formatters ───────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  v === 0
    ? ""
    : new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v);

const fmtDate = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dt.getMonth()];
  return `${day}-${mon}-${String(dt.getFullYear()).slice(2)}`;
};

// ── Section header (matches StockSummaryLayout style) ────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-[#e5eff5] border-b border-zinc-300 px-3 py-1 text-[10px] font-bold text-zinc-700 uppercase tracking-wide select-none">
      {title}
    </div>
  );
}

// ── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[11px] py-0.5">
      <span className="w-44 shrink-0 text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-900">{value}</span>
    </div>
  );
}

// ── TxTable ──────────────────────────────────────────────────────────────────

function TxTable({ title, rows, emptyMsg }: { title: string; rows: TxRow[]; emptyMsg: string }) {
  return (
    <div className="flex-1 min-w-0 border-r border-zinc-200 last:border-r-0">
      <SectionHeader title={title} />
      <table className="w-full border-collapse text-[11px] font-mono">
        <thead className="sticky top-0 bg-[#e5eff5] border-b border-zinc-300 z-10">
          <tr>
            <th className="text-left px-2 py-1 font-bold text-zinc-700 w-[16%]">Date</th>
            <th className="text-left px-2 py-1 font-bold text-zinc-700 w-[28%]">Party Name</th>
            <th className="text-right px-2 py-1 font-bold text-zinc-700 w-[14%]">Quantity</th>
            <th className="text-right px-2 py-1 font-bold text-zinc-700 w-[12%]">Rate</th>
            <th className="text-right px-2 py-1 font-bold text-zinc-700 w-[10%]">Disc %</th>
            <th className="text-right px-2 py-1 font-bold text-zinc-700 w-[20%]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-5 text-zinc-400 italic text-[10px]">
                {emptyMsg}
              </td>
            </tr>
          ) : rows.map((r, i) => {
            const discPct =
              r.disc_amount && r.amount
                ? (r.disc_amount / (r.amount + r.disc_amount)) * 100
                : 0;
            return (
              <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 h-6">
                <td className="px-2 py-0.5">{fmtDate(r.date)}</td>
                <td className="px-2 py-0.5 truncate max-w-0">{r.party_name || ""}</td>
                <td className="px-2 py-0.5 text-right">{r.quantity !== 0 ? fmt(r.quantity) : ""}</td>
                <td className="px-2 py-0.5 text-right">{r.rate !== 0 ? fmt(r.rate) : ""}</td>
                <td className="px-2 py-0.5 text-right">{discPct > 0 ? fmt(discPct) : ""}</td>
                <td className="px-2 py-0.5 text-right">{fmt(r.amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Item Picker ───────────────────────────────────────────────────────────────

function ItemPicker({
  items,
  onSelect,
  onCancel,
  onCreate,
}: {
  items: StockItemEntry[];
  onSelect: (item: StockItemEntry) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const [focused, setFocused] = React.useState(0);

  const filtered = React.useMemo(
    () => items.filter(it => it.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  React.useEffect(() => { setFocused(0); }, [search]);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "c" || e.key === "C")) { e.preventDefault(); onCreate(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setFocused(p => Math.min(p + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setFocused(p => Math.max(p - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); if (filtered[focused]) onSelect(filtered[focused]); }
      if (e.key === "Escape")    { e.preventDefault(); onCancel(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [focused, filtered, onSelect, onCancel, onCreate]);

  return (
    <div className="flex h-full w-full items-start justify-center bg-gray-100 select-none" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="flex flex-col w-[380px] h-full border-x border-zinc-300 bg-white">

        <div className="px-3 py-2 border-b border-zinc-300">
          <div className="text-center text-sm font-semibold mb-1">Name of Item</div>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500 bg-white"
          />
        </div>

        <div className="bg-zinc-800 text-white text-sm font-semibold px-3 py-1 flex items-center justify-between">
          <span>List of Stock Items</span>
          <button
            onClick={onCreate}
            className="text-xs font-semibold underline-offset-2 hover:underline"
            title="Create a new stock item (Alt+C)"
          >
            Create
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-3 py-4 text-xs text-zinc-400 italic">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-zinc-400 italic">No items found.</div>
          ) : filtered.map((item, idx) => (
            <div
              key={item.item_id}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setFocused(idx)}
              className={`px-3 py-1 text-sm cursor-pointer border-b border-zinc-100 ${
                idx === focused ? "bg-yellow-200 font-semibold" : "hover:bg-yellow-50"
              }`}
            >
              {item.name}
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-300 px-3 py-1 flex justify-between text-xs text-zinc-500">
          <span>↑↓ Navigate</span>
          <span>Enter: Select · Alt+C: Create · Esc: Back</span>
        </div>
      </div>
    </div>
  );
}

// ── StockQueryLayout ─────────────────────────────────────────────────────────

export function StockQueryLayout() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();

  const companyId = selectedCompany?.company_id;
  const fyId      = activeFY?.fy_id;

  const [allItems,    setAllItems]    = React.useState<StockItemEntry[]>([]);
  const [showPicker,  setShowPicker]  = React.useState(true);
  const [loading,     setLoading]     = React.useState(false);
  const [error,       setError]       = React.useState<string | null>(null);
  const [result,      setResult]      = React.useState<QueryResult | null>(null);

  // Load stock item list
  React.useEffect(() => {
    if (!companyId) return;
    (window as any).api.stockItem.getAll(companyId).then((res: any) => {
      if (res?.success && res.stockItems) setAllItems(res.stockItems);
      else if (res?.success && res.data)  setAllItems(res.data);
      else if (Array.isArray(res))        setAllItems(res);
    });
  }, [companyId]);

  const loadQuery = React.useCallback(async (item: StockItemEntry) => {
    if (!companyId || !fyId) return;
    setLoading(true);
    setError(null);
    setShowPicker(false);
    try {
      const res = await (window as any).api.report.stockQuery(companyId, fyId, item.item_id);
      if (!res.success) throw new Error(res.error || "Failed to load stock query");
      setResult(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId]);

  // F5 to re-open picker when detail is showing
  React.useEffect(() => {
    if (showPicker) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "F5") { e.preventDefault(); setShowPicker(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [showPicker]);

  // ── Item picker view ────────────────────────────────────────────────────────
  if (showPicker) {
    return (
      <ItemPicker
        items={allItems}
        onSelect={loadQuery}
        onCreate={() => navigate("/master/create/stock-item")}
        onCancel={() => {
          if (result) setShowPicker(false);
          // if no result yet, let TallyReportLayout's Escape handle navigation
        }}
      />
    );
  }

  // ── Loading / Error ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading stock query…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-xs px-8 text-center">
        {error}
      </div>
    );
  }

  if (!result) return null;

  const { item, purchases, sales, godownDetails, categoryItems } = result;

  // ── Detail view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white font-sans text-[11px]">

      {/* F5 hint */}
      <div className="bg-[#e5eff5] border-b border-zinc-200 px-3 py-0.5 flex justify-between text-[10px] text-zinc-600 select-none shrink-0">
        <span className="font-bold text-zinc-800">{item.name}</span>
        <span>Press <kbd className="bg-white border border-zinc-300 px-1 rounded text-[9px] font-bold">F5</kbd> to switch item</span>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Info Grid ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 border-b border-zinc-200">
          <div className="border-r border-zinc-200 px-4 py-3">
            <InfoRow label="Name"            value={item.name} />
            <InfoRow label="Group"           value={item.group_name} />
            <InfoRow
              label="Closing Balance"
              value={
                item.closing_qty !== 0
                  ? `${fmt(item.closing_qty)}${item.unit_name ? " " + item.unit_name : ""}`
                  : "0 = Not Applicable"
              }
            />
            <InfoRow label="Costing method"  value="" />
            <InfoRow label="Standard cost"   value="Default" />
          </div>
          <div className="px-4 py-3">
            <InfoRow label="Part No."                value="" />
            <InfoRow label="Category"               value={item.category_name} />
            <InfoRow label="Closing value"          value={item.closing_value !== 0 ? fmt(item.closing_value) : "0.00"} />
            <InfoRow label="Last selling price"     value={item.last_sale_rate ? fmt(item.last_sale_rate) : ""} />
            <InfoRow label="Market valuation method" value="Default" />
          </div>
        </div>

        {/* ── Purchases + Sales ─────────────────────────────────────────────── */}
        <div className="flex border-b border-zinc-200">
          <TxTable title="Purchases" rows={purchases} emptyMsg="No purchase transactions found" />
          <TxTable title="Sales"     rows={sales}     emptyMsg="No sales transactions found" />
        </div>

        {/* ── Godown / Batch + Category Items ───────────────────────────────── */}
        <div className="flex">

          {/* Godown / Batch */}
          <div className="flex-1 border-r border-zinc-200">
            <SectionHeader title="Godown / Batch Details" />
            <table className="w-full border-collapse text-[11px] font-mono">
              <thead className="bg-[#e5eff5] border-b border-zinc-300">
                <tr>
                  <th className="text-left px-3 py-1 font-bold text-zinc-700">Godown</th>
                  <th className="text-left px-3 py-1 font-bold text-zinc-700">Batch</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-700">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {godownDetails.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-zinc-400 italic text-[10px]">
                      No godown allocations
                    </td>
                  </tr>
                ) : godownDetails.map((g, i) => (
                  <tr key={i} className="border-b border-zinc-50 hover:bg-zinc-50 h-6">
                    <td className="px-3 py-0.5">{g.godown_name}</td>
                    <td className="px-3 py-0.5">{g.batch || ""}</td>
                    <td className="px-3 py-0.5 text-right">{fmt(g.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Items of Same Category */}
          <div className="flex-1">
            <SectionHeader title="Items of Same Category" />
            <table className="w-full border-collapse text-[11px] font-mono">
              <thead className="bg-[#e5eff5] border-b border-zinc-300">
                <tr>
                  <th className="text-left px-3 py-1 font-bold text-zinc-700">Item Name</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-700">Quantity</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-700">Cost</th>
                  <th className="text-right px-3 py-1 font-bold text-zinc-700">Sale Price</th>
                </tr>
              </thead>
              <tbody>
                {categoryItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-zinc-400 italic text-[10px]">
                      {item.category_name === "Not Applicable"
                        ? "No category assigned"
                        : "No other items in this category"}
                    </td>
                  </tr>
                ) : categoryItems.map(ci => (
                  <tr
                    key={ci.item_id}
                    onClick={() => loadQuery({ item_id: ci.item_id, name: ci.item_name })}
                    className={`border-b border-zinc-50 cursor-pointer h-6 ${
                      ci.item_id === item.item_id
                        ? "bg-[#ffcc00] text-zinc-950 font-bold"
                        : "hover:bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    <td className="px-3 py-0.5">{ci.item_name}</td>
                    <td className="px-3 py-0.5 text-right">{ci.closing_qty !== 0 ? fmt(ci.closing_qty) : ""}</td>
                    <td className="px-3 py-0.5 text-right">{ci.closing_value !== 0 ? fmt(ci.closing_value) : ""}</td>
                    <td className="px-3 py-0.5 text-right">{ci.last_sale_rate ? fmt(ci.last_sale_rate) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
