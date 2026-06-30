import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import type { WhatsappTemplate } from "@/types/api/Whatsapp";

interface Props { companyId: number; configured: boolean; }

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Name", span: "col-span-3" },
  { key: "language", label: "Lang", span: "col-span-1", render: (r) => r.language || "en" },
  { key: "category", label: "Category", span: "col-span-2", render: (r) => r.category || "—" },
  { key: "status", label: "Status", span: "col-span-2", render: (r) => <span className={r.status === "APPROVED" ? "" : "font-bold"}>{r.status || "—"}</span> },
  { key: "body", label: "Body", span: "col-span-4", render: (r) => <span className="text-zinc-500 truncate" title={r.body || ""}>{r.body || ""}</span> },
];

export default function TemplatesTab({ companyId, configured }: Props) {
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await window.api.whatsapp.getTemplates(companyId);
    setTemplates(res.success ? res.templates : []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    setMsg(null);
    const res = await window.api.whatsapp.syncTemplates(companyId);
    setSyncing(false);
    setMsg(res.success ? `Synced ${res.count ?? 0} templates.` : (res.error || "Sync failed."));
    if (res.success) load();
  };

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-zinc-500">
          {templates.length} template(s). Templates are created &amp; approved in your provider dashboard, then synced here.
        </span>
        <div className="flex items-center gap-2">
          {msg && <span className="text-[11px] text-zinc-600">{msg}</span>}
          <Button variant="secondary" size="sm" onClick={sync} disabled={syncing || !configured}>
            {syncing ? "Syncing…" : "Sync from provider"}
          </Button>
        </div>
      </div>
      <DataTable
        columns={COLUMNS}
        rows={templates}
        rowKey={(r) => r.template_id}
        loading={loading}
        variant="report"
        emptyMessage={configured ? "No templates yet — click Sync from provider." : "Connect WhatsApp in Settings first."}
      />
    </div>
  );
}
