const { pgTable, bigint, text, boolean, timestamp } = require('drizzle-orm/pg-core');
// pg mirror of the sqlite scenario tables.
// 0/1 flags -> BOOLEAN, ISO datetime TEXT -> TIMESTAMPTZ, INTEGER PK -> IDENTITY.
const scenarios = pgTable('scenarios', {
  scenarioId: bigint('scenario_id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  companyId: bigint('company_id', { mode: 'number' }).notNull(),
  name: text('name').notNull(),
  includeActuals: boolean('include_actuals').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  isPredefined: boolean('is_predefined').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const scenarioIncludeVouchers = pgTable('scenario_include_vouchers', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  scenarioId: bigint('scenario_id', { mode: 'number' }).notNull().references(() => scenarios.scenarioId),
  voucherTypeId: bigint('voucher_type_id', { mode: 'number' }).notNull(),
  vouchersMode: text('vouchers_mode').default('Optional Vouchers Only'),
});

const scenarioExcludeVouchers = pgTable('scenario_exclude_vouchers', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  scenarioId: bigint('scenario_id', { mode: 'number' }).notNull().references(() => scenarios.scenarioId),
  voucherTypeId: bigint('voucher_type_id', { mode: 'number' }).notNull(),
  vouchersMode: text('vouchers_mode').default('Optional Vouchers Only'),
});

module.exports = {
  scenarios,
  scenarioIncludeVouchers,
  scenarioExcludeVouchers,
};
