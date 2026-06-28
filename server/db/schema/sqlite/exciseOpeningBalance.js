const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/exciseOpeningBalance/exciseOpeningBalance.js CREATE TABLE.
// Singleton "Excise Opening Balance" voucher per company; PK == company_id,
// which is also a FK to companies(company_id). Issue #151.
const exciseOpeningBalance = sqliteTable('excise_opening_balance', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: text('voucher_no'),
  voucherDate: text('voucher_date'),
  gstRegistration: text('gst_registration'),
  taxUnit: text('tax_unit').default('Default Tax Unit'),
  status: text('status').default('Excise Opening Balance'),
  narration: text('narration'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Opening-balance line items: Particulars + Amount, ordered by sort_order.
const exciseOpeningBalanceLines = sqliteTable('excise_opening_balance_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { exciseOpeningBalance, exciseOpeningBalanceLines };
