import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable, { type TableColumn } from "@/components/ui/DataTable";
import type { WhatsappCampaign, WhatsappTemplate, WhatsappContact } from "@/types/api/Whatsapp";

interface Props { companyId: number; configured: boolean; }

const COLUMNS: TableColumn[] = [
  { key: "name", label: "Campaign", span: "col-span-3" },
  { key: "template_name", label: "Template", span: "col-span-3", render: (r) => r.template_name || "—" },
  { key: "total", label: "Total", span: "col-span-1", align: "right" },
  { key: "sent", label: "Sent", span: "col-span-1", align: "right" },
  { key: "failed", label: "Failed", span: "col-span-1", align: "right", render: (r) => <span className={r.failed ? "font-bold" : ""}>{r.failed}</span> },
  { key: "status", label: "Status", span: "col-span-1" },
  { key: "created_at", label: "Created", span: "col-span-2" },
];

export default function CampaignsTab({ companyId, configured }: Props) {
  const [campaigns, setCampaigns] = useState<WhatsappCampaign[]>([]);
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [contacts, setContacts] = useState<WhatsappContact[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [c, t, ct] = await Promise.all([
      window.api.whatsapp.getCampaigns(companyId),
      window.api.whatsapp.getTemplates(companyId),
      window.api.whatsapp.getConversations(companyId),
    ]);
    setCampaigns(c.success ? c.campaigns : []);
    setTemplates(t.success ? t.templates : []);
    setContacts(ct.success ? ct.contacts : []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    if (!templateName) { setMsg("Pick a template."); return; }
    if (!contacts.length) { setMsg("No contacts — import parties first (Compose tab uses the same list)."); return; }
    setRunning(true);
    setMsg(null);
    const recipients = contacts.map((c) => ({ phone: c.phone, params: [c.name || "Customer"] }));
    const res = await window.api.whatsapp.runCampaign({
      company_id: companyId,
      name: name.trim() || templateName,
      template_name: templateName,
      audience: `${recipients.length} contacts`,
      recipients,
    });
    setRunning(false);
    setMsg(res.success ? `Done — ${res.sent}/${res.total} sent, ${res.failed} failed.` : (res.error || "Campaign failed."));
    setName("");
    load();
  };

  return (
    <div className="p-3">
      {/* New campaign */}
      <div className="border border-zinc-200 p-3 mb-4">
        <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">New broadcast</h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <label className="text-[10px] text-zinc-500 block mb-0.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. October offers" />
          </div>
          <div className="w-64">
            <label className="text-[10px] text-zinc-500 block mb-0.5">Template</label>
            <Select value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Select template…"
              options={templates.map((t) => ({ value: t.name, label: t.name }))} />
          </div>
          <div className="text-[11px] text-zinc-500 pb-2">Audience: <span className="font-semibold text-zinc-800">{contacts.length}</span> contacts</div>
          <Button variant="primary" size="sm" onClick={run} disabled={running || !configured}>
            {running ? "Sending…" : "Run broadcast"}
          </Button>
          {msg && <span className="text-[11px] text-zinc-700 pb-2">{msg}</span>}
        </div>
      </div>

      <DataTable
        columns={COLUMNS}
        rows={campaigns}
        rowKey={(r) => r.campaign_id}
        loading={loading}
        variant="report"
        emptyMessage="No campaigns yet."
      />
    </div>
  );
}
