// Per-ledger credit-limit row edited in the "Credit Limits" master
// (Multi Ledger Limit Alteration). Backed by columns on the ledgers table.
export interface CreditLimitRow {
  ledger_id: number;
  name: string;
  credit_limit: number;
  credit_limit_type: string; // 'Cr' | 'Dr'
  credit_period: number;     // days
  check_credit_days: number; // 0 | 1
}
