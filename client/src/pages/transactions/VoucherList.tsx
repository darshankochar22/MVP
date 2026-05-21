import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../context/CompanyContext";

const VOUCHER_TYPES = ["Receipt", "Payment", "Contra", "Journal", "Sales", "Purchase"];

const TYPE_COLORS: Record<string, string> = {
  Receipt:  "bg-emerald-100 text-emerald-800",
  Payment:  "bg-rose-100 text-rose-800",
  Contra:   "bg-violet-100 text-violet-800",
  Journal:  "bg-amber-100 text-amber-800",
  Sales:    "bg-blue-100 text-blue-800",
  Purchase: "bg-orange-100 text-orange-800",
};

interface VoucherRow {
  voucher_id: number;
  voucher_type: string;
  voucher_number: string;
  date: string;
  narration: string | null;
  party_name: string | null;
  is_cancelled: number;
  is_invoice: number;
}

export default function VoucherList() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();
  const [selectedType, setSelectedType] = useState<string>("All");
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  const fetchVouchers = useCallback(async () => {
    if (!companyId || !fyId) return;
    setLoading(true);
    setError(null);
    try {
      let res: any;
      if (selectedType === "All") {
        res = await window.api.voucher.getAll(companyId, fyId);
      } else {
        res = await window.api.voucher.getByType(companyId, fyId, selectedType);
      }
      if (res.success) {
        setVouchers(res.vouchers || []);
      } else {
        setError(res.error || "Failed to fetch vouchers");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId, selectedType]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const filtered = vouchers.filter(v => {
    const q = search.toLowerCase();
    return (
      !q ||
      v.voucher_number?.toLowerCase().includes(q) ||
      v.party_name?.toLowerCase().includes(q) ||
      v.narration?.toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string) => {
    if (!d) return "—";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full font-mono text-xs select-none">
      {/* Title Bar */}
      <div className="px-3 py-1.5 text-xs font-semibold bg-zinc-900 text-white flex justify-between items-center shadow-sm">
        <span className="uppercase tracking-wider">Voucher Register</span>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 font-mono text-[10px]">{selectedCompany?.name || ""}</span>
          <button
            onClick={() => navigate("/transactions/vouchers")}
            className="text-[10px] bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-0.5 rounded uppercase tracking-wider transition-colors"
          >
            + New Voucher
          </button>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="flex border-b border-zinc-200 bg-zinc-50 overflow-x-auto shrink-0">
        {["All", ...VOUCHER_TYPES].map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors ${
              selectedType === type
                ? "border-zinc-900 text-zinc-900 bg-white"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 border-b border-zinc-100 bg-zinc-50/50">
        <input
          type="text"
          className="w-full max-w-sm text-xs px-2.5 py-1.5 border border-zinc-300 rounded outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-all bg-white font-mono"
          placeholder="Search by voucher no, party, narration…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 border-b border-red-200 bg-red-50 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Header */}
        <div className="grid grid-cols-12 px-3 py-2 bg-zinc-100 border-b border-zinc-200 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sticky top-0 z-10">
          <div className="col-span-2">Voucher No.</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Party / Narration</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading && (
          <div className="px-3 py-8 text-center text-zinc-400 italic">Loading vouchers…</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-3 py-8 text-center text-zinc-400 italic">
            {vouchers.length === 0 ? "No vouchers found. Create your first voucher." : "No results match your search."}
          </div>
        )}

        {!loading && filtered.map((v, idx) => (
          <div
            key={v.voucher_id}
            className={`grid grid-cols-12 px-3 py-2.5 border-b border-zinc-100 items-center transition-colors hover:bg-zinc-50/80 cursor-pointer group ${
              idx % 2 === 0 ? "bg-white" : "bg-zinc-50/30"
            } ${v.is_cancelled ? "opacity-50" : ""}`}
            onClick={() => navigate(`/transactions/voucher/${v.voucher_id}`)}
          >
            {/* Voucher Number */}
            <div className="col-span-2 font-bold text-zinc-900 font-mono truncate">
              {v.voucher_number || "—"}
            </div>

            {/* Type Badge */}
            <div className="col-span-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${TYPE_COLORS[v.voucher_type] || "bg-zinc-100 text-zinc-600"}`}>
                {v.voucher_type}
              </span>
            </div>

            {/* Date */}
            <div className="col-span-2 text-zinc-600 font-sans">
              {formatDate(v.date)}
            </div>

            {/* Party / Narration */}
            <div className="col-span-3 truncate">
              {v.party_name ? (
                <span className="text-zinc-900 font-semibold">{v.party_name}</span>
              ) : v.narration ? (
                <span className="text-zinc-500 italic">{v.narration}</span>
              ) : (
                <span className="text-zinc-300">—</span>
              )}
            </div>

            {/* Status */}
            <div className="col-span-2">
              {v.is_cancelled ? (
                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded uppercase">Cancelled</span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">Active</span>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-2 flex justify-end gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); navigate(`/transactions/voucher/${v.voucher_id}`); }}
                className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 hover:text-zinc-900 border border-zinc-200 hover:border-zinc-400 px-1.5 py-0.5 rounded transition-all font-sans uppercase"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-200 bg-zinc-50 flex justify-between items-center text-[10px] text-zinc-500 uppercase tracking-wider">
        <span>{filtered.length} voucher{filtered.length !== 1 ? "s" : ""}</span>
        <button
          onClick={() => navigate("/")}
          className="hover:text-zinc-800 transition-colors"
        >
          Esc → Back
        </button>
      </div>
    </div>
  );
}
