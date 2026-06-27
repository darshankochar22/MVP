import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import MovementAnalysisTable, { type MovRow } from "./MovementAnalysisTable";
import ItemVoucherAnalysis, { type VoucherRow } from "./ItemVoucherAnalysis";

interface GroupRow { group_id: number; group_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }
interface ItemRow { item_id: number; item_name: string; unit_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }

type Level =
  | { step: "groups" }
  | { step: "items"; group: GroupRow }
  | { step: "vouchers"; group: GroupRow; item: ItemRow };

const FooterBar = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
    {children}
  </div>
);

export default function StockGroupAnalysis() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  const [level, setLevel] = React.useState<Level>({ step: "groups" });

  // Level 1: groups
  const [groups, setGroups] = React.useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = React.useState(true);
  const [groupErr, setGroupErr] = React.useState<string | null>(null);
  const [groupIdx, setGroupIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId || !fyId) { setLoadingGroups(false); return; }
    setLoadingGroups(true); setGroupErr(null);
    (window as any).api.report.stockGroupAnalysis(companyId, fyId).then((res: any) => {
      if (res.success) setGroups(res.groups ?? []);
      else setGroupErr(res.error || "Failed to load");
      setLoadingGroups(false);
    });
  }, [companyId, fyId]);

  // Level 2: items
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [itemErr, setItemErr] = React.useState<string | null>(null);
  const [itemIdx, setItemIdx] = React.useState(0);

  const loadItems = React.useCallback((group: GroupRow) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "items", group });
    setLoadingItems(true); setItemErr(null); setItemIdx(0);
    (window as any).api.report.stockGroupAnalysisItems(companyId, fyId, group.group_id).then((res: any) => {
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

  const loadVouchers = React.useCallback((group: GroupRow, item: ItemRow) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "vouchers", group, item });
    setLoadingVouchers(true); setVoucherErr(null); setVoucherIdx(0);
    (window as any).api.report.stockItemVouchers(companyId, fyId, item.item_id, activeFY?.start_date, activeFY?.end_date).then((res: any) => {
      if (res.success) setVouchers(res.rows ?? []);
      else setVoucherErr(res.error || "Failed to load vouchers");
      setLoadingVouchers(false);
    });
  }, [companyId, fyId, activeFY]);

  const backToGroups = React.useCallback(() => { setLevel({ step: "groups" }); setItems([]); }, []);
  const backToItems  = React.useCallback((group: GroupRow) => { setLevel({ step: "items", group }); setVouchers([]); }, []);

  // Keyboard nav
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (level.step === "groups") {
        if (e.key === "ArrowDown") { e.preventDefault(); setGroupIdx(p => Math.min(groups.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setGroupIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const g = groups[groupIdx]; if (g) loadItems(g); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); navigate(-1); }
      } else if (level.step === "items") {
        if (e.key === "ArrowDown") { e.preventDefault(); setItemIdx(p => Math.min(items.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setItemIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const it = items[itemIdx]; if (it) loadVouchers(level.group, it); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToGroups(); }
      } else {
        if (e.key === "ArrowDown") { e.preventDefault(); setVoucherIdx(p => Math.min(vouchers.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setVoucherIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const r = vouchers[voucherIdx]; if (r?.voucher_id) navigate(`/transactions/voucher/${r.voucher_id}`); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToItems(level.group); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, groups, groupIdx, items, itemIdx, vouchers, voucherIdx, loadItems, loadVouchers, backToGroups, backToItems, navigate]);

  if (level.step === "groups") {
    const rows: MovRow[] = groups.map(g => ({ id: g.group_id, name: g.group_name, leftQty: g.in_qty, leftValue: g.in_value, rightQty: g.out_qty, rightValue: g.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Group Analysis" companyName={selectedCompany?.name} subtitle="Movement Analysis — All Groups"
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingGroups} error={groupErr} emptyText="No stock groups found."
        selectedIndex={groupIdx} onSelectIndex={setGroupIdx}
        onActivate={(r, i) => loadItems(groups[i])}
        footer={<FooterBar><button onClick={() => navigate(-1)} className="hover:underline hover:text-zinc-900">Q: Quit</button><span className="text-zinc-400">Enter: Drill into group</span></FooterBar>}
      />
    );
  }

  if (level.step === "items") {
    const g = level.group;
    const rows: MovRow[] = items.map(it => ({ id: it.item_id, name: it.item_name, unit: it.unit_name, leftQty: it.in_qty, leftValue: it.in_value, rightQty: it.out_qty, rightValue: it.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Group Analysis" companyName={selectedCompany?.name} subtitle={`Group: ${g.group_name}`}
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingItems} error={itemErr} emptyText="No items in this group."
        selectedIndex={itemIdx} onSelectIndex={setItemIdx}
        onActivate={(r, i) => loadVouchers(g, items[i])}
        footer={<FooterBar><button onClick={backToGroups} className="hover:underline hover:text-zinc-900">Q: Back to Groups</button><span className="text-zinc-400">Enter: Item voucher analysis</span></FooterBar>}
      />
    );
  }

  const { group: g, item: it } = level;
  return (
    <ItemVoucherAnalysis
      itemName={it.item_name} companyName={selectedCompany?.name} periodLabel={periodLabel}
      rows={vouchers} loading={loadingVouchers} error={voucherErr}
      selectedIndex={voucherIdx} onSelectIndex={setVoucherIdx}
      onOpenVoucher={(r) => r.voucher_id && navigate(`/transactions/voucher/${r.voucher_id}`)}
      footer={<FooterBar><button onClick={() => backToItems(g)} className="hover:underline hover:text-zinc-900">Q: Back to Items</button><span className="text-zinc-400">Enter: Open voucher</span></FooterBar>}
    />
  );
}
