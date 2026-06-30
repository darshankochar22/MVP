import { useEffect, useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import type { WhatsappTemplate, WhatsappContact } from "@/types/api/Whatsapp";

interface Props { companyId: number; configured: boolean; }

// Count {{1}}..{{n}} placeholders in a template body.
const countParams = (body?: string | null) => {
  if (!body) return 0;
  const nums = [...body.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1]));
  return nums.length ? Math.max(...nums) : 0;
};

export default function ComposeTab({ companyId, configured }: Props) {
  const [mode, setMode] = useState<"text" | "template">("text");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [contacts, setContacts] = useState<WhatsappContact[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [params, setParams] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    window.api.whatsapp.getTemplates(companyId).then((r) => setTemplates(r.success ? r.templates : []));
    window.api.whatsapp.getConversations(companyId).then((r) => setContacts(r.success ? r.contacts : []));
  }, [companyId]);

  const selectedTemplate = useMemo(() => templates.find((t) => t.name === templateName), [templates, templateName]);
  const paramCount = countParams(selectedTemplate?.body);

  useEffect(() => { setParams(Array(paramCount).fill("")); }, [paramCount, templateName]);

  const send = async () => {
    if (!phone.trim()) { setResult({ ok: false, text: "Enter a recipient number." }); return; }
    setSending(true);
    setResult(null);
    let res;
    if (mode === "text") {
      res = await window.api.whatsapp.sendText({ company_id: companyId, to_phone: phone.trim(), message });
    } else {
      if (!templateName) { setSending(false); setResult({ ok: false, text: "Pick a template." }); return; }
      res = await window.api.whatsapp.sendTemplate({ company_id: companyId, to_phone: phone.trim(), template_name: templateName, params });
    }
    setSending(false);
    setResult(res.success ? { ok: true, text: "Sent ✓" } : { ok: false, text: res.error || "Failed to send." });
    if (res.success && mode === "text") setMessage("");
  };

  return (
    <div className="p-4 max-w-2xl">
      <div className="flex gap-2 mb-4">
        <Button variant={mode === "text" ? "primary" : "secondary"} size="sm" onClick={() => setMode("text")}>Session message</Button>
        <Button variant={mode === "template" ? "primary" : "secondary"} size="sm" onClick={() => setMode("template")}>Template</Button>
      </div>

      <div className="grid grid-cols-[160px_1fr] items-start gap-3">
        <label className="text-xs text-zinc-600 pt-1.5">Recipient</label>
        <div>
          <Input list="wa-contacts" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="919876543210" />
          <datalist id="wa-contacts">
            {contacts.map((c) => <option key={c.contact_id} value={c.phone}>{c.name || c.phone}</option>)}
          </datalist>
          {mode === "text" && (
            <div className="text-[10px] text-zinc-400 mt-0.5">Free-text only works within 24h of the customer's last message; otherwise use a template.</div>
          )}
        </div>

        {mode === "text" ? (
          <>
            <label className="text-xs text-zinc-600 pt-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full text-xs text-zinc-900 border border-zinc-300 p-2 outline-none focus:border-zinc-800 resize-y"
              placeholder="Type your message…"
            />
          </>
        ) : (
          <>
            <label className="text-xs text-zinc-600 pt-1.5">Template</label>
            <div>
              <Select
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Select a template…"
                options={templates.map((t) => ({ value: t.name, label: `${t.name} (${t.status || "?"})` }))}
              />
              {selectedTemplate?.body && (
                <div className="text-[11px] text-zinc-500 mt-1 border border-zinc-200 bg-zinc-50 p-2 whitespace-pre-wrap">{selectedTemplate.body}</div>
              )}
            </div>

            {paramCount > 0 && (
              <>
                <label className="text-xs text-zinc-600 pt-1.5">Parameters</label>
                <div className="space-y-1.5">
                  {params.map((p, i) => (
                    <Input key={i} value={p} onChange={(e) => setParams(params.map((v, j) => (j === i ? e.target.value : v)))} placeholder={`{{${i + 1}}}`} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Button variant="primary" size="sm" onClick={send} disabled={sending || !configured}>
          {sending ? "Sending…" : "Send"}
        </Button>
        {!configured && <span className="text-[11px] text-zinc-500">Connect WhatsApp in Settings first.</span>}
        {result && <span className={`text-[11px] ${result.ok ? "text-zinc-600" : "text-zinc-900 font-semibold"}`}>{result.text}</span>}
      </div>
    </div>
  );
}
