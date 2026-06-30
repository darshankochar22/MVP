import { useState } from "react";
import Button from "@/components/ui/Button";
import type { WhatsappStatus } from "@/types/api/Whatsapp";

interface Props {
  companyId: number;
  status: WhatsappStatus | null;
  onSaved: () => void;
}

const ENV_VARS = [
  ["WHATSAPP_PROVIDER", "wati  (or 'meta')"],
  ["WHATSAPP_API_KEY", "your Wati API key / Meta access token"],
  ["WHATSAPP_BASE_URL", "https://live-server-xxxxx.wati.io  (Wati)"],
  ["WHATSAPP_NUMBER", "919876543210  (connected number)"],
  ["RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET", "optional — enables Pay Now links"],
];

export default function SettingsTab({ companyId, status, onSaved }: Props) {
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const syncTemplates = async () => {
    setSyncing(true);
    setMsg(null);
    const res = await window.api.whatsapp.syncTemplates(companyId);
    setSyncing(false);
    setMsg(res.success ? `Synced ${res.count ?? 0} templates.` : (res.error || "Sync failed."));
    onSaved();
  };

  const configured = !!status?.configured;

  return (
    <div className="p-4 max-w-3xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Status */}
        <div>
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Connection</h3>
          <dl className="text-xs space-y-1">
            <div className="flex justify-between"><dt className="text-zinc-500">Status</dt><dd className="font-semibold">{configured ? "Connected" : "Not configured"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Provider</dt><dd>{status?.provider || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Number</dt><dd>{status?.displayNumber || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">API key</dt><dd>{status?.masked || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Source</dt><dd>{status?.source === "env" ? "environment" : status?.source === "db" ? "legacy db" : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-zinc-500">Pay Now links</dt><dd>{status?.paymentGateway || "not configured"}</dd></div>
          </dl>

          <div className="flex items-center gap-3 mt-3">
            <Button variant="secondary" size="sm" onClick={syncTemplates} disabled={syncing || !configured}>
              {syncing ? "Syncing…" : "Sync templates"}
            </Button>
            {msg && <span className="text-[11px] text-zinc-600">{msg}</span>}
          </div>

          {!configured && (
            <p className="text-[11px] text-zinc-500 mt-3">
              WhatsApp credentials are set by the administrator on the server (environment variables), not here.
              Once configured, this panel shows “Connected”.
            </p>
          )}
        </div>

        {/* Developer setup */}
        <div className="border-l border-zinc-200 pl-6">
          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mb-2">Setup (administrator)</h3>
          <p className="text-[11px] text-zinc-500 mb-2">Set these environment variables on the machine running the app, then restart:</p>
          <div className="border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] text-zinc-700 space-y-1">
            {ENV_VARS.map(([k, v]) => (
              <div key={k}><span className="text-zinc-900 font-semibold">{k}</span>=<span className="text-zinc-500">{v}</span></div>
            ))}
          </div>

          <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider mt-4 mb-2">Onboarding checklist</h3>
          <ol className="text-[11px] text-zinc-600 list-decimal pl-4 space-y-1">
            <li>Create a Wati account &amp; register the WhatsApp number (Embedded Signup).</li>
            <li>Copy the API endpoint + API key into the env vars above.</li>
            <li>Get templates approved by Meta (invoice_share, payment_reminder, account_statement).</li>
            <li>Restart, then click <span className="font-semibold">Sync templates</span> to pull them in.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
