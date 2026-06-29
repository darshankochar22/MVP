// window.api.automation.* — in-app assisted-entry endpoint.
// Mirrors server/automation/automationController.js. LLM-agnostic: exposes the voucher
// "response pattern", validates a payload (no write), and creates a real voucher.

export interface VoucherSchemaField {
  type: string;
  required?: boolean | string;
  note?: string;
  enum?: string[];
  format?: string;
  default?: unknown;
}

export interface VoucherSchema {
  title: string;
  description: string;
  fields: Record<string, VoucherSchemaField>;
  entry: Record<string, VoucherSchemaField>;
  rules: string[];
}

export interface VoucherSchemaResponse {
  schema: VoucherSchema;
  examples: Record<string, Record<string, unknown>>;
  voucherTypes: string[];
  rules: string[];
}

export interface AutomationValidateResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface AutomationCreateResult {
  success: boolean;
  voucher_id?: number;
  voucher_number?: string;
  errors?: string[];
  warnings?: string[];
}

export interface AutomationAPI {
  automation: {
    getVoucherSchema: () => Promise<VoucherSchemaResponse>;
    validateVoucher: (payload: Record<string, unknown>) => Promise<AutomationValidateResult>;
    createVoucher: (payload: Record<string, unknown>) => Promise<AutomationCreateResult>;
  };
}
