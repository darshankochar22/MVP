import * as React from "react";

interface BillVoucherRow {
  voucher_id: number;
  date: string;
  voucher_type: string;
  voucher_number: string | number;
  bill_type: string;
  amount: number;
  entry_type: "Dr" | "Cr";
}

interface Props {
  companyId: number;
  fyId: number;
  ledgerId: number;
  billName: string;
  onClose: () => void;
  onOpenVoucher: (voucherId: number) => void;
}

const fmt = (v: number) =>
  v === 0 ? "" : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(v));

const fmtDate = (d: string) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const day = dt.getDate();
  const mon = dt.toLocaleString("en-IN", { month: "short" });
  const yr = String(dt.getFullYear()).slice(-2);
  return `${day}-${mon}-${yr}`;
};

/**
 * Shared "Bill Vouchers" drill — a popup (not a full-screen navigation) listing
 * the vouchers (original bill + any Agst Ref settlements) that make up one
 * Bills Receivable/Payable row. Clicking a voucher here opens it full-screen.
 */
export default function BillVouchersPopup({ companyId, fyId, ledgerId, billName, onClose, onOpenVoucher }: Props) {
  const [rows, setRows] = React.useState<BillVoucherRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    window.api.report.billVouchers(companyId, fyId, ledgerId, billName)
      .then((res) => {
        if (!active) return;
        if (res.success) { setRows(res.rows || []); setFocusedIndex(0); }
        else setError(res.error || "Failed to load bill vouchers.");
      })
      .catch((e: any) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [companyId, fyId, ledgerId, billName]);

  const openFocused = React.useCallback(() => {
    const row = rows[focusedIndex];
    if (row) onOpenVoucher(row.voucher_id);
  }, [rows, focusedIndex, onOpenVoucher]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusedIndex(p => Math.min(rows.length - 1, p + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocusedIndex(p => Math.max(0, p - 1)); }
      else if (e.key === "Enter") { e.preventDefault(); openFocused(); }
      else if (e.key === "Escape") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, openFocused, onClose]);

  const totalDr = rows.reduce((s, r) => s + (r.entry_type === "Dr" ? r.amount : 0), 0);
  const totalCr = rows.reduce((s, r) => s + (r.entry_type === "Cr" ? r.amount : 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-white border border-zinc-300 rounded-lg shadow-2xl w-[560px] flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 px-4 py-2 text-white flex justify-between items-center select-none">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider">Bill Vouchers</span>
            <span className="text-[10px] text-zinc-400 font-mono">{billName}</span>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white font-bold text-sm">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="text-center py-6 text-zinc-500 text-xs italic">Loading vouchers…</div>
          ) : error ? (
            <div className="text-center py-6 text-zinc-600 text-xs px-4">{error}</div>
          ) : (
            <table className="w-full border-collapse text-[11px] font-mono select-none">
              <thead className="sticky top-0 bg-[#f4f4f5] border-b border-zinc-300 z-10 text-zinc-700">
                <tr>
                  <th className="px-3 py-1.5 text-left font-bold w-20">Date</th>
                  <th className="px-3 py-1.5 text-left font-bold">Vch Type</th>
                  <th className="px-3 py-1.5 text-right font-bold w-16">Vch No.</th>
                  <th className="px-3 py-1.5 text-right font-bold w-24">Debit</th>
                  <th className="px-3 py-1.5 text-right font-bold w-24">Credit</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-400 italic">No vouchers found for this bill.</td></tr>
                ) : rows.map((row, idx) => {
                  const isFocused = focusedIndex === idx;
                  return (
                    <tr
                      key={row.voucher_id}
                      onClick={() => setFocusedIndex(idx)}
                      onDoubleClick={() => onOpenVoucher(row.voucher_id)}
                      className={`border-b border-zinc-100 cursor-pointer select-none transition-colors ${isFocused ? "bg-[#e4e4e7] text-zinc-950 font-bold" : "hover:bg-zinc-50 text-zinc-800"}`}
                    >
                      <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(row.date)}</td>
                      <td className="px-3 py-1.5">{row.voucher_type}</td>
                      <td className="px-3 py-1.5 text-right">{row.voucher_number || ""}</td>
                      <td className="px-3 py-1.5 text-right">{row.entry_type === "Dr" ? fmt(row.amount) : ""}</td>
                      <td className="px-3 py-1.5 text-right">{row.entry_type === "Cr" ? fmt(row.amount) : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-double border-zinc-400 bg-[#f4f4f5] font-bold text-zinc-900">
                    <td className="px-3 py-1.5" colSpan={3}>Total</td>
                    <td className="px-3 py-1.5 text-right">{fmt(totalDr)}</td>
                    <td className="px-3 py-1.5 text-right">{fmt(totalCr)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 p-3 bg-zinc-50 flex justify-between items-center select-none">
          <span className="text-[10px] text-zinc-500">Enter: Open Voucher &nbsp;·&nbsp; Esc: Close</span>
          <button onClick={onClose}
            className="text-xs px-3 py-1.5 border border-zinc-300 rounded text-zinc-700 bg-white hover:bg-zinc-100 font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
