import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";
import ItemVoucherAnalysis, { type VoucherRow } from "./ItemVoucherAnalysis";

interface StockItem { item_id: number; name: string; }

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
    search.trim() === "" ? allItems : allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
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
    setLoading(true); setErr(null); setRowIdx(0);
    (window as any).api.report.stockItemVouchers(companyId, fyId, item.item_id, activeFY?.start_date, activeFY?.end_date).then((res: any) => {
      if (res.success) setVouchers(res.rows ?? []);
      else setErr(res.error || "Failed to load");
      setLoading(false);
    });
  }, [companyId, fyId, activeFY]);

  const backToSelect = React.useCallback(() => { setLevel({ step: "select" }); setVouchers([]); setSearch(""); }, []);

  // Keyboard nav — selection popup
  React.useEffect(() => {
    if (level.step !== "select") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectIdx(p => Math.min(filtered.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectIdx(p => Math.max(0, p - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); const it = filtered[selectIdx]; if (it) loadVouchers(it); }
      else if (e.key === "Escape") { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level.step, filtered, selectIdx, loadVouchers, navigate]);

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

  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Stock Item Analysis</span>
          <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
          <span />
        </div>
        <SelectionPopup
          title="Stock Item Analysis" fieldLabel="Name of Item" listLabel="List of Stock Items"
          companyName={selectedCompany?.name}
          items={filtered.map(i => ({ id: i.item_id, name: i.name }))}
          index={selectIdx} loading={itemsLoading} search={search}
          onSearchChange={setSearch} onIndexChange={setSelectIdx}
          onAccept={(i) => { const item = filtered[i]; if (item) loadVouchers(item); }}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  const { item } = level;
  return (
    <ItemVoucherAnalysis
      itemName={item.name} companyName={selectedCompany?.name} periodLabel={periodLabel}
      rows={vouchers} loading={loading} error={err}
      selectedIndex={rowIdx} onSelectIndex={setRowIdx}
      onOpenVoucher={(r) => r.voucher_id && navigate(`/transactions/voucher/${r.voucher_id}`)}
      footer={
        <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
          <button onClick={backToSelect} className="hover:underline hover:text-zinc-900">Q: Back to Item Selection</button>
          <span className="text-zinc-400">Enter: Open voucher</span>
        </div>
      }
    />
  );
}
