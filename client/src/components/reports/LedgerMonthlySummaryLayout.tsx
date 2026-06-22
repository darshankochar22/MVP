import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

interface MonthRow {
  month: string;
  debit: number;
  credit: number;
  closingDr: number;
  closingCr: number;
}

interface LedgerMonthlyResponse {
  success: boolean;
  ledger_name: string;
  openingDr: number;
  openingCr: number;
  rows: MonthRow[];
  closingDr: number;
  closingCr: number;
  error?: string;
}

export default function LedgerMonthlySummaryLayout() {
  const navigate = useNavigate();
  const { ledgerId } = useParams<{ ledgerId: string }>();
  const { company } = useCompany() as any; // adjust to your actual CompanyContext shape

  const [data, setData] = React.useState<LedgerMonthlyResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ledgerId || !company?.company_id || !company?.fy_id) return;
    setLoading(true);
    setError(null);
    (window as any).api.report
      .ledgerMonthlySummary(company.company_id, company.fy_id, Number(ledgerId))
      .then((res: LedgerMonthlyResponse) => {
        if (res.success) {
          setData(res);
        } else {
          setError(res.error || "Failed to load ledger summary");
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ledgerId, company?.company_id, company?.fy_id]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;
  if (!data) return null;

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Month click → navigate to vouchers/daybook filtered by ledger + month
  const handleMonthClick = (row: MonthRow) => {
    navigate(
      `/reports/accounts/daybook?ledger_id=${ledgerId}&month=${encodeURIComponent(row.month)}`
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">{data.ledger_name}</h2>
        <div />
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b font-medium text-muted-foreground">
            <th className="text-left py-2">Month</th>
            <th className="text-right py-2">Debit</th>
            <th className="text-right py-2">Credit</th>
            <th className="text-right py-2">Closing Dr</th>
            <th className="text-right py-2">Closing Cr</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 italic text-muted-foreground">Opening Balance</td>
            <td className="text-right py-2"></td>
            <td className="text-right py-2"></td>
            <td className="text-right py-2">{data.openingDr ? fmt(data.openingDr) : ""}</td>
            <td className="text-right py-2">{data.openingCr ? fmt(data.openingCr) : ""}</td>
          </tr>

          {data.rows.map((row) => (
            <tr
              key={row.month}
              className="border-b hover:bg-muted/50 cursor-pointer"
              onClick={() => handleMonthClick(row)}
            >
              <td className="py-2">{row.month}</td>
              <td className="text-right py-2">{row.debit ? fmt(row.debit) : ""}</td>
              <td className="text-right py-2">{row.credit ? fmt(row.credit) : ""}</td>
              <td className="text-right py-2">{row.closingDr ? fmt(row.closingDr) : ""}</td>
              <td className="text-right py-2">{row.closingCr ? fmt(row.closingCr) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold">
            <td className="py-2">Closing Balance</td>
            <td className="text-right py-2"></td>
            <td className="text-right py-2"></td>
            <td className="text-right py-2">{fmt(data.closingDr)}</td>
            <td className="text-right py-2">{fmt(data.closingCr)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}