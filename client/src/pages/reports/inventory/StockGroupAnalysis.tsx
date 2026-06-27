import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";
import MovementAnalysisTable, { type MovRow } from "./MovementAnalysisTable";
import ItemVoucherAnalysis, { type VoucherRow } from "./ItemVoucherAnalysis";

interface GroupRow { group_id: number; group_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }
interface ItemRow { item_id: number; item_name: string; unit_name: string; in_qty: number; in_value: number; out_qty: number; out_value: number; }
interface GroupRef { group_id: number; group_name: string; }

const PRIMARY_ID = -1; // sentinel: "Primary" => analyse all stock groups

type Origin = "groups" | "select";
type Level =
  | { step: "select" }
  | { step: "groups" }
  | { step: "items"; group: GroupRef; from: Origin }
  | { step: "vouchers"; group: GroupRef; item: ItemRow; from: Origin };

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

  const [level, setLevel] = React.useState<Level>({ step: "select" });

  // ── Selection popup: Primary + all stock groups ──────────────────────────
  const [groupList, setGroupList] = React.useState<GroupRef[]>([]);
  const [groupListLoading, setGroupListLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectIdx, setSelectIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId) { setGroupListLoading(false); return; }
    setGroupListLoading(true);
    (window as any).api.stockGroup.getAll(companyId).then((res: any) => {
      const list: GroupRef[] = [...(res.stockGroups ?? [])]
        .map((g: any) => ({ group_id: g.sg_id, group_name: g.name }))
        .sort((a: GroupRef, b: GroupRef) => a.group_name.localeCompare(b.group_name));
      setGroupList([{ group_id: PRIMARY_ID, group_name: "Primary" }, ...list]);
      setGroupListLoading(false);
    });
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === "" ? groupList : groupList.filter(g => g.group_name.toLowerCase().includes(search.toLowerCase())),
    [groupList, search]
  );
  React.useEffect(() => { setSelectIdx(0); }, [search]);

  // ── Level: all groups ────────────────────────────────────────────────────
  const [groups, setGroups] = React.useState<GroupRow[]>([]);
  const [loadingGroups, setLoadingGroups] = React.useState(false);
  const [groupErr, setGroupErr] = React.useState<string | null>(null);
  const [groupIdx, setGroupIdx] = React.useState(0);

  const loadGroups = React.useCallback(() => {
    if (!companyId || !fyId) return;
    setLevel({ step: "groups" });
    setLoadingGroups(true); setGroupErr(null); setGroupIdx(0);
    (window as any).api.report.stockGroupAnalysis(companyId, fyId).then((res: any) => {
      if (res.success) setGroups(res.groups ?? []);
      else setGroupErr(res.error || "Failed to load");
      setLoadingGroups(false);
    });
  }, [companyId, fyId]);

  // ── Level: items in a group ──────────────────────────────────────────────
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);
  const [itemErr, setItemErr] = React.useState<string | null>(null);
  const [itemIdx, setItemIdx] = React.useState(0);

  const loadItems = React.useCallback((group: GroupRef, from: Origin) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "items", group, from });
    setLoadingItems(true); setItemErr(null); setItemIdx(0);
    (window as any).api.report.stockGroupAnalysisItems(companyId, fyId, group.group_id).then((res: any) => {
      if (res.success) setItems(res.items ?? []);
      else setItemErr(res.error || "Failed to load items");
      setLoadingItems(false);
    });
  }, [companyId, fyId]);

  // ── Level: item voucher analysis ─────────────────────────────────────────
  const [vouchers, setVouchers] = React.useState<VoucherRow[]>([]);
  const [loadingVouchers, setLoadingVouchers] = React.useState(false);
  const [voucherErr, setVoucherErr] = React.useState<string | null>(null);
  const [voucherIdx, setVoucherIdx] = React.useState(0);

  const loadVouchers = React.useCallback((group: GroupRef, item: ItemRow, from: Origin) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "vouchers", group, item, from });
    setLoadingVouchers(true); setVoucherErr(null); setVoucherIdx(0);
    (window as any).api.report.stockItemVouchers(companyId, fyId, item.item_id, activeFY?.start_date, activeFY?.end_date).then((res: any) => {
      if (res.success) setVouchers(res.rows ?? []);
      else setVoucherErr(res.error || "Failed to load vouchers");
      setLoadingVouchers(false);
    });
  }, [companyId, fyId, activeFY]);

  const acceptGroup = React.useCallback((g: GroupRef) => {
    if (g.group_id === PRIMARY_ID) loadGroups();
    else loadItems(g, "select");
  }, [loadGroups, loadItems]);

  const backToSelect = React.useCallback(() => { setLevel({ step: "select" }); setGroups([]); setItems([]); setSearch(""); }, []);
  const backToGroups = React.useCallback(() => { setLevel({ step: "groups" }); setItems([]); }, []);

  // Keyboard nav
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (level.step === "select") {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectIdx(p => Math.min(filtered.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setSelectIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const g = filtered[selectIdx]; if (g) acceptGroup(g); }
        else if (e.key === "Escape") { e.preventDefault(); navigate(-1); }
      } else if (level.step === "groups") {
        if (e.key === "ArrowDown") { e.preventDefault(); setGroupIdx(p => Math.min(groups.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setGroupIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const g = groups[groupIdx]; if (g) loadItems({ group_id: g.group_id, group_name: g.group_name }, "groups"); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); backToSelect(); }
      } else if (level.step === "items") {
        if (e.key === "ArrowDown") { e.preventDefault(); setItemIdx(p => Math.min(items.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setItemIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const it = items[itemIdx]; if (it) loadVouchers(level.group, it, level.from); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); level.from === "groups" ? backToGroups() : backToSelect(); }
      } else {
        if (e.key === "ArrowDown") { e.preventDefault(); setVoucherIdx(p => Math.min(vouchers.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setVoucherIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const r = vouchers[voucherIdx]; if (r?.voucher_id) navigate(`/transactions/voucher/${r.voucher_id}`); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); loadItems(level.group, level.from); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, filtered, selectIdx, groups, groupIdx, items, itemIdx, vouchers, voucherIdx, acceptGroup, loadItems, loadVouchers, backToSelect, backToGroups, navigate]);

  // ── Select Stock Group ───────────────────────────────────────────────────
  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Stock Group Analysis</span>
          <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
          <span />
        </div>
        <SelectionPopup
          title="Select Stock Group" fieldLabel="Name of Group" listLabel="List of Stock Groups"
          companyName={selectedCompany?.name}
          items={filtered.map(g => ({ id: g.group_id, name: g.group_name }))}
          index={selectIdx} loading={groupListLoading} search={search}
          onSearchChange={setSearch} onIndexChange={setSelectIdx}
          onAccept={(i) => { const g = filtered[i]; if (g) acceptGroup(g); }}
          onCancel={() => navigate(-1)}
          onCreate={() => navigate("/master/create/stock-group")}
        />
      </div>
    );
  }

  // ── All groups ───────────────────────────────────────────────────────────
  if (level.step === "groups") {
    const rows: MovRow[] = groups.map(g => ({ id: g.group_id, name: g.group_name, leftQty: g.in_qty, leftValue: g.in_value, rightQty: g.out_qty, rightValue: g.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Group Analysis" companyName={selectedCompany?.name} subtitle="Primary — All Groups"
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingGroups} error={groupErr} emptyText="No stock groups found."
        selectedIndex={groupIdx} onSelectIndex={setGroupIdx}
        onActivate={(_r, i) => loadItems({ group_id: groups[i].group_id, group_name: groups[i].group_name }, "groups")}
        footer={<FooterBar><button onClick={backToSelect} className="hover:underline hover:text-zinc-900">Q: Back to Group Selection</button><span className="text-zinc-400">Enter: Drill into group</span></FooterBar>}
      />
    );
  }

  // ── Items in group ───────────────────────────────────────────────────────
  if (level.step === "items") {
    const g = level.group;
    const rows: MovRow[] = items.map(it => ({ id: it.item_id, name: it.item_name, unit: it.unit_name, leftQty: it.in_qty, leftValue: it.in_value, rightQty: it.out_qty, rightValue: it.out_value }));
    return (
      <MovementAnalysisTable
        title="Stock Group Analysis" companyName={selectedCompany?.name} subtitle={`Group: ${g.group_name}`}
        periodLabel={periodLabel} leftLabel="Inward" rightLabel="Outward" rows={rows}
        loading={loadingItems} error={itemErr} emptyText="No items in this group."
        selectedIndex={itemIdx} onSelectIndex={setItemIdx}
        onActivate={(_r, i) => loadVouchers(g, items[i], level.from)}
        footer={<FooterBar><button onClick={() => level.from === "groups" ? backToGroups() : backToSelect()} className="hover:underline hover:text-zinc-900">Q: Back</button><span className="text-zinc-400">Enter: Item voucher analysis</span></FooterBar>}
      />
    );
  }

  const { group: g, item: it, from } = level;
  return (
    <ItemVoucherAnalysis
      itemName={it.item_name} companyName={selectedCompany?.name} periodLabel={periodLabel}
      rows={vouchers} loading={loadingVouchers} error={voucherErr}
      selectedIndex={voucherIdx} onSelectIndex={setVoucherIdx}
      onOpenVoucher={(r) => r.voucher_id && navigate(`/transactions/voucher/${r.voucher_id}`)}
      footer={<FooterBar><button onClick={() => loadItems(g, from)} className="hover:underline hover:text-zinc-900">Q: Back to Items</button><span className="text-zinc-400">Enter: Open voucher</span></FooterBar>}
    />
  );
}
