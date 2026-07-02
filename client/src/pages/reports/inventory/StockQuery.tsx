import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import SelectionPopup from "./SelectionPopup";

// Issue #107 — Stock Query detail screen.
// Flow: SelectionPopup → full-detail card view for a single stock item
// Shows: Properties, Last Purchases, Last Sales, Godown/Batch, Category Items

interface StockItem { item_id: number; name: string; }

interface QueryResult {
  item: {
    name: string; group_name: string; category_name: string; unit_name: string;
    closing_qty: number; closing_value: number; last_sale_rate: number | null;
  };
  purchases: TxRow[];
  sales:     TxRow[];
  godownDetails: GodownRow[];
  categoryItems: CatItemRow[];
}

interface TxRow {
  voucher_id: number | null;
  date: string; party_name: string;
  quantity: number; rate: number; disc_amount: number | null; amount: number;
}
interface GodownRow { godown_id: number | null; godown_name: string; batch: string; qty: number; }
interface CatItemRow { item_id: number; item_name: string; closing_qty: number; closing_value: number; last_sale_rate: number; }

const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dmy = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])}-${MON[Number(m[2]) - 1]}-${m[1].slice(2)}` : iso;
};
const fmtNum = (v: number | null | undefined) =>
  !v ? "" : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const fmtQty = (v: number | null | undefined, unit?: string) => {
  const n = Number(v) || 0;
  if (n === 0) return "";
  const s = n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return unit ? `${s} ${unit}` : s;
};

const fmtDisc = (disc: number | null | undefined, rate: number, qty: number) => {
  const gross = (rate || 0) * (qty || 0);
  if (!disc || gross <= 0) return "";
  return `${((disc / gross) * 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
};

const TH = "px-2 py-1 text-left font-bold text-[10px] bg-zinc-100 border-b border-zinc-300";
const TD = "px-2 py-1 text-[11px] border-b border-zinc-100";
const TDR = `${TD} text-right`;

/** Purchases / Sales panel — summary line, table with Disc%, click-to-drill to voucher. */
function TxPanel({ title, verb, rows, unit, onOpen }: {
  title: string; verb: string; rows: TxRow[]; unit?: string;
  onOpen: (voucherId: number) => void;
}) {
  const last = rows[0];
  return (
    <div className="flex-1 min-w-0">
      <div className="font-bold text-[11px] border-b-2 border-zinc-900 pb-0.5 mb-1 uppercase tracking-wide">
        {title}
      </div>
      <div className="text-[10px] text-zinc-500 font-mono mb-1">
        {last
          ? `Last ${verb} on: ${dmy(last.date)} · ${last.party_name || "—"} · ${fmtQty(last.quantity, unit)} @ ${fmtNum(last.rate)}`
          : `Last ${verb} on: —`}
      </div>
      <table className="w-full border-collapse text-[11px] font-mono">
        <thead>
          <tr>
            <th className={TH}>Date</th>
            <th className={TH}>Party</th>
            <th className={`${TH} text-right`}>Qty</th>
            <th className={`${TH} text-right`}>Rate</th>
            <th className={`${TH} text-right`}>Disc %</th>
            <th className={`${TH} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-2 py-2 text-zinc-400 italic">No {title.toLowerCase()}</td></tr>
          ) : rows.map((r, i) => (
            <tr
              key={i}
              onDoubleClick={() => r.voucher_id && onOpen(r.voucher_id)}
              className={`hover:bg-zinc-100 ${r.voucher_id ? "cursor-pointer" : ""}`}
              title={r.voucher_id ? "Double-click: open voucher" : undefined}
            >
              <td className={TD}>{dmy(r.date)}</td>
              <td className={`${TD} truncate max-w-[120px]`}>{r.party_name || "—"}</td>
              <td className={TDR}>{fmtQty(r.quantity, unit)}</td>
              <td className={TDR}>{fmtNum(r.rate)}</td>
              <td className={TDR}>{fmtDisc(r.disc_amount, r.rate, r.quantity)}</td>
              <td className={TDR}>{fmtNum(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Level = { step: "select" } | { step: "detail"; item: StockItem };

export default function StockQuery() {
  const navigate  = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const companyId = selectedCompany?.company_id;
  const fyId      = activeFY?.fy_id;

  const [level, setLevel] = React.useState<Level>({ step: "select" });

  // ── Selection popup state ──────────────────────────────────────────────
  const [allItems,    setAllItems]    = React.useState<StockItem[]>([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [search,      setSearch]      = React.useState("");
  const [selectIdx,   setSelectIdx]   = React.useState(0);

  React.useEffect(() => {
    if (!companyId) { setListLoading(false); return; }
    (window as any).api.stockItem.getAll(companyId).then((res: any) => {
      const list: StockItem[] = ((res.stockItems ?? []) as any[])
        .map(r => ({ item_id: r.item_id, name: r.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAllItems(list);
      setListLoading(false);
    });
  }, [companyId]);

  const filtered = React.useMemo(() =>
    search.trim() === ""
      ? allItems
      : allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())),
    [allItems, search]
  );
  React.useEffect(() => { setSelectIdx(0); }, [search]);

  // ── Query detail state ─────────────────────────────────────────────────
  const [data,    setData]    = React.useState<QueryResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err,     setErr]     = React.useState<string | null>(null);

  const openDetail = React.useCallback((item: StockItem) => {
    if (!companyId || !fyId) return;
    setLevel({ step: "detail", item });
    setData(null);
    setLoading(true);
    setErr(null);
    (window as any).api.report
      .stockQuery(companyId, fyId, item.item_id)
      .then((res: any) => {
        if (res?.success) setData(res);
        else setErr(res?.error ?? "Failed to load stock query.");
        setLoading(false);
      })
      .catch((e: any) => { setErr(e.message); setLoading(false); });
  }, [companyId, fyId]);

  // ── Keyboard — selection ───────────────────────────────────────────────
  React.useEffect(() => {
    if (level.step !== "select") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown")  { e.preventDefault(); setSelectIdx(p => Math.min(filtered.length - 1, p + 1)); }
      else if (e.key === "ArrowUp")   { e.preventDefault(); setSelectIdx(p => Math.max(0, p - 1)); }
      else if (e.key === "Enter")     { e.preventDefault(); const it = filtered[selectIdx]; if (it) openDetail(it); }
      else if (e.key === "Escape")    { e.preventDefault(); navigate(-1); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level.step, filtered, selectIdx, openDetail, navigate]);

  // ── Keyboard — detail ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (level.step !== "detail") return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        setLevel({ step: "select" });
        setData(null);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [level.step]);

  // ── Render — selection popup ───────────────────────────────────────────
  if (level.step === "select") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
        <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
          <span className="font-bold text-sm tracking-wide">Stock Query</span>
          <span className="font-bold text-sm">{selectedCompany?.name ?? ""}</span>
          <span />
        </div>
        <SelectionPopup
          title="Select Stock Item"
          fieldLabel="Name of Item"
          listLabel="List of Stock Items"
          companyName={selectedCompany?.name}
          items={filtered.map(i => ({ id: i.item_id, name: i.name }))}
          index={selectIdx}
          loading={listLoading}
          search={search}
          onSearchChange={setSearch}
          onIndexChange={setSelectIdx}
          onAccept={(i) => { const it = filtered[i]; if (it) openDetail(it); }}
          onCancel={() => navigate(-1)}
          onCreate={() => navigate("/master/create/stock-item")}
        />
      </div>
    );
  }

  // ── Render — detail card view ──────────────────────────────────────────
  const it = data?.item;
  const unit = it?.unit_name;

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none text-zinc-900 font-sans text-[11px]">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white border-b-2 border-zinc-900">
        <span className="font-bold text-sm tracking-wide">Stock Query</span>
        <span className="font-bold text-sm">{selectedCompany?.name ?? ""}</span>
        <span />
      </div>

      {/* Item name subtitle */}
      <div className="flex justify-between items-center px-3 py-1.5 bg-white border-b border-zinc-300 font-mono text-[11px]">
        <span className="font-semibold">Stock Item: {level.item.name}</span>
        <span className="text-zinc-500 italic">Esc: Back to Selection</span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {loading ? (
          <div className="py-8 text-center text-zinc-400 italic">Loading…</div>
        ) : err ? (
          <div className="py-8 text-center text-zinc-600">{err}</div>
        ) : !data ? null : (
          <>
            {/* ── Properties ── */}
            <section>
              <div className="font-bold text-[11px] border-b-2 border-zinc-900 pb-0.5 mb-1 uppercase tracking-wide">
                Item Properties
              </div>
              <table className="border-collapse w-auto text-[11px] font-mono">
                <tbody>
                  {[
                    ["Stock Group",   it?.group_name    ?? "—"],
                    ["Category",      it?.category_name ?? "Not Applicable"],
                    ["Base Unit",     it?.unit_name     ?? "—"],
                    ["Closing Qty",   fmtQty(it?.closing_qty, unit) || "0"],
                    ["Closing Value", fmtNum(it?.closing_value) || "0.00"],
                    ["Last Sale Rate",it?.last_sale_rate != null ? fmtNum(it.last_sale_rate) : "—"],
                  ].map(([label, val]) => (
                    <tr key={label} className="border-b border-zinc-100">
                      <td className="pr-8 py-0.5 text-zinc-500 font-semibold">{label}</td>
                      <td className="py-0.5 font-mono font-semibold text-zinc-900">{val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* ── Last 10 Purchases & Sales — side by side, click row → voucher ── */}
            <section className="flex gap-4">
              <TxPanel title="Last Purchases" verb="purchased" rows={data.purchases} unit={unit}
                onOpen={(id) => navigate(`/transactions/voucher/${id}`)} />
              <TxPanel title="Last Sales" verb="sold" rows={data.sales} unit={unit}
                onOpen={(id) => navigate(`/transactions/voucher/${id}`)} />
            </section>

            {/* ── Godown / Batch details ── */}
            {data.godownDetails.length > 0 && (
              <section>
                <div className="font-bold text-[11px] border-b-2 border-zinc-900 pb-0.5 mb-1 uppercase tracking-wide">
                  Godown / Batch Details
                </div>
                <table className="w-full border-collapse text-[11px] font-mono">
                  <thead>
                    <tr>
                      <th className={TH}>Godown</th>
                      <th className={TH}>Batch</th>
                      <th className={`${TH} text-right`}>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.godownDetails.map((r, i) => (
                      <tr key={i} className="hover:bg-zinc-50 border-b border-zinc-100">
                        <td className={TD}>{r.godown_name || "Main Location"}</td>
                        <td className={TD}>{r.batch || "—"}</td>
                        <td className={TDR}>{fmtQty(r.qty, unit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* ── Category Items ── */}
            {data.categoryItems.length > 1 && (
              <section>
                <div className="font-bold text-[11px] border-b-2 border-zinc-900 pb-0.5 mb-1 uppercase tracking-wide">
                  Other Items in Category ({it?.category_name})
                </div>
                <table className="w-full border-collapse text-[11px] font-mono">
                  <thead>
                    <tr>
                      <th className={TH}>Item Name</th>
                      <th className={`${TH} text-right`}>Closing Qty</th>
                      <th className={`${TH} text-right`}>Closing Value</th>
                      <th className={`${TH} text-right`}>Last Sale Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categoryItems
                      .filter(r => r.item_id !== level.item.item_id)
                      .map((r, i) => (
                        <tr key={i} className="hover:bg-zinc-50 border-b border-zinc-100">
                          <td className={TD}>{r.item_name}</td>
                          <td className={TDR}>{fmtQty(r.closing_qty, unit)}</td>
                          <td className={TDR}>{fmtNum(r.closing_value)}</td>
                          <td className={TDR}>{r.last_sale_rate ? fmtNum(r.last_sale_rate) : "—"}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-6 px-3 py-1 border-t border-zinc-300 bg-white text-[10px] font-semibold text-zinc-600 shrink-0">
        <button
          onClick={() => { setLevel({ step: "select" }); setData(null); }}
          className="hover:text-zinc-900"
        >
          Q: Quit
        </button>
        <span className="text-zinc-400">Esc: Back to Selection</span>
      </div>
    </div>
  );
}
