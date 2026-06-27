import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";

const fmt = (val: number | null | undefined) => {
  const n = Number(val) || 0;
  if (n === 0) return "";
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
};

const fmtQty = (val: number | null | undefined, unit?: string) => {
  const n = Number(val) || 0;
  if (n === 0) return "";
  const s = n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return unit ? `${s} ${unit}` : s;
};

interface Group { group_id: number; name: string; }

interface ItemRow {
  item_id: number;
  item_name: string;
  unit_name: string;
  purchase_qty: number;
  purchase_rate: number;
  purchase_value: number;
  sales_qty: number;
  sales_rate: number;
  sales_value: number;
}

type Level =
  | { step: "select" }
  | { step: "report"; group: Group };

export default function GroupAnalysis() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  const [level, setLevel] = React.useState<Level>({ step: "select" });

  // Ledger groups for selection
  const [groups, setGroups] = React.useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectIdx, setSelectIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId) { setGroupsLoading(false); return; }
    setGroupsLoading(true);
    (window as any).api.group.getAll(companyId).then((res: any) => {
      const list: Group[] = [...(res.groups ?? [])].sort((a: Group, b: Group) => a.name.localeCompare(b.name));
      setGroups(list);
      setGroupsLoading(false);
    });
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === ""
      ? groups
      : groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())),
    [groups, search]
  );

  React.useEffect(() => { setSelectIdx(0); }, [search]);

  // Report data
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [rowIdx, setRowIdx] = React.useState(0);

  const loadReport = React.useCallback((group: Group) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "report", group });
    setLoading(true);
    setErr(null);
    setRowIdx(0);
    (window as any).api.report.groupAnalysis(companyId, fyId, group.group_id).then((res: any) => {
      if (res.success) setItems(res.items ?? []);
      else setErr(res.error || "Failed to load");
      setLoading(false);
    });
  }, [companyId, fyId]);

  const backToSelect = React.useCallback(() => {
    setLevel({ step: "select" });
    setItems([]);
    setSearch("");
  }, []);

  // Keyboard nav — report level
  React.useEffect(() => {
    if (level.step !== "report") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setRowIdx(p => Math.min(items.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setRowIdx(p => Math.max(0, p - 1)); }
      else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToSelect(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, items, rowIdx, backToSelect]);

  // ── Level 0: Select Ledger Group ─────────────────────────────────────────
  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Group Analysis</span>
          <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
          <span />
        </div>
        <SelectionPopup
          title="Group Analysis"
          fieldLabel="Name of Group"
          listLabel="List of Groups"
          companyName={selectedCompany?.name}
          items={filtered.map(g => ({ id: g.group_id, name: g.name }))}
          index={selectIdx}
          loading={groupsLoading}
          search={search}
          onSearchChange={setSearch}
          onIndexChange={setSelectIdx}
          onAccept={(i) => { const g = filtered[i]; if (g) loadReport(g); }}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  // ── Level 1: Group Analysis Report ───────────────────────────────────────
  const { group } = level;

  const totPurchQty  = items.reduce((s, r) => s + r.purchase_qty,   0);
  const totPurchVal  = items.reduce((s, r) => s + r.purchase_value, 0);
  const totSalesQty  = items.reduce((s, r) => s + r.sales_qty,      0);
  const totSalesVal  = items.reduce((s, r) => s + r.sales_value,    0);

  const avgRate = (val: number, qty: number) => {
    if (!qty || !val) return "";
    return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val / qty);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
        <span className="font-bold text-sm tracking-wide">Group Analysis</span>
        <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
        <span />
      </div>
      <div className="flex justify-between items-center px-3 py-1.5 bg-white border-b border-zinc-300 font-mono text-[11px]">
        <span className="font-semibold">{group.name}</span>
        <span>{periodLabel}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono select-none">
          <thead className="sticky top-0 bg-[#f4f4f5] border-b border-zinc-300 z-10 text-zinc-700">
            <tr>
              <th rowSpan={2} className="px-3 py-1 text-left font-bold align-bottom border-b border-zinc-300">Particulars</th>
              <th colSpan={3} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Purchases</th>
              <th colSpan={3} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Sales</th>
            </tr>
            <tr>
              <th className="px-2 py-1 text-right font-bold w-24 border-l border-zinc-200">Quantity</th>
              <th className="px-2 py-1 text-right font-bold w-28">EP Rate</th>
              <th className="px-2 py-1 text-right font-bold w-28">Value</th>
              <th className="px-2 py-1 text-right font-bold w-24 border-l border-zinc-200">Quantity</th>
              <th className="px-2 py-1 text-right font-bold w-28">EP Rate</th>
              <th className="px-2 py-1 text-right font-bold w-28">Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">Loading...</td></tr>
            ) : err ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-600">{err}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">No inventory movement found for this group.</td></tr>
            ) : items.map((row, idx) => (
              <tr
                key={row.item_id}
                onClick={() => setRowIdx(idx)}
                className={`border-b border-zinc-100 cursor-pointer ${idx === rowIdx ? "bg-[#e4e4e7] text-zinc-950 font-bold" : "hover:bg-zinc-50 text-zinc-800"}`}
              >
                <td className="px-3 py-1">{row.item_name}</td>
                <td className="px-2 py-1 text-right border-l border-zinc-100">{fmtQty(row.purchase_qty, row.unit_name)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.purchase_rate)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.purchase_value)}</td>
                <td className="px-2 py-1 text-right border-l border-zinc-100">{fmtQty(row.sales_qty, row.unit_name)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.sales_rate)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.sales_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t-2 border-zinc-300 bg-[#f4f4f5] px-3 py-1.5 flex font-mono text-[11px] font-bold text-zinc-900 shrink-0">
        <span className="flex-1">Grand Total</span>
        <span className="w-24 text-right border-l border-zinc-300 pr-1">{fmtQty(totPurchQty)}</span>
        <span className="w-28 text-right pr-1">{avgRate(totPurchVal, totPurchQty)}</span>
        <span className="w-28 text-right pr-1">{fmt(totPurchVal)}</span>
        <span className="w-24 text-right border-l border-zinc-300 pr-1">{fmtQty(totSalesQty)}</span>
        <span className="w-28 text-right pr-1">{avgRate(totSalesVal, totSalesQty)}</span>
        <span className="w-28 text-right pr-1">{fmt(totSalesVal)}</span>
      </div>
      <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
        <button onClick={backToSelect} className="hover:underline hover:text-zinc-900">Q: Back to Group Selection</button>
      </div>
    </div>
  );
}
