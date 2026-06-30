import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useCompany } from "@/context/CompanyContext";
import { TallyReportLayout } from "@/components/tally-ui/TallyReportLayout";
import { TableRow, TableCell } from "@/components/shadcn/table";
import { DataTableCard } from "@/components/blocks/DataTableCard";
import { EmptyState } from "@/components/blocks/EmptyState";

interface ReturnActivity {
  name: string;
  corrections: number;
  pending_upload: number | null;
  recon_exceptions: number;
  pending_file: number | null;
}

// 0 / empty → "No"; a positive count is shown as-is; null → blank (not applicable).
const cntCell = (n: number | null) => (n === null ? "" : n > 0 ? String(n) : "No");
const ynCell = (n: number | null) => (n === null ? "" : n > 0 ? "Yes" : "No");

export default function TrackGSTReturnActivities() {
  const { selectedCompany, activeFY } = useCompany();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activities, setActivities] = useState<Record<string, ReturnActivity>>({});
  const [periodLabel, setPeriodLabel] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      if (!selectedCompany?.company_id) return;
      try {
        setLoading(true);
        const [regRes, actRes] = await Promise.all([
          window.api.gstRegistration.getAll(selectedCompany.company_id),
          activeFY?.fy_id
            ? window.api.gst.getReturnActivities({ company_id: selectedCompany.company_id, fy_id: activeFY.fy_id })
            : Promise.resolve({ success: false } as any),
        ]);
        setRegistrations(regRes.success && regRes.gstRegistrations?.length ? regRes.gstRegistrations : []);
        if (actRes.success && actRes.activities) {
          const byName: Record<string, ReturnActivity> = {};
          for (const r of actRes.activities.returns) byName[r.name] = r;
          setActivities(byName);
          setPeriodLabel(actRes.activities.period_label || "");
        }
      } catch (e) {
        console.error("Failed to fetch GST return activities", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCompany, activeFY]);

  const renderReturnRow = (name: string, route?: string) => {
    const a = activities[name];
    return (
      <TableRow
        className={`hover:bg-[#e6f2ff] cursor-pointer${name.startsWith("GSTR-2") ? " text-gray-600" : ""}`}
        onClick={route ? () => navigate(route, { state: { registration: registrations[0] } }) : undefined}
      >
        <TableCell className="px-8 py-0.5">{name}</TableCell>
        <TableCell className="w-24 text-center py-0.5">{a ? cntCell(a.corrections) : "—"}</TableCell>
        <TableCell className="w-24 text-center py-0.5">{a ? cntCell(a.pending_upload) : ""}</TableCell>
        <TableCell className="w-24 text-center py-0.5">{a ? cntCell(a.recon_exceptions) : ""}</TableCell>
        <TableCell className="w-24 text-center py-0.5">{a ? ynCell(a.pending_file) : ""}</TableCell>
      </TableRow>
    );
  };

  return (
    <TallyReportLayout
      title="Track GST Return Activities"
      companyName={selectedCompany?.name || "Company"}
      leftSubtitle={
        <>
          <div>GST Registration : <span className="font-bold">All Registrations</span></div>
          <div>Reports to Display : <span className="font-bold">All Returns</span></div>
        </>
      }
      rightSubtitle={
        <div>{periodLabel || (activeFY ? `${activeFY.start_date} to ${activeFY.end_date}` : "")}</div>
      }
    >
      <div className="w-full font-sans text-xs">
        <DataTableCard
          columns={[
            { header: "Particulars" },
            { header: "Corrections Needed", className: "text-center w-24" },
            { header: "Pending for Upload", className: "text-center w-24" },
            { header: "Exceptions In Reconciliation", className: "text-center w-24" },
            { header: "Pending to Be Filed", className: "text-center w-24" },
          ]}
          maxHeight="100%"
        >
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="p-0">
                <EmptyState message="Loading..." />
              </TableCell>
            </TableRow>
          ) : registrations.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="p-0">
                <EmptyState message="No GST Registrations found." />
              </TableCell>
            </TableRow>
          ) : (
            registrations.map((reg) => (
              <Fragment key={reg.gst_id}>
                {/* Registration Row */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="bg-[#ffeb9c] font-bold px-2 py-1 text-black">
                    {reg.state_id ? `${reg.state_id} Registration` : (reg.gst_username || reg.gstin || "Registration")}
                  </TableCell>
                </TableRow>

                {/* Period Row */}
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="px-4 py-1 font-bold text-black">
                    {periodLabel || "Current Period"}
                  </TableCell>
                </TableRow>

                {/* Returns — real status from books */}
                {renderReturnRow("GSTR-1", "/master/statutory/gstr1")}
                {renderReturnRow("GSTR-2A", "/master/statutory/gstr2a/reconciliation")}
                {renderReturnRow("GSTR-2B", "/master/statutory/gstr2b/reconciliation")}
                {renderReturnRow("GSTR-3B", "/master/statutory/gstr3b")}
              </Fragment>
            ))
          )}
        </DataTableCard>
      </div>
    </TallyReportLayout>
  );
}
