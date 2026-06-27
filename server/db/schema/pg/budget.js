const { pgTable, bigint, text, boolean, doublePrecision, timestamp } = require('drizzle-orm/pg-core');
// pg mirror of the sqlite budget tables.
// 0/1 flags -> BOOLEAN, ISO datetime TEXT -> TIMESTAMPTZ, INTEGER PK -> IDENTITY,
// REAL amounts -> DOUBLE PRECISION.
const budgets = pgTable('budgets', {
  budgetId: bigint('budget_id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  companyId: bigint('company_id', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  parentId: bigint('parent_id', { mode: 'number' }).references(() => budgets.budgetId),
  periodFrom: text('period_from'),
  periodTo: text('period_to'),
  isActive: boolean('is_active').notNull().default(true),
  isPredefined: boolean('is_predefined').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const budgetGroupAllocations = pgTable('budget_group_allocations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  budgetId: bigint('budget_id', { mode: 'number' }).notNull().references(() => budgets.budgetId),
  groupId: bigint('group_id', { mode: 'number' }).notNull(),
  costCentreId: bigint('cost_centre_id', { mode: 'number' }),
  typeOfBudget: text('type_of_budget').default('On Closing Balance'),
  amount: doublePrecision('amount').default(0),
});

const budgetLedgerAllocations = pgTable('budget_ledger_allocations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  budgetId: bigint('budget_id', { mode: 'number' }).notNull().references(() => budgets.budgetId),
  ledgerId: bigint('ledger_id', { mode: 'number' }).notNull(),
  costCentreId: bigint('cost_centre_id', { mode: 'number' }),
  typeOfBudget: text('type_of_budget').default('On Closing Balance'),
  amount: doublePrecision('amount').default(0),
});

const budgetCostCentreAllocations = pgTable('budget_cost_centre_allocations', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  budgetId: bigint('budget_id', { mode: 'number' }).notNull().references(() => budgets.budgetId),
  costCentreId: bigint('cost_centre_id', { mode: 'number' }).notNull(),
  expenses: doublePrecision('expenses').default(0),
  income: doublePrecision('income').default(0),
  closingBalance: doublePrecision('closing_balance').default(0),
});

module.exports = {
  budgets,
  budgetGroupAllocations,
  budgetLedgerAllocations,
  budgetCostCentreAllocations,
};
