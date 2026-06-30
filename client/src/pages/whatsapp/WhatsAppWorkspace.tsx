import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullScreenPanel from "@/components/ui/FullScreenPanel";
import Tabs from "@/components/ui/Tabs";
import { useCompany } from "@/context/CompanyContext";
import type { WhatsappStatus } from "@/types/api/Whatsapp";

import InboxTab from "./tabs/InboxTab";
import ComposeTab from "./tabs/ComposeTab";
import CampaignsTab from "./tabs/CampaignsTab";
import TemplatesTab from "./tabs/TemplatesTab";
import LogTab from "./tabs/LogTab";
import SettingsTab from "./tabs/SettingsTab";

const TABS = [
  { value: "inbox", label: "Inbox" },
  { value: "compose", label: "Compose" },
  { value: "campaigns", label: "Campaigns" },
  { value: "templates", label: "Templates" },
  { value: "log", label: "Message Log" },
  { value: "settings", label: "Settings" },
];

export default function WhatsAppWorkspace() {
  const navigate = useNavigate();
  const { tab } = useParams();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.company_id;

  const active = TABS.some((t) => t.value === tab) ? (tab as string) : "inbox";
  const [status, setStatus] = useState<WhatsappStatus | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!companyId) return;
    const st = await window.api.whatsapp.getStatus(companyId);
    setStatus(st);
  }, [companyId]);

  useEffect(() => { refreshStatus(); }, [refreshStatus]);

  if (!companyId) {
    return (
      <FullScreenPanel title="WhatsApp Business" onClose={() => navigate("/")}>
        <div className="p-6 text-xs text-zinc-500">Select a company first.</div>
      </FullScreenPanel>
    );
  }

  const configured = status?.configured;

  return (
    <FullScreenPanel
      title="WhatsApp Business"
      periodLabel={configured ? `Connected · ${(status?.provider || "").toUpperCase()}` : "Not connected"}
      onClose={() => navigate("/")}
    >
      <div className="flex flex-col min-h-full">
        <div className="sticky top-0 z-10 bg-white">
          <Tabs tabs={TABS} value={active} onChange={(v) => navigate(`/whatsapp/${v}`)} />
          {configured === false && active !== "settings" && (
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 bg-zinc-50 text-[11px] text-zinc-600">
              <span>WhatsApp isn't configured on this server yet — set the WHATSAPP_* environment variables.</span>
              <button onClick={() => navigate("/whatsapp/settings")} className="font-semibold underline hover:text-zinc-900">
                Setup info →
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {active === "inbox" && <InboxTab companyId={companyId} configured={!!configured} />}
          {active === "compose" && <ComposeTab companyId={companyId} configured={!!configured} />}
          {active === "campaigns" && <CampaignsTab companyId={companyId} configured={!!configured} />}
          {active === "templates" && <TemplatesTab companyId={companyId} configured={!!configured} />}
          {active === "log" && <LogTab companyId={companyId} />}
          {active === "settings" && <SettingsTab companyId={companyId} status={status} onSaved={refreshStatus} />}
        </div>
      </div>
    </FullScreenPanel>
  );
}
