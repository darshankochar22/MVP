export interface VoucherEntryType {
  entry_id?: number;
  voucher_id?: number;
  ledger_id?: number;
  ledger_name?: string;
  type: string;
  amount?: number;
  amount_forex?: number;
  currency?: string;
  narration?: string;
}

export interface VoucherReceiptDetails {
  receipt_note_no?: string;
  receipt_doc_no?: string;
  dispatched_through?: string;
  destination?: string;
  carrier_name?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
}

export interface VoucherPartyDetails {
  supplier_name?: string;
  mailing_name?: string;
  address?: string;
  state?: string;
  country?: string;
}

export interface VoucherDispatchDetails {
  delivery_note_nos?: string;
  dispatch_doc_no?: string;
  dispatched_through?: string;
  destination?: string;
  carrier_name?: string;
  bill_of_lading_no?: string;
  bill_of_lading_date?: string;
  motor_vehicle_no?: string;
}

export interface VoucherRecordType {
  voucher_id?: number;
  company_id?: number;
  fy_id?: number;
  voucher_type: string;
  voucher_number?: string;
  date: string;
  status?: string;
  supplier_invoice_no?: string;
  supplier_invoice_date?: string;
  reference_number?: string;
  reference_date?: string;
  narration?: string;
  party_ledger_id?: number;
  party_name?: string;
  place_of_supply?: string;
  is_invoice?: number;
  is_accounting_voucher?: number;
  is_inventory_voucher?: number;
  is_order_voucher?: number;
  is_cancelled?: number;
  is_optional?: number;
  is_post_dated?: number;
  created_at?: string;
  updated_at?: string;
  entries?: VoucherEntryType[];
  receipt_details?: VoucherReceiptDetails | null;
  party_details?: VoucherPartyDetails | null;
  dispatch_details?: VoucherDispatchDetails | null;
}
