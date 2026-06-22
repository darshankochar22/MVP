import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";

interface ChildGroup {
  group_id: number;
  group_name: string;
  dr: number;
  cr: number;
}

interface LedgerRow {
  ledger_id: number;
  ledger_name: string;
  dr: number;
  cr: number;
}

interface GroupSummaryResponse {
  success: boolean;
  group_name: string;
  childGroups: ChildGroup[];
  ledgers: LedgerRow[];
  totalDr: number;
  totalCr: number;
  error?: string;
}

export default function GroupSummaryLayout() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { selectedCompany, activeFY } = useCompany();

  const [data, setData] = React.useState<GroupSummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!groupId || !selectedCompany?.company_id || !activeFY?.fy_id) return;
    setLoading(true);
    setError(null);
    (window as any).api.report
      .groupSummaryDrilldown(selectedCompany.company_id, activeFY.fy_id, Number(groupId))
      .then((res: GroupSummaryResponse) => {
        if (res.success) {
          setData(res);
        } else {
          setError(res.error || "Failed to load group summary");
        }
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId, selectedCompany?.company_id, activeFY?.fy_id]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;
  if (!data) return null;

  const fmt = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          className="text-sm text-muted-foreground hover:underline"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h2 className="text-lg font-semibold">{data.group_name}</h2>
        <div />
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b font-medium text-muted-foreground">
            <th className="text-left py-2">Particulars</th>
            <th className="text-right py-2">Debit</th>
            <th className="text-right py-2">Credit</th>
          </tr>
        </thead>
        <tbody>
          {data.childGroups.map((g) => (
            <tr
              key={`g-${g.group_id}`}
              className="border-b hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/reports/accounts/group-summary/${g.group_id}`)}
            >
              <td className="py-2 font-medium">{g.group_name}</td>
              <td className="text-right py-2">{g.dr ? fmt(g.dr) : ""}</td>
              <td className="text-right py-2">{g.cr ? fmt(g.cr) : ""}</td>
            </tr>
          ))}

          {data.ledgers.map((l) => (
            <tr
              key={`l-${l.ledger_id}`}
              className="border-b hover:bg-muted/50 cursor-pointer"
              onClick={() => navigate(`/reports/accounts/ledger-summary/${l.ledger_id}`)}
            >
              <td className="py-2 pl-4">{l.ledger_name}</td>
              <td className="text-right py-2">{l.dr ? fmt(l.dr) : ""}</td>
              <td className="text-right py-2">{l.cr ? fmt(l.cr) : ""}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t font-semibold">
            <td className="py-2">Total</td>
            <td className="text-right py-2">{fmt(data.totalDr)}</td>
            <td className="text-right py-2">{fmt(data.totalCr)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}