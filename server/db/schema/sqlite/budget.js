const { sqliteTable, text, integer, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Mirrors server/budget/budget.js CREATE TABLE statements (SQLite ground truth).
// is_active / is_predefined are INTEGER 0/1 flags; created_at / updated_at are
// TEXT ISO datetime strings; amounts are REAL.
const budgets = sqliteTable('budgets', {
  budgetId: integer('budget_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  parentId: integer('parent_id'),
  periodFrom: text('period_from'),
  periodTo: text('period_to'),
  isActive: integer('is_active').default(1),
  isPredefined: integer('is_predefined').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

const budgetGroupAllocations = sqliteTable('budget_group_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetId: integer('budget_id').notNull(),
  groupId: integer('group_id').notNull(),
  costCentreId: integer('cost_centre_id'),
  typeOfBudget: text('type_of_budget').default('On Closing Balance'),
  amount: real('amount').default(0),
});

const budgetLedgerAllocations = sqliteTable('budget_ledger_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetId: integer('budget_id').notNull(),
  ledgerId: integer('ledger_id').notNull(),
  costCentreId: integer('cost_centre_id'),
  typeOfBudget: text('type_of_budget').default('On Closing Balance'),
  amount: real('amount').default(0),
});

const budgetCostCentreAllocations = sqliteTable('budget_cost_centre_allocations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetId: integer('budget_id').notNull(),
  costCentreId: integer('cost_centre_id').notNull(),
  expenses: real('expenses').default(0),
  income: real('income').default(0),
  closingBalance: real('closing_balance').default(0),
});

module.exports = {
  budgets,
  budgetGroupAllocations,
  budgetLedgerAllocations,
  budgetCostCentreAllocations,
};
