const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// Mirrors server/plaOpeningBalance/plaOpeningBalance.js CREATE TABLE.
// One row per company (singleton voucher header); PK == company_id, which is
// also a FK to companies(company_id). Issue #148.
const plaOpeningBalance = sqliteTable('pla_opening_balance', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: text('voucher_no'),
  voucherDate: text('voucher_date'),
  gstRegistration: text('gst_registration'),
  taxUnit: text('tax_unit').default('Not Applicable'),
  status: text('status').default('PLA Opening Balance'),
  narration: text('narration'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Voucher ledger lines — Particulars (ledger name) + Amount.
const plaOpeningBalanceLines = sqliteTable('pla_opening_balance_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { plaOpeningBalance, plaOpeningBalanceLines };
