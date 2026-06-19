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
  inflow: number;
  outflow: number;
  net: number;
}

interface DetailRow {
  id: string | number;
  ledger_name: string;
  inflow: number;
  outflow: number;
  net: number;
}

export default function CashFlowStatement() {
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

  // Generate month ranges for FY
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

  // Load Monthly Summary
  const loadMonthlySummary = useCallback(async () => {
    if (!companyId || !fyId || monthRanges.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const promises = monthRanges.map(async (m) => {
        const res = await window.api.report.cashFlow(companyId, fyId, m.startDate, m.endDate);
        return {
          name: m.name,
          startDate: m.startDate,
          endDate: m.endDate,
          inflow: res.success ? res.totalInflow || 0 : 0,
          outflow: res.success ? res.totalOutflow || 0 : 0,
          net: res.success ? res.netCashFlow || 0 : 0
        };
      });
      const results = await Promise.all(promises);
      setMonthlyData(results);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [companyId, fyId, monthRanges]);

  // Load Detailed Month Flow
  const loadMonthDetails = useCallback(async (month: MonthData) => {
    if (!companyId || !fyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await window.api.report.cashFlow(companyId, fyId, month.startDate, month.endDate);
      if (res.success && res.byCounterLedger) {
        setDetailRows(res.byCounterLedger.map((r: any, idx: number) => ({
          id: idx + 1,
          ledger_name: r.ledger_name,
          inflow: r.inflow || 0,
          outflow: r.outflow || 0,
          net: r.net || 0
        })));
      } else {
        setDetailRows([]);
        if (!res.success) setError(res.error || "Failed to load details");
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

  // Totals
  const { totalInflow, totalOutflow, totalNet } = useMemo(() => {
    if (viewMode === "monthly") {
      return {
        totalInflow: monthlyData.reduce((s, m) => s + m.inflow, 0),
        totalOutflow: monthlyData.reduce((s, m) => s + m.outflow, 0),
        totalNet: monthlyData.reduce((s, m) => s + m.net, 0)
      };
    } else {
      return {
        totalInflow: detailRows.reduce((s, d) => s + d.inflow, 0),
        totalOutflow: detailRows.reduce((s, d) => s + d.outflow, 0),
        totalNet: detailRows.reduce((s, d) => s + d.net, 0)
      };
    }
  }, [viewMode, monthlyData, detailRows]);

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

  const formatCurrency = (val: number) => {
    if (val === 0) return "";
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // SVG Chart rendering data
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

    // Find max value for scaling
    const maxVal = Math.max(
      ...monthlyData.map(m => Math.max(m.inflow, m.outflow)),
      1000 // default minimum scale
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

    // Draw X labels & side-by-side bars for inflow/outflow
    const elements: React.ReactNode[] = [];
    const monthLabels = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

    monthlyData.forEach((m, idx) => {
      const centerX = paddingLeft + (idx * segmentWidth) + segmentWidth / 2;

      // X Label
      elements.push(
        <text
          key={`lbl-${idx}`}
          x={centerX}
          y={height - 8}
          textAnchor="middle"
          className="fill-zinc-500 font-mono text-[9px]"
        >
          {monthLabels[idx]}
        </text>
      );

      // Inflow Bar (Green)
      if (m.inflow > 0) {
        const barHeight = (m.inflow / maxVal) * chartHeight;
        const barY = height - paddingBottom - barHeight;
        elements.push(
          <rect
            key={`in-${idx}`}
            x={centerX - 5}
            y={barY}
            width={4}
            height={barHeight}
            fill="#10b981"
            rx={0.5}
          />
        );
      }

      // Outflow Bar (Red)
      if (m.outflow > 0) {
        const barHeight = (m.outflow / maxVal) * chartHeight;
        const barY = height - paddingBottom - barHeight;
        elements.push(
          <rect
            key={`out-${idx}`}
            x={centerX + 1}
            y={barY}
            width={4}
            height={barHeight}
            fill="#ef4444"
            rx={0.5}
          />
        );
      }
    });

    return (
      <div className="bg-zinc-50 p-3 border-t border-zinc-200 shrink-0">
        <div className="text-[10px] font-bold text-zinc-500 mb-1 font-mono uppercase tracking-wider pl-12 flex gap-4">
          <span>Inflow & Outflow Monthly Trend</span>
          <span className="flex items-center gap-1 normal-case font-normal text-zinc-400">
            <span className="inline-block w-2.5 h-2.5 bg-[#10b981] rounded-sm"></span> Inflow (Receipts)
            <span className="inline-block w-2.5 h-2.5 bg-[#ef4444] rounded-sm ml-2"></span> Outflow (Payments)
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
          {elements}
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
      title="Cash Flow"
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
              Loading Cash Flow data...
            </div>
          ) : (
            <div className="flex-grow overflow-auto min-h-0">
              <table className="w-full border-collapse font-mono text-[11px] select-none text-zinc-800">
                <thead className="sticky top-0 bg-[#004433] text-white z-10">
                  {viewMode === "monthly" ? (
                    <>
                      <tr className="border-b border-[#005544]">
                        <th className="px-3 py-1.5 text-left font-bold w-[40%]">Particulars</th>
                        <th colSpan={3} className="px-3 py-1 text-center font-bold border-l border-[#005544] border-b border-[#005544]">
                          Cash Movement
                        </th>
                      </tr>
                      <tr>
                        <th></th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Inflow</th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Outflow</th>
                        <th className="px-3 py-1 text-right font-bold w-[20%] border-l border-[#005544]">Nett Flow</th>
                      </tr>
                    </>
                  ) : (
                    <tr className="border-b border-[#005544]">
                      <th className="px-3 py-1.5 text-left font-bold w-[40%]">Particulars ({selectedMonth?.name})</th>
                      <th className="px-3 py-1.5 text-right font-bold w-[20%] border-l border-[#005544]">Inflow</th>
                      <th className="px-3 py-1.5 text-right font-bold w-[20%] border-l border-[#005544]">Outflow</th>
                      <th className="px-3 py-1.5 text-right font-bold w-[20%] border-l border-[#005544]">Nett Flow</th>
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
                          <td className="px-3 py-1.5 text-left border-r border-zinc-100">
                            {row.name}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-[#10b981]">
                            {formatCurrency(row.inflow)}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-[#ef4444]">
                            {formatCurrency(row.outflow)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-zinc-950">
                            {formatCurrency(row.net)}
                          </td>
                        </tr>
                      );
                    })
                  ) : detailRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-400 italic">
                        No transactions this month.
                      </td>
                    </tr>
                  ) : (
                    detailRows.map((row, idx) => {
                      const isFocused = idx === focusedIndex;
                      return (
                        <tr
                          key={row.ledger_name}
                          onClick={() => setFocusedIndex(idx)}
                          className={cn(
                            "border-b border-zinc-100 hover:bg-zinc-50 transition-colors cursor-pointer",
                            isFocused ? "bg-cyan-100 text-cyan-950 font-bold" : ""
                          )}
                        >
                          <td className="px-3 py-1.5 text-left border-r border-zinc-100 font-medium">
                            {row.ledger_name}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-zinc-700">
                            {formatCurrency(row.inflow)}
                          </td>
                          <td className="px-3 py-1.5 text-right border-r border-zinc-100 text-zinc-700">
                            {formatCurrency(row.outflow)}
                          </td>
                          <td className="px-3 py-1.5 text-right text-zinc-950">
                            {formatCurrency(row.net)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {/* Grand Total Row */}
                  <tr className="border-t-2 border-b-2 border-zinc-800 bg-zinc-50 font-bold text-zinc-900 sticky bottom-0">
                    <td className="px-3 py-2 text-left uppercase">Grand Total</td>
                    <td className="px-3 py-2 text-right border-r border-zinc-200">
                      {formatCurrency(totalInflow)}
                    </td>
                    <td className="px-3 py-2 text-right border-r border-zinc-200">
                      {formatCurrency(totalOutflow)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(totalNet)}
                    </td>
                  </tr>
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
