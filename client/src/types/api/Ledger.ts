import type { LedgerType } from '../entities/Ledger';

export interface LedgerAPI {
  ledger: {
    create: (data: Partial<LedgerType>) => Promise<{ success: boolean; ledger: LedgerType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; ledgers: LedgerType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; ledger: LedgerType; error?: string }>;
    update: (data: Partial<LedgerType>) => Promise<{ success: boolean; ledger: LedgerType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
    getByGroup: (company_id: number, groupId: number) => Promise<{ success: boolean; ledgers: LedgerType[]; error?: string }>;
    updateCreditLimits: (
      company_id: number,
      rows: CreditLimitRow[],
    ) => Promise<{ success: boolean; updated?: number; error?: string }>;
  };
}

export interface CreditLimitRow {
  ledger_id: number;
  credit_limit: number;
  credit_limit_type: string;
  credit_period: number;
  check_credit_days: number;
}
