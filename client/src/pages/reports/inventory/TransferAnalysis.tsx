import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";
import MovementAnalysisTable, { type MovRow } from "./MovementAnalysisTable";

interface VoucherType { vt_id: number; name: string; parent_name?: string; }
interface ItemRow {
  item_id: number; item_name: string; unit_name: string;
  in_qty: number; in_value: number;
  out_qty: number; out_value: number;
}

type Level =
  | { step: "select" }
  | { step: "report"; voucherType: string };

export default function TransferAnalysis() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "";

  const [level, setLevel] = React.useState<Level>({ step: "select" });

  // Voucher types (Stock Journal class) for selection
  const [types, setTypes] = React.useState<VoucherType[]>([]);
  const [typesLoading, setTypesLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [selectIdx, setSelectIdx] = React.useState(0);

  React.useEffect(() => {
    if (!companyId) { setTypesLoading(false); return; }
    setTypesLoading(true);
    (window as any).api.voucherType.getAll(companyId).then((res: any) => {
      const all: VoucherType[] = res.voucherTypes ?? [];
      // Transfer Analysis covers Stock Journal–class voucher types only.
      const list = all.filter(t => t.name === "Stock Journal" || t.parent_name === "Stock Journal");
      list.sort((a, b) => a.name.localeCompare(b.name));
      setTypes(list);
      setTypesLoading(false);
    });
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === "" ? types : types.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [types, search]
  );
  React.useEffect(() => { setSelectIdx(0); }, [search]);

  // Report
  const [items, setItems] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [rowIdx, setRowIdx] = React.useState(0);

  const loadReport = React.useCallback((voucherType: string) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "report", voucherType });
    setLoading(true); setErr(null); setRowIdx(0);
    (window as any).api.report.transferAnalysis(companyId, fyId, voucherType).then((res: any) => {
      if (res.success) setItems(res.items ?? []);
      else setErr(res.error || "Failed to load");
      setLoading(false);
    });
  }, [companyId, fyId]);

  const backToSelect = React.useCallback(() => { setLevel({ step: "select" }); setItems([]); setSearch(""); }, []);

  // Keyboard nav — selection popup
  React.useEffect(() => {
    if (level.step !== "select") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectIdx(p => Math.min(filtered.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setSelectIdx(p => Math.max(0, p - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); const t = filtered[selectIdx]; if (t) loadReport(t.name); }
      else if (e.key === "Escape") { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level.step, filtered, selectIdx, loadReport, navigate]);

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

  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Transfer Analysis</span>
          <span className="font-bold text-sm">{selectedCompany?.name || "Company"}</span>
          <span />
        </div>
        <SelectionPopup
          title="Transfer Analysis" fieldLabel="Name of Voucher" listLabel="List of Voucher Types"
          companyName={selectedCompany?.name}
          items={filtered.map(t => ({ id: t.vt_id, name: t.name }))}
          index={selectIdx} loading={typesLoading} search={search}
          emptyText="No Stock Journal voucher types found."
          onSearchChange={setSearch} onIndexChange={setSelectIdx}
          onAccept={(i) => { const t = filtered[i]; if (t) loadReport(t.name); }}
          onCancel={() => navigate(-1)}
        />
      </div>
    );
  }

  const rows: MovRow[] = items.map(it => ({ id: it.item_id, name: it.item_name, unit: it.unit_name, leftQty: it.in_qty, leftValue: it.in_value, rightQty: it.out_qty, rightValue: it.out_value }));
  return (
    <MovementAnalysisTable
      title="Transfer Analysis" companyName={selectedCompany?.name} subtitle={level.voucherType}
      periodLabel={periodLabel} leftLabel="Goods In (Production)" rightLabel="Goods Out (Consumption)" rows={rows}
      loading={loading} error={err} emptyText="No transfers found for this voucher type."
      selectedIndex={rowIdx} onSelectIndex={setRowIdx}
      footer={
        <div className="flex items-center gap-4 px-3 py-1 border-t border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-600 shrink-0">
          <button onClick={backToSelect} className="hover:underline hover:text-zinc-900">Q: Back to Voucher Type Selection</button>
        </div>
      }
    />
  );
}
