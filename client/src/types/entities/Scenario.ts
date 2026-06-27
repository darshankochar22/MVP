export type ScenarioVouchersMode = 'Optional Vouchers Only' | 'All Vouchers';

export interface ScenarioVoucher {
  id?: number;
  scenario_id?: number;
  voucher_type_id: number;
  vouchers_mode?: ScenarioVouchersMode;
}

export interface ScenarioType {
  scenario_id?: number;
  company_id?: number;
  name: string;
  include_actuals?: number;
  is_active?: number;
  is_predefined?: number;
  created_at?: string;
  updated_at?: string;
  // Populated by getById (and returned by create/update).
  includes?: ScenarioVoucher[];
  excludes?: ScenarioVoucher[];
}
