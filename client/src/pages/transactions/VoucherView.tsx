import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface VoucherEntry {
  entry_id: number;
  ledger_id: number;
  ledger_name: string;
  type: "Dr" | "Cr";
  amount: number;
  currency: string;
}

interface StockEntry {
  stock_entry_id: number;
  item_name: string;
  godown_id: number | null;
  unit_id: number | null;
  quantity: number;
  rate: number;
  amount: number;
}

interface Voucher {
  voucher_id: number;
  voucher_type: string;
  voucher_number: string;
  date: string;
  reference_number: string | null;
  reference_date: string | null;
  narration: string | null;
  party_name: string | null;
  party_ledger_id: number | null;
  place_of_supply: string | null;
  is_invoice: number;
  is_accounting_voucher: number;
  is_inventory_voucher: number;
  is_cancelled: number;
  created_at: string;
  entries: VoucherEntry[];
  stock_entries: StockEntry[];
}

const TYPE_COLORS: Record<string, string> = {
  Receipt:  "bg-emerald-600",
  Payment:  "bg-rose-600",
  Contra:   "bg-violet-600",
  Journal:  "bg-amber-600",
  Sales:    "bg-blue-600",
  Purchase: "bg-orange-600",
};

const formatDate = (d: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatAmount = (n: number) => {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export default function VoucherView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await window.api.voucher.getById(Number(id));
        if (res.success) {
          setVoucher(res.voucher as Voucher);
        } else {
          setError(res.error || "Voucher not found");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleCancel = async () => {
    if (!voucher) return;
    if (!window.confirm(`Cancel voucher ${voucher.voucher_number}? This cannot be undone.`)) return;
    setCancelling(true);
    try {
      const res = await window.api.voucher.cancel(voucher.voucher_id);
      if (res.success) {
        setVoucher(prev => prev ? { ...prev, is_cancelled: 1 } : prev);
      } else {
        setError(res.error || "Failed to cancel");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!voucher) return;
    if (!window.confirm(`Permanently delete voucher ${voucher.voucher_number}? This cannot be undone.`)) return;
    try {
      const res = await window.api.voucher.delete(voucher.voucher_id);
      if (res.success) {
        navigate("/transactions/voucher-list");
      } else {
        setError(res.error || "Failed to delete");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading voucher…
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-500 font-mono text-xs">
        <span className="text-red-600">{error || "Voucher not found"}</span>
        <button onClick={() => navigate(-1)} className="text-zinc-500 hover:text-zinc-900 underline">
          ← Go Back
        </button>
      </div>
    );
  }

  const drTotal = voucher.entries.filter(e => e.type === "Dr").reduce((s, e) => s + e.amount, 0);
  const crTotal = voucher.entries.filter(e => e.type === "Cr").reduce((s, e) => s + e.amount, 0);
  const stockTotal = voucher.stock_entries.reduce((s, e) => s + e.amount, 0);

  const accentColor = TYPE_COLORS[voucher.voucher_type] || "bg-zinc-700";

  return (
    <div className="flex-1 flex flex-col bg-white h-full font-mono text-xs select-none overflow-y-auto">
      {/* Title Bar */}
      <div className={`px-4 py-2.5 text-white flex justify-between items-center shadow-sm shrink-0 ${accentColor}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors text-sm">
            ←
          </button>
          <div>
            <div className="text-sm font-bold tracking-wide uppercase">
              {voucher.voucher_type} Voucher — {voucher.voucher_number}
            </div>
            <div className="text-[10px] text-white/60 font-sans">
              {formatDate(voucher.date)}
              {voucher.is_cancelled ? " · CANCELLED" : ""}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!voucher.is_cancelled && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded uppercase tracking-wider transition-colors"
            >
              Cancel Voucher
            </button>
          )}
          <button
            onClick={handleDelete}
            className="text-[10px] bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded uppercase tracking-wider transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 border-b border-red-200 bg-red-50 text-red-700 text-xs shrink-0">
          {error}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">

        {/* Header Details Card */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Voucher Details</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-0 divide-x divide-y divide-zinc-100">
            {[
              { label: "Voucher No.", value: voucher.voucher_number },
              { label: "Type", value: voucher.voucher_type },
              { label: "Date", value: formatDate(voucher.date) },
              ...(voucher.party_name ? [{ label: "Party", value: voucher.party_name }] : []),
              ...(voucher.reference_number ? [{ label: "Ref No.", value: voucher.reference_number }] : []),
              ...(voucher.reference_date ? [{ label: "Ref Date", value: formatDate(voucher.reference_date) }] : []),
              ...(voucher.place_of_supply ? [{ label: "Place of Supply", value: voucher.place_of_supply }] : []),
              ...(voucher.narration ? [{ label: "Narration", value: voucher.narration }] : []),
            ].map(({ label, value }) => (
              <div key={label} className="px-3 py-2.5">
                <div className="text-[9px] text-zinc-400 uppercase font-bold tracking-wider mb-0.5">{label}</div>
                <div className="text-zinc-800 font-semibold font-mono truncate" title={value}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Accounting Entries */}
        {voucher.entries && voucher.entries.length > 0 && (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Accounting Entries
              </span>
              <div className="flex gap-3 text-[10px] text-zinc-500">
                <span>Dr: <span className="font-bold text-zinc-800">₹{formatAmount(drTotal)}</span></span>
                <span>Cr: <span className="font-bold text-zinc-800">₹{formatAmount(crTotal)}</span></span>
              </div>
            </div>

            {/* Entries Header */}
            <div className="grid grid-cols-12 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="col-span-1 text-center">Dr/Cr</div>
              <div className="col-span-7">Ledger Account</div>
              <div className="col-span-4 text-right">Amount</div>
            </div>

            {voucher.entries.map(entry => (
              <div key={entry.entry_id} className="grid grid-cols-12 px-3 py-2 border-b border-zinc-100 items-center hover:bg-zinc-50/50 transition-colors">
                <div className="col-span-1 text-center">
                  <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                    entry.type === "Dr" ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"
                  }`}>
                    {entry.type}
                  </span>
                </div>
                <div className="col-span-7 text-zinc-800 font-semibold truncate">
                  {entry.ledger_name || `Ledger #${entry.ledger_id}`}
                </div>
                <div className="col-span-4 text-right font-bold text-zinc-900">
                  ₹{formatAmount(entry.amount)}
                </div>
              </div>
            ))}

            {/* Balance indicator */}
            <div className={`px-3 py-1.5 text-[10px] font-bold text-right ${
              Math.abs(drTotal - crTotal) < 0.01
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}>
              {Math.abs(drTotal - crTotal) < 0.01
                ? "✓ Balanced"
                : `⚠ Difference: ₹${formatAmount(Math.abs(drTotal - crTotal))}`
              }
            </div>
          </div>
        )}

        {/* Inventory / Stock Entries */}
        {voucher.stock_entries && voucher.stock_entries.length > 0 && (
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <div className="bg-zinc-50 px-3 py-2 border-b border-zinc-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Inventory Particulars
              </span>
            </div>

            {/* Stock Header */}
            <div className="grid grid-cols-12 px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="col-span-5">Item Name</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-3 text-right">Amount</div>
            </div>

            {voucher.stock_entries.map(item => (
              <div key={item.stock_entry_id} className="grid grid-cols-12 px-3 py-2 border-b border-zinc-100 items-center hover:bg-zinc-50/50 transition-colors">
                <div className="col-span-5 text-zinc-800 font-semibold truncate">
                  {item.item_name || "—"}
                </div>
                <div className="col-span-2 text-right text-zinc-600">{item.quantity}</div>
                <div className="col-span-2 text-right text-zinc-600">₹{formatAmount(item.rate)}</div>
                <div className="col-span-3 text-right font-bold text-zinc-900">₹{formatAmount(item.amount)}</div>
              </div>
            ))}

            {/* Stock Total */}
            <div className="grid grid-cols-12 px-3 py-2 bg-zinc-50 border-t border-zinc-200">
              <div className="col-span-9 font-bold text-zinc-700 uppercase text-[10px] tracking-wider">
                Total Inventory Value
              </div>
              <div className="col-span-3 text-right font-bold text-zinc-900">
                ₹{formatAmount(stockTotal)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider shrink-0">
        <span>Voucher ID: {voucher.voucher_id}</span>
        <button
          onClick={() => navigate("/transactions/voucher-list")}
          className="hover:text-zinc-800 transition-colors"
        >
          ← Back to List
        </button>
      </div>
    </div>
  );
}
