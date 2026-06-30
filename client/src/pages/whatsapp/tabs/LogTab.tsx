import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import type { WhatsappLog } from "@/types/api/Whatsapp";

const COLUMNS: TableColumn[] = [
  { key: "sent_at", label: "Sent", span: "col-span-3" },
  { key: "to_number", label: "To", span: "col-span-2" },
  { key: "message_type", label: "Type", span: "col-span-2" },
  { key: "template_name", label: "Template", span: "col-span-2", render: (r) => r.template_name || "—" },
  { key: "status", label: "Status", span: "col-span-1", render: (r) => <span className={r.status === "FAILED" ? "font-bold" : ""}>{r.status}</span> },
  { key: "error", label: "Error", span: "col-span-2", render: (r) => <span className="text-zinc-500 truncate" title={r.error || ""}>{r.error || ""}</span> },
];

export default function LogTab({ companyId }: { companyId: number }) {
  const [logs, setLogs] = useState<WhatsappLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await window.api.whatsapp.getLogs({ company_id: companyId, limit: 200 });
    setLogs(res.success ? res.logs : []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-zinc-500">{logs.length} message(s)</span>
        <Button variant="secondary" size="sm" onClick={load}>Refresh</Button>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={logs}
        rowKey={(r) => r.log_id}
        loading={loading}
        variant="report"
        emptyMessage="No messages sent yet."
      />
    </div>
  );
}
