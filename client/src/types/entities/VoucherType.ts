// Additional numbering details sub-screen rows (issue #143).
export interface NumberingRestartRow {
  applicable_from: string;
  starting_number: number;
  particulars: string;
}
export interface NumberingAffixRow {
  applicable_from: string;
  particulars: string;
}

// Name of Class rows — a named GST-ledger-mapping class per voucher type. Each ledger's own
// gst_tax_type (CGST/SGST/IGST/Cess, set on Ledger Create) decides its role — no separate
// per-slot naming here.
export interface VoucherClassRow {
  id: string;
  name: string;
  use_for_gst_details: "Yes" | "No";
  gst_ledger_ids: number[];
}

export interface VoucherTypeConfig {
  config_id?: number;
  voucher_type_id?: number;
  use_effective_dates?: number;
  allow_zero_value_transactions?: number;
  make_voucher_optional?: number;
  allow_narration?: number;
  allow_narration_per_ledger?: number;
  numbering_behaviour?: string;
  set_alter_additional_numbering?: number;
  show_unused_numbers?: number;
  prevent_duplicate_numbers?: number;
  whatsapp_after_save?: number;
  print_after_save?: number;
  // Additional numbering details (issue #143)
  starting_number?: number;
  width_of_numerical_part?: number;
  prefill_with_zero?: number;
  restart_numbering?: NumberingRestartRow[];
  prefix_details?: NumberingAffixRow[];
  suffix_details?: NumberingAffixRow[];
  voucher_classes?: VoucherClassRow[];
}

export interface VoucherTypeType {
  vt_id?: number;
  company_id?: number;
  name: string;
  alias?: string | null;
  short_name?: string;
  category?: string;
  numbering_method?: string;
  is_predefined?: number;
  is_active?: number;
  parent_vt_id?: number | null;
  parent_name?: string;
  created_at?: string;
  updated_at?: string;
  config?: VoucherTypeConfig;
}

export type VoucherTypeCreatePayload = {
  company_id: number;
  name: string;
  alias?: string | null;
  short_name?: string;
  category?: string;
  numbering_method?: string;
  is_active?: number;
  parent_vt_id?: number | null;
} & VoucherTypeConfig;

export type VoucherTypeUpdatePayload = {
  vt_id: number;
  name?: string;
  alias?: string | null;
  short_name?: string;
  category?: string;
  numbering_method?: string;
  is_active?: number;
  parent_vt_id?: number | null;
};

export type VoucherTypeConfigUpdatePayload = {
  voucher_type_id: number;
} & Omit<VoucherTypeConfig, 'config_id' | 'voucher_type_id'>;
