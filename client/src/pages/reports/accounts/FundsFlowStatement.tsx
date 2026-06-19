import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "../../../context/CompanyContext";
import { TallyReportLayout } from "../../../components/tally-ui/TallyReportLayout";
import { RightActionPanel } from "../../../components/ui";
import { cn } from "@/lib/utils";

interface MonthData {
  name: string;
  startDate: string;
  endDate: string;
  opening: number;
  closing: number;
  netChange: number;
}

interface DetailRow {
  id: string;
  particulars: string;
  amount: number | null;
  isHeader?: boolean;
  isTotal?: boolean;
}

interface GroupRow {
  group_id: number;
  name: string;
  parent_group_id: number | null;
  nature: string | null;
}

interface LedgerRow {
  ledger_id: number;
  name: string;
  group_id: number;
  opening_balance: number;
  nature: string | null;
}

export default function FundsFlowStatement() {
  const navigate = useNavigate();
  const { selectedCompany, activeFY } = useCompany();

  // Mode: "monthly" | "detail"
  const [viewMode, setViewMode] = useState<"monthly" | "detail">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);

  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [detailRows, setDetailRows] = useState<DetailRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [focusedIndex, setFocusedIndex] = useState(0);

  const companyId = selectedCompany?.company_id;
  const fyId = activeFY?.fy_id;

  // Generate month ranges
  const monthRanges = useMemo(() => {
    if (!activeFY?.start_date) return [];
    const startYear = new Date(activeFY.start_date).getFullYear();
    const years = [
      startYear, startYear, startYear, startYear, startYear, startYear,
      startYear, startYear, startYear, startYear + 1, startYear + 1, startYear + 1
    ];
    const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    const monthNames = [
      "April", "May", "June", "July", "August", "September",
      "October", "November", "December", "January", "February", "March"
    ];
    return months.map((m, idx) => {
      const yr = years[idx];
      const startDate = `${yr}-${String(m).padStart(2, "0")}-01`;
      const lastDay = new Date(yr, m, 0).getDate();
      const endDate = `${yr}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return {
        name: monthNames[idx],
        startDate,
        endDate
      };
    });
  }, [activeFY]);

  // Helper to determine nature recursively
  const getNature = useCallback((groupId: number, groupMap: Map<number, GroupRow>): string | null => {
    let current = groupMap.get(groupId);
    while (current) {
      if (current.nature) return current.nature;
      if (current.parent_group_id) {
        current = groupMap.get(current.parent_group_id);
      } else {
        break;
      }
    }
    return null;
  }, []);

  // Load Monthly Summary
  const loadMonthlySummary = useCallback(async () => {
    if (!companyId || !fyId || monthRanges.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch ledgers & groups to calculate INITIAL working capital
      const [ledgerRes, groupRes] = await Promise.all([
        window.api.ledger.getAll(companyId),
        window.api.group.getAll(companyId)
      ]);

      const groupsData: GroupRow[] = groupRes.success ? groupRes.groups || [] : [];
      const ledgersData: LedgerRow[] = ledgerRes.success ? ledgerRes.ledgers || [] : [];

      const groupMap = new Map<number, GroupRow>();
      groupsData.forEach((g) => groupMap.set(g.group_id, g));

      let initialWC = 0;
      ledgersData.forEach((l) => {
        const nature = getNature(l.group_id, groupMap);
        if (nature === "Assets") {
          // If group is Current Assets
          const isCurrentAsset = groupsData.some(
            g => g.group_id === l.group_id && (g.name === "Current Assets" || g.nature === "Assets")
          ) || getNature(l.group_id, groupMap) === "Assets"; // general check

          if (isCurrentAsset) {
            initialWC += l.opening_balance || 0;
          }
        } else if (nature === "Liabilities") {
          const isCurrentLiab = groupsData.some(
            g => g.group_id === l.group_id && (g.name === "Current Liabilities")
          );
          if (isCurrentLiab) {
            initialWC -= l.opening_balance || 0;
          }
        }
      });

      // 2. Fetch changes month-by-month
      const promises = monthRanges.map(async (m) => {
        const res = await window.api.report.fundsFlow(companyId, fyId, m.startDate, m.endDate);
        return {
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          netChange: res.success ? res.netWorkingCapitalChange || 0 : 0
        };
      });

      const changes = await Promise.all(promises);

      // Reconstruct monthly opening/closing
      let currentOpening = initialWC;
      const data: MonthData[] = changes.map((c) => {
        const closing = currentOpening + c.netChange;
        const row = {
          name: c.name,
          startDate: c.startDate,
          endDate: c.endDate,
          opening: currentOpening,
          closing,
          netChange: c.netChange
        };
        currentOpening = closing;
        return row;
      });

      setMonthlyData(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId, monthRanges, getNature]);

  // Load Detailed Month Flow
  const loadMonthDetails = useCallback(async (month: MonthData) => {
    if (!companyId || !fyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.report.fundsFlow(companyId, fyId, month.startDate, month.endDate);
      if (res.success) {
        const list: DetailRow[] = [];
        list.push({ id: "src-head", particulars: "SOURCES OF FUNDS", amount: null, isHeader: true });
        if (res.sources && res.sources.length > 0) {
          list.push(...res.sources.map((s: any, idx: number) => ({ id: `src-${idx}`, particulars: s.particulars, amount: s.amount })));
        } else {
          list.push({ id: "src-empty", particulars: "No sources", amount: 0 });
        }
        list.push({ id: "src-total", particulars: "Total Sources", amount: res.totalSources, isTotal: true });

        list.push({ id: "app-head", particulars: "APPLICATIONS OF FUNDS", amount: null, isHeader: true });
        if (res.applications && res.applications.length > 0) {
          list.push(...res.applications.map((a: any, idx: number) => ({ id: `app-${idx}`, particulars: a.particulars, amount: a.amount })));
        } else {
          list.push({ id: "app-empty", particulars: "No applications", amount: 0 });
        }
        list.push({ id: "app-total", particulars: "Total Applications", amount: res.totalApplications, isTotal: true });

        list.push({
          id: "net-wc",
          particulars: res.isNetIncrease ? "Net Increase in Working Capital" : "Net Decrease in Working Capital",
          amount: Math.abs(res.netWorkingCapitalChange),
          isTotal: true
        });

        setDetailRows(list);
      } else {
        setDetailRows([]);
        setError(res.error || "Failed to load details");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId]);

  useEffect(() => {
    if (viewMode === "monthly") {
      loadMonthlySummary();
    } else if (selectedMonth) {
      loadMonthDetails(selectedMonth);
    }
  }, [viewMode, selectedMonth, loadMonthlySummary, loadMonthDetails]);

  // Totals for summary
  const { totalOpening, totalClosing, totalNetChange } = useMemo(() => {
    if (monthlyData.length === 0) return { totalOpening: 0, totalClosing: 0, totalNetChange: 0 };
    return {
      totalOpening: monthlyData[0].opening,
      totalClosing: monthlyData[monthlyData.length - 1].closing,
      totalNetChange: monthlyData.reduce((s, m) => s + m.netChange, 0)
    };
  }, [monthlyData]);

  const handleRowAction = useCallback((index: number) => {
    if (viewMode === "monthly") {
      const month = monthlyData[index];
      if (month) {
        setSelectedMonth(month);
        setViewMode("detail");
        setFocusedIndex(0);
      }
    }
  }, [viewMode, monthlyData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      const maxRows = viewMode === "monthly" ? monthlyData.length : detailRows.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, maxRows - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleRowAction(focusedIndex);
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (viewMode === "detail") {
          setViewMode("monthly");
          setSelectedMonth(null);
          setFocusedIndex(0);
        } else {
          navigate(-1);
        }
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [viewMode, monthlyData, detailRows, focusedIndex, handleRowAction, navigate]);

  const formatCurrency = (val: number | null) => {
    if (val === null) return "";
    if (val === 0) return "0.00";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // SVG Chart rendering
  const chartSvg = useMemo(() => {
    if (viewMode !== "monthly" || monthlyData.length === 0) return null;

    const width = 800;
    const height = 140;
    const paddingLeft = 60;
    const paddingRight = 20;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find max value for scaling working capital closing
    const maxVal = Math.max(
      ...monthlyData.map(m => Math.max(m.opening, m.closing)),
      1000 // default minimum
    );

    const segmentWidth = chartWidth / 12;

    // Draw Y grid lines
    const yGridLines = [];
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const val = (maxVal / ticks) * i;
      const y = height - paddingBottom - (val / maxVal) * chartHeight;
      yGridLines.push(
        <g key={i}>
          <line
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke="#e4e4e7"
            strokeDasharray="2 2"
          />
          <text
            x={paddingLeft - 8}
            y={y + 3}
            textAnchor="end"
            className="fill-zinc-400 font-mono text-[9px]"
          >
            {val >= 1000 ? (val / 1000).toFixed(0) + "k" : val.toFixed(0)}
          </text>
        </g>
      );
    }

    // Draw line of Working Capital closing
    const points: string[] = [];
    const labels: React.ReactNode[] = [];
    const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

    monthlyData.forEach((m, idx) => {
      const centerX = paddingLeft + (idx * segmentWidth) + segmentWidth / 2;
      const y = height - paddingBottom - (m.closing / maxVal) * chartHeight;
      points.push(`${centerX},${y}`);

      labels.push(
        <g key={`lbl-${idx}`}>
          <circle cx={centerX} cy={y} r={3} fill="#0d9488" />
          <text
            x={centerX}
            y={height - 8}
            textAnchor="middle"
            className="fill-zinc-500 font-mono text-[9px]"
          >
            {monthLabels[idx]}
          </text>
        </g>
      );
    });

    return (
      <div className="bg-zinc-50 p-3 border-t border-zinc-200 shrink-0">
        <div className="text-[10px] font-bold text-zinc-500 mb-1 font-mono uppercase tracking-wider pl-12 flex gap-4">
          <span>Working Capital Closing Trend</span>
          <span className="flex items-center gap-1 normal-case font-normal text-zinc-400">
            <span className="inline-block w-3 h-0.5 bg-[#0d9488]"></span> Closing Balance
          </span>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-h-[140px]">
          {yGridLines}
          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#d4d4d8"
            strokeWidth={1}
          />
          <polyline
            fill="none"
            stroke="#0d9488"
            strokeWidth={2}
            points={points.join(" ")}
          />
          {labels}
        </svg>
      </div>
    );
  }, [viewMode, monthlyData]);

  const rightPanelActions = [
    { key: "Esc", label: "Quit", onClick: () => {
      if (viewMode === "detail") {
        setViewMode("monthly");
        setSelectedMonth(null);
        setFocusedIndex(0);
      } else {
        navigate(-1);
      }
    }}
  ];

  return (
    <TallyReportLayout
      title="Funds Flow"
      companyName={selectedCompany?.name || "No Company"}
      leftSubtitle={viewMode === "detail" ? (
        <button
          onClick={() => {
            setViewMode("monthly");
            setSelectedMonth(null);
            setFocusedIndex(0);
          }}
          className="text-cyan-600 hover:underline font-bold text-[10px] uppercase mb-1"
        >
          ◀ Back to Monthly Summary
        </button>
      ) : null}
      rightSubtitle={`For ${activeFY?.start_date ? new Date(activeFY.start_date).getFullYear() : ""}-${activeFY?.end_date ? new Date(activeFY.end_date).getFullYear() % 100 : ""}`}
    >
      <div className="flex-1 flex h-full min-h-0">
        <div className="flex-grow flex flex-col min-h-0 bg-white">
          {error && (
            <div className="bg-red-50 text-red-700 text-[11px] p-2 border-b border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex-grow flex items-center justify-center italic text-zinc-500 py-10 font-mono text-[11px]">
              Loading Funds Flow data...
            </div>
          ) : (
            <div className="flex-grow overflow-auto min-h-0">
              <table className="w-full border-collapse font-mono text-[11px] select-none text-zinc-800">
                <thead className="sticky top-0 bg-[#004433] text-white z-10">
                  {viewMode === "monthly" ? (
                    <>
                      <tr className="border-b border-[#005544]">
                        <th className="px-3 py-1.5 text-left font-bold w-[40%]">Particulars</th>
                        <th colSpan={2} className="px-3 py-1 text-center font-bold border-l border-[#005544] border-b border-[#005544]">
                          Working Capital
                        </th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Funds Flow</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Opening</th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Closing</th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Nett Flow</th>
                      </tr>
                    </>
                  ) : (
                    <tr className="border-b border-[#005544]">
                      <th className="px-3 py-1.5 text-left font-bold w-[70%]">Particulars ({selectedMonth?.name})</th>
                      <th className="px-3 py-1.5 text-right font-bold w-[30%] border-l border-[#005544]">Amount</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {viewMode === "monthly" ? (
                    monthlyData.map((row, idx) => {
                      const isFocused = idx === focusedIndex;
                      return (
                        <tr
                          key={row.name}
                          onClick={() => setFocusedIndex(idx)}
                          onDoubleClick={() => handleRowAction(idx)}
                          className={cn(
                            "border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer",
                            isFocused ? "bg-cyan-100 text-cyan-950 font-bold" : ""
                          )}
                        >
                          <td className="px-3 py-1.5 text-left border-r border-zinc-100 font-semibold">
                            {row.name}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-zinc-700">
                            {formatCurrency(row.opening)}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-zinc-700">
                            {formatCurrency(row.closing)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-zinc-950">
                            {formatCurrency(row.netChange)}
                          </td>
                        </tr>
                      );
                    })
                  ) : detailRows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center py-8 text-zinc-400 italic">
                        No transactions this month.
                      </td>
                    </tr>
                  ) : (
                    detailRows.map((row, idx) => {
                      const isFocused = idx === focusedIndex;
                      const isHeader = row.isHeader;
                      const isTotal = row.isTotal;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setFocusedIndex(idx)}
                          className={cn(
                            "border-b border-zinc-100 transition-colors cursor-pointer",
                            isFocused ? "bg-cyan-100 text-cyan-950 font-bold" : "",
                            isHeader ? "bg-zinc-100 font-bold text-zinc-800 uppercase text-[10px]" : "",
                            isTotal ? "font-bold text-zinc-950 border-t border-zinc-300" : "text-zinc-600"
                          )}
                        >
                          <td className={cn("px-3 py-1.5 text-left border-r border-zinc-100", !isHeader && !isTotal && "pl-6")}>
                            {row.particulars}
                          </td>
                          <td className={cn("px-3 py-1.5 text-right", isTotal && "font-bold")}>
                            {formatCurrency(row.amount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {/* Grand Total Row for monthly view */}
                  {viewMode === "monthly" && (
                    <tr className="border-t-2 border-b-2 border-zinc-800 bg-zinc-50 font-bold text-zinc-900 sticky bottom-0">
                      <td className="px-3 py-2 text-left uppercase">Grand Total</td>
                      <td className="px-3 py-2 text-right border-r border-zinc-200">
                        {formatCurrency(totalOpening)}
                      </td>
                      <td className="px-3 py-2 text-right border-r border-zinc-200">
                        {formatCurrency(totalClosing)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(totalNetChange)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {chartSvg}
        </div>

        <RightActionPanel actions={rightPanelActions} />
      </div>
    </TallyReportLayout>
  );
}
