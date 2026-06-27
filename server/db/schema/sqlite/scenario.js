const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

// Mirrors server/scenario/scenario.js CREATE TABLE statements (SQLite ground truth).
// is_active / is_predefined / include_actuals are INTEGER 0/1 flags;
// created_at / updated_at are TEXT ISO datetime strings.
const scenarios = sqliteTable('scenarios', {
  scenarioId: integer('scenario_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  name: text('name').notNull(),
  includeActuals: integer('include_actuals').default(1),
  isActive: integer('is_active').default(1),
  isPredefined: integer('is_predefined').default(0),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

const scenarioIncludeVouchers = sqliteTable('scenario_include_vouchers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scenarioId: integer('scenario_id').notNull(),
  voucherTypeId: integer('voucher_type_id').notNull(),
  vouchersMode: text('vouchers_mode').default('Optional Vouchers Only'),
});

const scenarioExcludeVouchers = sqliteTable('scenario_exclude_vouchers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scenarioId: integer('scenario_id').notNull(),
  voucherTypeId: integer('voucher_type_id').notNull(),
  vouchersMode: text('vouchers_mode').default('Optional Vouchers Only'),
});

module.exports = {
  scenarios,
  scenarioIncludeVouchers,
  scenarioExcludeVouchers,
};
