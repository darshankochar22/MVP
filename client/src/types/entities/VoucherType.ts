export interface VoucherTypeConfig {
  config_id?: number;
  voucher_type_id?: number;
  use_effective_dates?: number;
  allow_zero_value_transactions?: number;
  make_voucher_optional?: number;
  allow_narration?: number;
  allow_narration_per_ledger?: number;
  whatsapp_after_save?: number;
  print_after_save?: number;
  enable_default_accounting_allocation?: number;
  track_additional_cost_for_purchase?: number;
  default_title_to_print?: string;
  use_for_pos_invoicing?: number;
  default_bank_id?: number;
  declaration?: string;
  set_alter_declaration?: number;
}

export interface VoucherTypeType {
  vt_id?: number;
  company_id?: number;
  name: string;
  short_name?: string;
  category?: string;
  default_voucher_class?: string;
  affects_inventory?: number;
  affects_accounting?: number;
  affects_gst?: number;
  numbering_method?: string;
  numbering_prefix?: string;
  numbering_suffix?: string;
  starts_with?: number;
  is_predefined?: number;
  is_active?: number;
  created_at?: string;
  updated_at?: string;
  config?: VoucherTypeConfig;
}

export type VoucherTypeCreatePayload = Omit<VoucherTypeType, 'vt_id' | 'created_at' | 'updated_at'> &
  VoucherTypeConfig & {
    company_id: number;
    name: string;
  };