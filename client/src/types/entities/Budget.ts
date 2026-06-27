export type BudgetType_OfBudget = 'On Closing Balance' | 'On Nett Transactions';

export interface BudgetGroupAllocation {
  id?: number;
  budget_id?: number;
  group_id: number;
  cost_centre_id?: number | null;
  type_of_budget?: BudgetType_OfBudget;
  amount?: number;
}

export interface BudgetLedgerAllocation {
  id?: number;
  budget_id?: number;
  ledger_id: number;
  cost_centre_id?: number | null;
  type_of_budget?: BudgetType_OfBudget;
  amount?: number;
}

export interface BudgetCostCentreAllocation {
  id?: number;
  budget_id?: number;
  cost_centre_id: number;
  expenses?: number;
  income?: number;
  closing_balance?: number;
}

export interface BudgetType {
  budget_id?: number;
  company_id?: number;
  name: string;
  parent_id?: number | null;
  period_from?: string;
  period_to?: string;
  is_active?: number;
  is_predefined?: number;
  created_at?: string;
  updated_at?: string;
  // Populated by getById (and returned by create/update).
  groups?: BudgetGroupAllocation[];
  ledgers?: BudgetLedgerAllocation[];
  costCentres?: BudgetCostCentreAllocation[];
}
