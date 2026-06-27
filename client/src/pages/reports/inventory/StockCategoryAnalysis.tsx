import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import MovementAnalysisTable, { type MovRow } from "./MovementAnalysisTable";
import ItemVoucherAnalysis, { type VoucherRow } from "./ItemVoucherAnalysis";

interface CategoryRow { category_id: number; category_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }
interface ItemRow { item_id: number; item_name: string; unit_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }

type Level =
  | { step: "categories" }
  | { step: "items"; category: CategoryRow }
  | { step: "vouchers"; category: CategoryRow; item: ItemRow };

const FooterBar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
    {children}
  </div>
);

export default function StockCategoryAnalysis() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  const [level, setLevel] = React.useState<Level>({ step: "categories" });

  // Level 1: categories
  const [categories, setCategories] = React.useState<CategoryRow[]>([]);
  const [loadingCats, setLoadingCats] = React.useState(true);
  const [catErr, setCatErr] = React.useState<string | null>(null);
  const [catIdx, setCatIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId || !fyId) { setLoadingCats(false); return; }
    setLoadingCats(true); setCatErr(null);
    (window as any).api.report.stockCategoryAnalysis(companyId, fyId).then((res: any) => {
      if (res.success) setCategories(res.categories ?? []);
      else setCatErr(res.error || "Failed to load");
      setLoadingCats(false);
    });
  }, [companyId, fyId]);

  // Level 2: items
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [itemErr, setItemErr] = React.useState<string | null>(null);
  const [itemIdx, setItemIdx] = React.useState(0);

  const loadItems = React.useCallback((category: CategoryRow) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "items", category });
    setLoadingItems(true); setItemErr(null); setItemIdx(0);
    (window as any).api.report.stockCategoryAnalysisItems(companyId, fyId, category.category_id).then((res: any) => {
      if (res.success) setItems(res.items ?? []);
      else setItemErr(res.error || "Failed to load items");
      setLoadingItems(false);
    });
  }, [companyId, fyId]);

  // Level 3: item voucher analysis
  const [vouchers, setVouchers] = React.useState<VoucherRow[]>([]);
  const [loadingVouchers, setLoadingVouchers] = React.useState(false);
  const [voucherErr, setVoucherErr] = React.useState<string | null>(null);
  const [voucherIdx, setVoucherIdx] = React.useState(0);

  const loadVouchers = React.useCallback((category: CategoryRow, item: ItemRow) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "vouchers", category, item });
    setLoadingVouchers(true); setVoucherErr(null); setVoucherIdx(0);
    (window as any).api.report.stockItemVouchers(companyId, fyId, item.item_id, activeFY?.start_date, activeFY?.end_date).then((res: any) => {
      if (res.success) setVouchers(res.rows ?? []);
      else setVoucherErr(res.error || "Failed to load vouchers");
      setLoadingVouchers(false);
    });
  }, [companyId, fyId, activeFY]);

  const backToCats  = React.useCallback(() => { setLevel({ step: "categories" }); setItems([]); }, []);
  const backToItems = React.useCallback((category: CategoryRow) => { setLevel({ step: "items", category }); setVouchers([]); }, []);

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (level.step === "categories") {
        if (e.key === "ArrowDown") { e.preventDefault(); setCatIdx(p => Math.min(categories.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setCatIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const c = categories[catIdx]; if (c) loadItems(c); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); navigate(-1); }
      } else if (level.step === "items") {
        if (e.key === "ArrowDown") { e.preventDefault(); setItemIdx(p => Math.min(items.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setItemIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const it = items[itemIdx]; if (it) loadVouchers(level.category, it); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToCats(); }
      } else {
        if (e.key === "ArrowDown") { e.preventDefault(); setVoucherIdx(p => Math.min(vouchers.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setVoucherIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const r = vouchers[voucherIdx]; if (r?.voucher_id) navigate(`/transactions/voucher/${r.voucher_id}`); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToItems(level.category); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, categories, catIdx, items, itemIdx, vouchers, voucherIdx, loadItems, loadVouchers, backToCats, backToItems, navigate]);

  if (level.step === "categories") {
    const rows: MovRow[] = categories.map(c => ({ id: c.category_id, name: c.category_name, leftQty: c.in_qty, leftValue: c.in_value, rightQty: c.out_qty, rightValue: c.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Category Analysis" companyName={selectedCompany?.name} subtitle="Movement Analysis — All Categories"
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingCats} error={catErr} emptyText="No stock categories found."
        selectedIndex={catIdx} onSelectIndex={setCatIdx}
        onActivate={(r, i) => loadItems(categories[i])}
        footer={<FooterBar><button onClick={() => navigate(-1)} className="hover:underline hover:text-zinc-900">Q: Quit</button><span className="text-zinc-400">Enter: Drill into category</span></FooterBar>}
      />
    );
  }

  if (level.step === "items") {
    const c = level.category;
    const rows: MovRow[] = items.map(it => ({ id: it.item_id, name: it.item_name, unit: it.unit_name, leftQty: it.in_qty, leftValue: it.in_value, rightQty: it.out_qty, rightValue: it.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Category Analysis" companyName={selectedCompany?.name} subtitle={`Category: ${c.category_name}`}
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingItems} error={itemErr} emptyText="No items in this category."
        selectedIndex={itemIdx} onSelectIndex={setItemIdx}
        onActivate={(r, i) => loadVouchers(c, items[i])}
        footer={<FooterBar><button onClick={backToCats} className="hover:underline hover:text-zinc-900">Q: Back to Categories</button><span className="text-zinc-400">Enter: Item voucher analysis</span></FooterBar>}
      />
    );
  }

  const { category: c, item: it } = level;
  return (
    <ItemVoucherAnalysis
      itemName={it.item_name} companyName={selectedCompany?.name} periodLabel={periodLabel}
      rows={vouchers} loading={loadingVouchers} error={voucherErr}
      selectedIndex={voucherIdx} onSelectIndex={setVoucherIdx}
      onOpenVoucher={(r) => r.voucher_id && navigate(`/transactions/voucher/${r.voucher_id}`)}
      footer={<FooterBar><button onClick={() => backToItems(c)} className="hover:underline hover:text-zinc-900">Q: Back to Items</button><span className="text-zinc-400">Enter: Open voucher</span></FooterBar>}
    />
  );
}
