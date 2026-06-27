import type { BudgetType } from '../entities/Budget';

export interface BudgetAPI {
  budget: {
    create: (data: Partial<BudgetType>) => Promise<{ success: boolean; budget: BudgetType; error?: string }>;
    getAll: (company_id: number) => Promise<{ success: boolean; budgets: BudgetType[]; error?: string }>;
    getById: (id: number) => Promise<{ success: boolean; budget: BudgetType; error?: string }>;
    update: (data: Partial<BudgetType>) => Promise<{ success: boolean; budget: BudgetType; error?: string }>;
    delete: (id: number) => Promise<{ success: boolean; error?: string }>;
  };
}
