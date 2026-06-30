// window.api.whatsapp.* — WhatsApp Business CRM (config, outbound, inbox, templates, campaigns).
// Rows come straight from SQLite, so list shapes use snake_case keys.

export interface WhatsappStatus {
  success: boolean;
  configured?: boolean;
  source?: "env" | "db" | null;
  provider?: "meta" | "wati" | string;
  baseUrl?: string | null;
  displayNumber?: string | null;
  phoneNumberId?: string;
  wabaId?: string;
  masked?: string | null;
  paymentGateway?: string | null;
  error?: string;
}

export interface WhatsappResult {
  success: boolean;
  wamid?: string;
  error?: string;
  paymentLink?: string | null;
  [k: string]: unknown;
}

export interface WhatsappContact {
  contact_id: number;
  company_id: number;
  ledger_id?: number | null;
  name?: string | null;
  phone: string;
  last_message_at?: string | null;
  last_message_text?: string | null;
  unread_count?: number;
}

export interface WhatsappMessage {
  message_id: number;
  phone: string;
  direction: "in" | "out";
  type: string;
  body?: string | null;
  media_url?: string | null;
  wamid?: string | null;
  status?: string | null;
  ts?: string | null;
  created_at?: string | null;
}

export interface WhatsappLog {
  log_id: number;
  to_number: string;
  message_type: string;
  template_name?: string | null;
  status: string;
  wamid?: string | null;
  error?: string | null;
  sent_at: string;
}

export interface WhatsappTemplate {
  template_id: number;
  name: string;
  language?: string;
  category?: string | null;
  status?: string;
  body?: string | null;
}

export interface WhatsappCampaign {
  campaign_id: number;
  name: string;
  template_name?: string | null;
  audience?: string | null;
  total: number;
  sent: number;
  failed: number;
  status: string;
  created_at: string;
}

export interface CampaignRecipient {
  phone: string;
  params?: string[];
}

export interface WhatsappAPI {
  whatsapp: {
    getStatus: (company_id: number) => Promise<WhatsappStatus>;
    sendInvoice: (payload: {
      company_id: number; voucher_id?: number | null; to_phone: string;
      invoice_data: Record<string, unknown>;
    }) => Promise<WhatsappResult>;
    sendPaymentReminder: (payload: { company_id: number; to_phone: string; reminder_data: Record<string, unknown> }) => Promise<WhatsappResult>;
    sendStatement: (payload: { company_id: number; to_phone: string; statement_data: Record<string, unknown> }) => Promise<WhatsappResult>;
    sendText: (payload: { company_id: number; to_phone: string; message: string }) => Promise<WhatsappResult>;
    sendTemplate: (payload: { company_id: number; to_phone: string; template_name: string; params?: string[]; voucher_id?: number | null; language?: string }) => Promise<WhatsappResult>;
    sendDocument: (payload: { company_id: number; to_phone: string; data: Record<string, unknown>; voucher_id?: number | null }) => Promise<WhatsappResult>;
    getLogs: (payload: { company_id: number; limit?: number }) => Promise<{ success: boolean; logs: WhatsappLog[]; error?: string }>;
    getConversations: (company_id: number) => Promise<{ success: boolean; contacts: WhatsappContact[]; error?: string }>;
    getConversation: (payload: { company_id: number; phone: string }) => Promise<{ success: boolean; messages: WhatsappMessage[]; error?: string }>;
    syncConversation: (payload: { company_id: number; phone: string }) => Promise<{ success: boolean; messages: WhatsappMessage[]; error?: string }>;
    markRead: (payload: { company_id: number; phone: string }) => Promise<WhatsappResult>;
    reply: (payload: { company_id: number; phone: string; message: string }) => Promise<WhatsappResult>;
    importContacts: (payload: { company_id: number; contacts: Array<{ name?: string; phone: string; ledger_id?: number | null }> }) => Promise<{ success: boolean; added: number; error?: string }>;
    getTemplates: (company_id: number) => Promise<{ success: boolean; templates: WhatsappTemplate[]; error?: string }>;
    syncTemplates: (company_id: number) => Promise<{ success: boolean; count?: number; error?: string }>;
    getCampaigns: (company_id: number) => Promise<{ success: boolean; campaigns: WhatsappCampaign[]; error?: string }>;
    runCampaign: (payload: { company_id: number; name: string; template_name: string; audience?: string; recipients: CampaignRecipient[] }) => Promise<{ success: boolean; sent?: number; failed?: number; total?: number; error?: string }>;
  };
}
