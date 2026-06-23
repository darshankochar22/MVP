import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

interface TBGroup {
  group_id: number;
  group_name: string;
  nature?: string;
  dr: number;
  cr: number;
}

interface TBData {
  groups: TBGroup[];
  grandTotalDr: number;
  grandTotalCr: number;
}

const fmt = (val: number) =>
  val === 0
    ? ""
    : new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);

const fmtTotal = (val: number) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);

export function TrialBalanceLayout() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();

  const [data, setData] = React.useState<TBData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  const [focusedId, setFocusedId] = React.useState<number | string | null>(null);
  const [diffDr, setDiffDr] = React.useState<number>(0);
  const [diffCr, setDiffCr] = React.useState<number>(0);

  React.useEffect(() => {
    if (!selectedCompany?.company_id || !activeFY?.fy_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    Promise.all([
      (window as any).api.report.trialBalance(selectedCompany.company_id, activeFY.fy_id),
      (window as any).api.ledger.getAll(selectedCompany.company_id)
    ])
      .then(([tbRes, ledgerRes]: [any, any]) => {
        if (tbRes?.success) {
          setData(tbRes);
        } else {
          setError(tbRes?.error || "Failed to load trial balance.");
          return;
        }

        // Calculate opening balances difference
        if (ledgerRes?.success && ledgerRes.ledgers) {
          let sumOpeningDebit = 0;
          let sumOpeningCredit = 0;

          ledgerRes.ledgers.forEach((l: any) => {
            const amt = l.opening_balance || 0;
            if (l.opening_balance_type === "Dr") {
              sumOpeningDebit += amt;
            } else if (l.opening_balance_type === "Cr") {
              sumOpeningCredit += amt;
            } else {
              if (amt > 0) sumOpeningDebit += amt;
              else sumOpeningCredit += Math.abs(amt);
            }
          });

          if (sumOpeningDebit !== sumOpeningCredit) {
            const diff = Math.abs(sumOpeningDebit - sumOpeningCredit);
            if (sumOpeningDebit > sumOpeningCredit) {
              setDiffCr(diff);
            } else {
              setDiffDr(diff);
            }
          } else {
            setDiffDr(0);
            setDiffCr(0);
          }
        }
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.company_id, activeFY?.fy_id]);

  const rows = React.useMemo(() => {
    if (!data) return [];
    const list: Array<{ id: number | string; name: string; dr: number; cr: number; isDiff?: boolean }> = data.groups.map(g => ({
      id: g.group_id,
      name: g.group_name,
      dr: g.dr,
      cr: g.cr
    }));
    if (diffDr > 0 || diffCr > 0) {
      list.push({
        id: "diff",
        name: "Difference in opening balances",
        dr: diffDr,
        cr: diffCr,
        isDiff: true
      });
    }
    return list;
  }, [data, diffDr, diffCr]);

  // Set default focus once rows are loaded
  React.useEffect(() => {
    if (rows.length > 0 && focusedId === null) {
      setFocusedId(rows[0].id);
    }
  }, [rows, focusedId]);

  const openGroup = React.useCallback(
    (g: { group_id: number; group_name: string }) => 
      navigate(`/reports/accounts/group-summary/${g.group_id}`),
    [navigate]
  );

  React.useEffect(() => {
    if (!rows.length) return;
    const onKey = (e: KeyboardEvent) => {
      // Ignore if user is inside form inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const idx = rows.findIndex((r) => r.id === focusedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = rows[Math.min(rows.length - 1, idx + 1)];
        if (next) setFocusedId(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = rows[Math.max(0, idx - 1)];
        if (prev) setFocusedId(prev.id);
      } else if (e.key === "Enter" && focusedId !== null) {
        e.preventDefault();
        const activeRow = rows.find((x) => x.id === focusedId);
        if (activeRow && !activeRow.isDiff) {
          openGroup({ group_id: activeRow.id as number, group_name: activeRow.name });
        }
      } else if (e.key === "Backspace" || e.key === "Escape") {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, focusedId, openGroup, navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        Loading Trial Balance...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500 font-mono text-xs px-8 text-center">
        {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-400 font-mono text-xs">
        No data available.
      </div>
    );
  }

  const grandTotalDr = (data.grandTotalDr || 0) + diffDr;
  const grandTotalCr = (data.grandTotalCr || 0) + diffCr;

  return (
    <div className="flex flex-col h-full w-full bg-white font-mono overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-[11px] font-mono">
          <thead className="sticky top-0 bg-[#e5eff5] border-b border-zinc-300 z-10 text-zinc-700 select-none">
            <tr>
              <th className="px-4 py-2 text-left font-bold" rowSpan={2}>Particulars</th>
              <th className="px-4 py-0.5 text-center font-bold border-b border-zinc-200" colSpan={2}>
                Closing Balance
              </th>
            </tr>
            <tr>
              <th className="w-40 text-right px-4 py-1 font-bold border-r border-zinc-200">Debit</th>
              <th className="w-40 text-right px-4 py-1 font-bold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-zinc-400 italic">
                  No groups found.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isFocused = focusedId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-zinc-100 cursor-pointer select-none transition-colors ${
                      isFocused
                        ? "bg-[#ffcc00] text-zinc-950 font-bold"
                        : row.isDiff
                        ? "text-zinc-500 italic"
                        : "hover:bg-zinc-50 text-zinc-800 font-semibold"
                    }`}
                    onClick={() => setFocusedId(row.id)}
                    onDoubleClick={() => {
                      if (!row.isDiff) {
                        openGroup({ group_id: row.id as number, group_name: row.name });
                      }
                    }}
                  >
                    <td className="px-4 py-1.5 text-left">{row.name}</td>
                    <td className="w-40 text-right px-4 py-1.5 border-r border-zinc-100">
                      {row.dr !== 0 ? fmt(row.dr) : ""}
                    </td>
                    <td className="w-40 text-right px-4 py-1.5">
                      {row.cr !== 0 ? fmt(row.cr) : ""}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t-2 border-double border-zinc-400 bg-[#e5eff5] px-4 py-1.5 flex justify-between font-mono text-[11px] font-bold text-zinc-900 select-none">
        <span className="flex-1">Grand Total</span>
        <span className="w-40 text-right pr-4 border-r border-zinc-200">
          {fmtTotal(grandTotalDr)}
        </span>
        <span className="w-40 text-right pr-4">
          {fmtTotal(grandTotalCr)}
        </span>
      </div>
    </div>
  );
}