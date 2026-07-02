import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";

// Issues #167–#177 — Sales / Purchase Order Outstandings.
// Flow: dimension sub-menu (Stock Group / Stock Category / Stock Item / Group /
// Ledger / All Orders) → optional entity SelectionPopup → outstanding order lines
// (balance qty = ordered − fulfilled) with drill to the order voucher.

type Mode = "sales" | "purchase";

interface Ref { id: number; name: string; }
interface Row {
  voucher_id: number | null;
  date: string; order_no: string; party_name: string;
  item_name: string; ordered_qty: number; balance_qty: number; rate: number; value: number;
}

interface Dim {
  key: string; label: string;
  // how to fetch the entity list; null => no selection (All Orders)
  fetch: ((companyId: number) => Promise<Ref[]>) | null;
  selectTitle?: string; fieldLabel?: string; listLabel?: string;
}

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dmy = (iso: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  return m ? `${Number(m[3])}-${MON[Number(m[2]) - 1]}-${m[1].slice(2)}` : (iso || "");
};
const fmtNum = (v: number | null | undefined) =>
  !v ? "" : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const fmtQty = (v: number | null | undefined) => {
  const n = Number(v) || 0;
  if (n === 0) return "";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
};
const api = () => (window as any).api;

const DIMS = (): Dim[] => [
  { key: "stock-group",    label: "Stock Group",    selectTitle: "Select Stock Group",    fieldLabel: "Name of Group",    listLabel: "List of Stock Groups",
    fetch: async (c) => (((await api().stockGroup.getAll(c)).stockGroups ?? []).map((g: any) => ({ id: g.sg_id, name: g.name }))) },
  { key: "stock-category", label: "Stock Category", selectTitle: "Select Stock Category", fieldLabel: "Name of Category", listLabel: "List of Stock Categories",
    fetch: async (c) => (((await api().stockCategory.getAll(c)).stockCategories ?? []).map((g: any) => ({ id: g.sc_id, name: g.name }))) },
  { key: "stock-item",     label: "Stock Item",     selectTitle: "Select Stock Item",     fieldLabel: "Name of Item",     listLabel: "List of Stock Items",
    fetch: async (c) => (((await api().stockItem.getAll(c)).stockItems ?? []).map((g: any) => ({ id: g.item_id, name: g.name }))) },
  { key: "group",          label: "Group",          selectTitle: "Select Group",          fieldLabel: "Name of Group",    listLabel: "List of Groups",
    fetch: async (c) => (((await api().group.getAll(c)).groups ?? []).map((g: any) => ({ id: g.group_id, name: g.name }))) },
  { key: "ledger",         label: "Ledger",         selectTitle: "Select Ledger",         fieldLabel: "Name of Ledger",   listLabel: "List of Ledgers",
    fetch: async (c) => (((await api().ledger.getAll(c)).ledgers ?? []).map((g: any) => ({ id: g.ledger_id, name: g.name }))) },
  { key: "all",            label: "All Orders",     fetch: null },
];

type Level =
  | { step: "menu" }
  | { step: "select"; dim: Dim }
  | { step: "report"; dim: Dim; selection: Ref | null };

export default function OrderOutstanding({ mode }: { mode: Mode }) {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;
  const periodLabel = activeFY ? `${dmy(activeFY.start_date)} to ${dmy(activeFY.end_date)}` : "";
  const heading = mode === "sales" ? "Sales Order Outstandings" : "Purchase Order Outstandings";
  const dims = React.useMemo(DIMS, []);

  const [level, setLevel] = React.useState<Level>({ step: "menu" });
  const [menuIdx, setMenuIdx] = React.useState(0);

  // Entity selection
  const [entities, setEntities] = React.useState<Ref[]>([]);
  const [entLoading, setEntLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selIdx, setSelIdx] = React.useState(0);

  const openDim = React.useCallback((dim: Dim) => {
    if (!dim.fetch) { setLevel({ step: "report", dim, selection: null }); return; }
    setLevel({ step: "select", dim }); setSearch(""); setSelIdx(0);
    setEntLoading(true); setEntities([]);
    dim.fetch(companyId!).then((list) => {
      setEntities(list.sort((a, b) => a.name.localeCompare(b.name)));
      setEntLoading(false);
    }).catch(() => setEntLoading(false));
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === "" ? entities : entities.filter(e => e.name.toLowerCase().includes(search.toLowerCase())),
    [entities, search]);
  React.useEffect(() => { setSelIdx(0); }, [search]);

  // Report data
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [rowIdx, setRowIdx] = React.useState(0);

  React.useEffect(() => {
    if (level.step !== "report" || !companyId || !fyId) return;
    setLoading(true); setErr(null); setRows([]); setRowIdx(0);
    api().report.orderOutstanding(companyId, fyId, mode, level.dim.key, level.selection?.id ?? null)
      .then((res: any) => {
        if (res?.success) setRows(res.rows ?? []);
        else setErr(res?.error ?? "Failed to load order outstandings.");
        setLoading(false);
      }).catch((e: any) => { setErr(e.message); setLoading(false); });
  }, [level, companyId, fyId, mode]);

  // Keyboard
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (level.step === "menu") {
        if (e.key === "ArrowDown") { e.preventDefault(); setMenuIdx(p => Math.min(dims.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setMenuIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); openDim(dims[menuIdx]); }
        else if (e.key === "Escape") { e.preventDefault(); navigate(-1); }
      } else if (level.step === "select") {
        if (e.key === "ArrowDown") { e.preventDefault(); setSelIdx(p => Math.min(filtered.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setSelIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const s = filtered[selIdx]; if (s) setLevel({ step: "report", dim: level.dim, selection: s }); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); setLevel({ step: "menu" }); }
      } else {
        if (e.key === "ArrowDown") { e.preventDefault(); setRowIdx(p => Math.min(rows.length - 1, p + 1)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setRowIdx(p => Math.max(0, p - 1)); }
        else if (e.key === "Enter") { e.preventDefault(); const r = rows[rowIdx]; if (r?.voucher_id) navigate(`/transactions/voucher/${r.voucher_id}`); }
        else if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); setLevel(level.dim.fetch ? { step: "select", dim: level.dim } : { step: "menu" }); }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level, dims, menuIdx, filtered, selIdx, rows, rowIdx, openDim, navigate]);

  const TitleBar = ({ title }: { title: string }) => (
    <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
      <span className="font-bold text-sm tracking-wide">{title}</span>
      <span className="font-bold text-sm">{selectedCompany?.name ?? ""}</span>
      <span />
    </div>
  );

  // ── Dimension sub-menu ───────────────────────────────────────────────────
  if (level.step === "menu") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <TitleBar title={heading} />
        <div className="max-w-sm mx-auto mt-10 w-full flex flex-col gap-0.5 px-4">
          <div className="text-[11px] italic text-zinc-500 flex flex-wrap gap-1 mb-1">
            <button onClick={() => navigate("/")} className="hover:underline hover:text-zinc-900">Gateway of Tally</button>
            <span>&gt;</span>
            <button onClick={() => navigate("/reports/statements-of-inventory")} className="hover:underline hover:text-zinc-900">Statements of Inventory</button>
          </div>
          <div className="text-base font-semibold mb-1">{heading}</div>
          {dims.map((d, i) => (
            <button key={d.key}
              onClick={() => openDim(d)}
              onMouseEnter={() => setMenuIdx(i)}
              className={`text-left px-2 h-7 text-[12px] ${i === menuIdx ? "bg-[#e4e4e7] font-bold" : "hover:bg-zinc-50"}`}>
              {d.label}
            </button>
          ))}
          <button onClick={() => navigate(-1)} className="text-left px-2 h-7 mt-2 text-[12px] font-semibold">Quit</button>
        </div>
      </div>
    );
  }

  // ── Entity selection popup ───────────────────────────────────────────────
  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <TitleBar title={heading} />
        <SelectionPopup
          title={level.dim.selectTitle!} fieldLabel={level.dim.fieldLabel!} listLabel={level.dim.listLabel!}
          companyName={selectedCompany?.name}
          items={filtered.map(e => ({ id: e.id, name: e.name }))}
          index={selIdx} loading={entLoading} search={search}
          onSearchChange={setSearch} onIndexChange={setSelIdx}
          onAccept={(i) => { const s = filtered[i]; if (s) setLevel({ step: "report", dim: level.dim, selection: s }); }}
          onCancel={() => setLevel({ step: "menu" })}
        />
      </div>
    );
  }

  // ── Report ───────────────────────────────────────────────────────────────
  const totals = rows.reduce((a, r) => ({ ordered: a.ordered + r.ordered_qty, balance: a.balance + r.balance_qty, value: a.value + r.value }), { ordered: 0, balance: 0, value: 0 });
  const subtitle = level.selection ? `${level.dim.label}: ${level.selection.name}` : "All Orders";
  const TH = "px-2 py-1 font-bold text-[10px] bg-zinc-100 border-b border-zinc-300";
  const back = () => setLevel(level.dim.fetch ? { step: "select", dim: level.dim } : { step: "menu" });

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
      <TitleBar title={heading} />
      <div className="flex justify-between items-center px-3 py-1.5 bg-white border-b border-zinc-300 font-mono text-[11px]">
        <span className="font-semibold">{heading} Outstanding — {subtitle}</span>
        <span>{periodLabel}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`${TH} text-left`}>Date</th>
              <th className={`${TH} text-left`}>Order Number</th>
              <th className={`${TH} text-left`}>Name of Item</th>
              <th className={`${TH} text-right w-28`}>Ordered Qty</th>
              <th className={`${TH} text-right w-28`}>Balance Qty</th>
              <th className={`${TH} text-right w-24`}>Rate</th>
              <th className={`${TH} text-right w-28`}>Value</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">Loading…</td></tr>
            ) : err ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-600">{err}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-zinc-400 italic">No outstanding orders.</td></tr>
            ) : rows.map((r, i) => (
              <React.Fragment key={i}>
                <tr onClick={() => setRowIdx(i)}
                  onDoubleClick={() => r.voucher_id && navigate(`/transactions/voucher/${r.voucher_id}`)}
                  className={`border-b border-zinc-100 cursor-pointer ${i === rowIdx ? "bg-[#e4e4e7] font-bold" : "hover:bg-zinc-50"}`}>
                  <td className="px-2 py-1 whitespace-nowrap">{dmy(r.date)}</td>
                  <td className="px-2 py-1">{r.order_no}</td>
                  <td className="px-2 py-1">{r.item_name}</td>
                  <td className="px-2 py-1 text-right w-28">{fmtQty(r.ordered_qty)}</td>
                  <td className="px-2 py-1 text-right w-28">{fmtQty(r.balance_qty)}</td>
                  <td className="px-2 py-1 text-right w-24">{fmtNum(r.rate)}</td>
                  <td className="px-2 py-1 text-right w-28">{fmtNum(r.value)}</td>
                </tr>
                <tr className={i === rowIdx ? "bg-[#e4e4e7]" : ""}>
                  <td /><td colSpan={6} className="px-2 pb-1 italic text-zinc-500">To: {r.party_name || "—"}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grand-total row — fixed widths mirror the numeric columns so it aligns */}
      <div className="border-t-2 border-zinc-300 bg-[#f4f4f5] px-2 py-1.5 flex font-mono text-[11px] font-bold shrink-0">
        <span className="flex-1 pl-2">Grand Total</span>
        <span className="w-28 text-right">{fmtQty(totals.ordered)}</span>
        <span className="w-28 text-right">{fmtQty(totals.balance)}</span>
        <span className="w-24" />
        <span className="w-28 text-right">{fmtNum(totals.value)}</span>
      </div>

      <div className="flex items-center gap-6 px-3 py-1 border-t border-zinc-300 bg-white text-[10px] font-semibold text-zinc-600 shrink-0">
        <button onClick={back} className="hover:text-zinc-900">Q: Back</button>
        <span className="text-zinc-400">Enter: Open order voucher</span>
      </div>
    </div>
  );
}
