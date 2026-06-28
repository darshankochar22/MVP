const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

// CENVAT Opening Balance (Issue #147) — voucher-shaped singleton config.
// One row per company; PK == company_id, which is also a FK to companies(company_id).
// Mirrors server/cenvatOpeningBalance/cenvatOpeningBalance.js CREATE TABLE.
const cenvatOpeningBalance = sqliteTable('cenvat_opening_balance', {
  companyId: integer('company_id').primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: integer('voucher_no').default(1),
  voucherDate: text('voucher_date'),
  cenvatCreditOf: text('cenvat_credit_of').default('Inputs'),
  taxUnit: text('tax_unit').default('Not Applicable'),
  gstRegistration: text('gst_registration'),
  narration: text('narration'),

  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

// Particulars/Amount voucher lines.
const cenvatOpeningBalanceLines = sqliteTable('cenvat_opening_balance_lines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { cenvatOpeningBalance, cenvatOpeningBalanceLines };
