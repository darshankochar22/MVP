export interface CompanyType {
  id?: number;
  company_id?: number;
  name: string;
  mailing_name?: string;
  address1?: string;
  address2?: string;
  state?: string;
  country?: string;
  pincode?: string;
  telephone?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
  base_currency_symbol?: string;
  formal_name?: string;
  financial_year_beginning_from?: string;
  books_beginning_from?: string;
  password?: string;
  access_control?: string;
  edit_log?: string;
  created_at?: string;
}

export interface FYType {
  id?: number;
  company_id?: number;
  start_date: string;
  end_date: string;
  is_active?: number;
}

export interface GenericModel {
  id?: number;
  [key: string]: string | number | boolean | undefined | null;
}

export interface LedgerType {
  id?: number;
  ledger_id?: number;
  company_id?: number;
  group_id?: number;
  name: string;
  alias?: string;
  ledger_type?: string;          
  nature?: string;
  opening_balance?: number;      
  closing_balance?: number;      
  is_bill_wise?: number;         
  maintain_inventory_values?: number; 
  mailing_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  pan?: string;
  registration_type?: string;    
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  is_active?: number;            
  is_predefined?: number;        
  created_at?: string;
  updated_at?: string;
}

export interface VoucherType {
  voucher_id?: number;
  company_id?: number;
  fy_id?: number;
  voucher_type: string;
  voucher_number?: string;
  date: string;
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
  entries?: VoucherEntry[];
}

export interface VoucherEntry {
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

export interface DaybookEntry extends VoucherType {
  id?: number;
  vchType?: string;
  vchNo?: string;
  particulars?: string;
  debit?: number;
  credit?: number;
}

declare global {
  interface Window {
    api: {
      company: {
        create: (data: Partial<CompanyType>) => Promise<CompanyType>
        getAll: () => Promise<CompanyType[]>
        getById: (id: number) => Promise<CompanyType>
        update: (data: Partial<CompanyType>) => Promise<CompanyType>
        delete: (id: number) => Promise<boolean>
        verifyPassword: (data: { id: number; password: string }) => Promise<boolean>
      }

      fy: {
        create: (data: Partial<FYType>) => Promise<FYType>
        getAll: () => Promise<FYType[]>
        getById: (id: number) => Promise<FYType>
        setActive: (id: number) => Promise<boolean>
        delete: (id: number) => Promise<boolean>
      }

      group: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getTree: () => Promise<GenericModel[]>
      }

      ledger: {
        create: (data: Partial<LedgerType>) => Promise<LedgerType>
        getAll: () => Promise<LedgerType[]>
        getById: (id: number) => Promise<LedgerType>
        update: (data: Partial<LedgerType>) => Promise<LedgerType>
        delete: (id: number) => Promise<boolean>
        getByGroup: (groupId: number) => Promise<LedgerType[]>
      }

      costCentre: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getTree: () => Promise<GenericModel[]>
      }

      unit: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
      }

      stockGroup: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getTree: () => Promise<GenericModel[]>
      }

      stockCategory: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
      }

      stockItem: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getByGroup: (groupId: number) => Promise<GenericModel[]>
        getByCategory: (categoryId: number) => Promise<GenericModel[]>
      }

      godown: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getTree: () => Promise<GenericModel[]>
      }

      voucher: {
        create: (data: Partial<VoucherType>) => Promise<VoucherType>
        getAll: () => Promise<VoucherType[]>
        getById: (id: number) => Promise<VoucherType>
        update: (data: Partial<VoucherType>) => Promise<VoucherType>
        delete: (id: number) => Promise<boolean>
        cancel: (id: number) => Promise<boolean>
        getDaybook: (filters: Record<string, unknown>) => Promise<DaybookEntry[]>
        getByType: (type: string) => Promise<VoucherType[]>
        getByLedger: (ledgerId: number) => Promise<VoucherType[]>
      }

      report: {
        trialBalance: (filters: Record<string, unknown>) => Promise<unknown[]>
        balanceSheet: (filters: Record<string, unknown>) => Promise<unknown[]>
        profitLoss: (filters: Record<string, unknown>) => Promise<unknown[]>
        ledgerReport: (filters: Record<string, unknown>) => Promise<unknown[]>
        cashBook: (filters: Record<string, unknown>) => Promise<unknown[]>
        bankBook: (filters: Record<string, unknown>) => Promise<unknown[]>
        daybook: (filters: Record<string, unknown>) => Promise<DaybookEntry[]>
      }

      banking: {
        getUnreconciled: (ledgerId: number) => Promise<unknown[]>
        reconcile: (data: Record<string, unknown>) => Promise<boolean>
        unreconcile: (data: Record<string, unknown>) => Promise<boolean>
        getStatement: (filters: Record<string, unknown>) => Promise<unknown[]>
        getSummary: (ledgerId: number) => Promise<unknown>
      }

      currency: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        setDefault: (id: number) => Promise<boolean>
      }

      voucherType: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
        getConfig: (id: number) => Promise<GenericModel>
        updateConfig: (data: Partial<GenericModel>) => Promise<GenericModel>
      }

      gstRegistration: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
      }

      gstClassification: {
        create: (data: Partial<GenericModel>) => Promise<GenericModel>
        getAll: () => Promise<GenericModel[]>
        getById: (id: number) => Promise<GenericModel>
        update: (data: Partial<GenericModel>) => Promise<GenericModel>
        delete: (id: number) => Promise<boolean>
      }
    }
  }
}
