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

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return d; }
};

interface StockItem { item_id: number; name: string; }

interface VoucherRow {
  voucher_id: number | null;
  date: string | null;
  particulars: string;
  voucher_type: string;
  voucher_number: string | number;
  inwards_qty: number | null;
  inwards_value: number | null;
  outwards_qty: number | null;
  outwards_value: number | null;
  closing_qty: number;
  closing_value: number;
}

type Level =
  | { step: "select" }
  | { step: "vouchers"; item: StockItem };

export default function StockItemAnalysis() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  const [level, setLevel] = React.useState<Level>({ step: "select" });

  // Stock items for selection
  const [allItems, setAllItems] = React.useState<StockItem[]>([]);
  const [itemsLoading, setItemsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectIdx, setSelectIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId) { setItemsLoading(false); return; }
    setItemsLoading(true);
    (window as any).api.stockItem.getAll(companyId).then((res: any) => {
      const list: StockItem[] = [...(res.stockItems ?? [])].sort((a: StockItem, b: StockItem) => a.name.localeCompare(b.name));
      setAllItems(list);
      setItemsLoading(false);
    });
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === ""
      ? allItems
      : allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
    [allItems, search]
  );

  React.useEffect(() => { setSelectIdx(0); }, [search]);

  // Vouchers for selected item
  const [vouchers, setVouchers] = React.useState<VoucherRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [rowIdx, setRowIdx] = React.useState(0);

  const loadVouchers = React.useCallback((item: StockItem) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "vouchers", item });
    setLoading(true);
    setErr(null);
    setRowIdx(0);
    (window as any).api.report.stockItemVouchers(companyId, fyId, item.item_id, activeFY?.start_date, activeFY?.end_date).then((res: any) => {
      if (res.success) setVouchers(res.rows ?? []);
      else setErr(res.error || "Failed to load");
      setLoading(false);
    });
  }, [companyId, fyId, activeFY]);

  const backToSelect = React.useCallback(() => {
    setLevel({ step: "select" });
    setVouchers([]);
    setSearch("");
  }, []);

  // Keyboard nav — vouchers level
  React.useEffect(() => {
    if (level.step !== "vouchers") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setRowIdx(p => Math.min(vouchers.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setRowIdx(p => Math.max(0, p - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); const r = vouchers[rowIdx]; if (r?.voucher_id) navigate(`/transactions/voucher/${r.voucher_id}`); }
      else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToSelect(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, vouchers, rowIdx, navigate, backToSelect]);

  const reportHeader = (itemName: string) => (
    <>
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
        <span className="font-bold text-sm tracking-wide">Item Movement Analysis</span>
        <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
        <span />
      </div>
      <div className="flex justify-between items-center px-3 py-1.5 bg-white border-b border-zinc-300 font-mono text-[11px]">
        <span className="font-semibold">{itemName}</span>
        <span>{periodLabel}</span>
      </div>
    </>
  );

  // ── Level 0: Select Stock Item ───────────────────────────────────────────
  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Stock Item Analysis</span>
          <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
          <span />
        </div>
        <SelectionPopup
          title="Stock Item Analysis"
          fieldLabel="Name of Item"
          listLabel="List of Stock Items"
          companyName={selectedCompany?.name}
          items={filtered.map(i => ({ id: i.item_id, name: i.name }))}
          index={selectIdx}
          loading={itemsLoading}
          search={search}
          onSearchChange={setSearch}
          onIndexChange={setSelectIdx}
          onAccept={(i) => { const item = filtered[i]; if (item) loadVouchers(item); }}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  // ── Level 1: Item Movement Analysis (Purchases / Sales columns) ──────────
  const { item } = level;

  const totPurchQty  = vouchers.reduce((s, r) => s + (Number(r.inwards_qty)    || 0), 0);
  const totPurchVal  = vouchers.reduce((s, r) => s + (Number(r.inwards_value)  || 0), 0);
  const totSalesQty  = vouchers.reduce((s, r) => s + (Number(r.outwards_qty)   || 0), 0);
  const totSalesVal  = vouchers.reduce((s, r) => s + (Number(r.outwards_value) || 0), 0);
  const finalCQty    = vouchers.length ? vouchers[vouchers.length - 1].closing_qty   : 0;
  const finalCVal    = vouchers.length ? vouchers[vouchers.length - 1].closing_value : 0;

  const rate = (val: number | null | undefined, qty: number | null | undefined) => {
    const v = Number(val) || 0;
    const q = Number(qty) || 0;
    if (!q || !v) return "";
    return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v / q);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
      {reportHeader(item.name)}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono select-none">
          <thead className="sticky top-0 bg-[#f4f4f5] border-b border-zinc-300 z-10 text-zinc-700">
            <tr>
              <th rowSpan={2} className="px-2 py-1 text-left font-bold w-20 border-b border-zinc-300 align-bottom">Date</th>
              <th rowSpan={2} className="px-2 py-1 text-left font-bold border-b border-zinc-300 align-bottom">Particulars</th>
              <th rowSpan={2} className="px-2 py-1 text-left font-bold w-28 border-b border-zinc-300 align-bottom">Vch Type</th>
              <th rowSpan={2} className="px-2 py-1 text-right font-bold w-16 border-b border-zinc-300 align-bottom">Vch No.</th>
              <th colSpan={3} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Purchases</th>
              <th colSpan={3} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Sales</th>
              <th colSpan={2} className="px-2 py-0.5 text-center font-bold border-b border-l border-zinc-200">Closing</th>
            </tr>
            <tr>
              <th className="px-2 py-1 text-right font-bold w-20 border-l border-zinc-200">Qty</th>
              <th className="px-2 py-1 text-right font-bold w-24">Rate</th>
              <th className="px-2 py-1 text-right font-bold w-24">Value</th>
              <th className="px-2 py-1 text-right font-bold w-20 border-l border-zinc-200">Qty</th>
              <th className="px-2 py-1 text-right font-bold w-24">Rate</th>
              <th className="px-2 py-1 text-right font-bold w-24">Value</th>
              <th className="px-2 py-1 text-right font-bold w-20 border-l border-zinc-200">Qty</th>
              <th className="px-2 py-1 text-right font-bold w-24">Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-zinc-400 italic">Loading...</td></tr>
            ) : err ? (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-zinc-600">{err}</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-zinc-400 italic">No records found.</td></tr>
            ) : vouchers.map((row, idx) => (
              <tr
                key={row.voucher_id ?? `row-${idx}`}
                onClick={() => setRowIdx(idx)}
                onDoubleClick={() => row.voucher_id && navigate(`/transactions/voucher/${row.voucher_id}`)}
                className={`border-b border-zinc-100 cursor-pointer ${idx === rowIdx ? "bg-[#e4e4e7] text-zinc-950 font-bold" : "hover:bg-zinc-50 text-zinc-800"}`}
              >
                <td className="px-2 py-1 whitespace-nowrap">{fmtDate(row.date)}</td>
                <td className="px-2 py-1 truncate max-w-xs">{row.particulars}</td>
                <td className="px-2 py-1">{row.voucher_type}</td>
                <td className="px-2 py-1 text-right">{row.voucher_number || ""}</td>
                <td className="px-2 py-1 text-right border-l border-zinc-100">{fmtQty(row.inwards_qty)}</td>
                <td className="px-2 py-1 text-right">{rate(row.inwards_value, row.inwards_qty)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.inwards_value)}</td>
                <td className="px-2 py-1 text-right border-l border-zinc-100">{fmtQty(row.outwards_qty)}</td>
                <td className="px-2 py-1 text-right">{rate(row.outwards_value, row.outwards_qty)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.outwards_value)}</td>
                <td className="px-2 py-1 text-right border-l border-zinc-100">{fmtQty(row.closing_qty)}</td>
                <td className="px-2 py-1 text-right">{fmt(row.closing_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t-2 border-zinc-300 bg-[#f4f4f5] px-3 py-1.5 flex font-mono text-[11px] font-bold text-zinc-900 shrink-0">
        <span className="w-20" /><span className="flex-1" /><span className="w-28" /><span className="w-16" />
        <span className="w-20 text-right pr-1 border-l border-zinc-300">{fmtQty(totPurchQty)}</span>
        <span className="w-24 text-right pr-1">{rate(totPurchVal, totPurchQty)}</span>
        <span className="w-24 text-right pr-1">{fmt(totPurchVal)}</span>
        <span className="w-20 text-right pr-1 border-l border-zinc-300">{fmtQty(totSalesQty)}</span>
        <span className="w-24 text-right pr-1">{rate(totSalesVal, totSalesQty)}</span>
        <span className="w-24 text-right pr-1">{fmt(totSalesVal)}</span>
        <span className="w-20 text-right pr-1 border-l border-zinc-300">{fmtQty(finalCQty)}</span>
        <span className="w-24 text-right pr-1">{fmt(finalCVal)}</span>
      </div>
      <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
        <button onClick={backToSelect} className="hover:underline hover:text-zinc-900">Q: Back to Item Selection</button>
        <span className="text-zinc-400">Enter: Open voucher</span>
      </div>
    </div>
  );
}
