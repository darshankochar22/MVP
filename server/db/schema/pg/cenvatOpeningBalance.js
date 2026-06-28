const { pgTable, bigint, bigserial, text, integer, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// CENVAT Opening Balance (Issue #147) — voucher-shaped singleton config (pg mirror).
// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id) ON DELETE CASCADE.
const cenvatOpeningBalance = pgTable('cenvat_opening_balance', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: integer('voucher_no').default(1),
  voucherDate: text('voucher_date'),
  cenvatCreditOf: text('cenvat_credit_of').default('Inputs'),
  taxUnit: text('tax_unit').default('Not Applicable'),
  gstRegistration: text('gst_registration'),
  narration: text('narration'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const cenvatOpeningBalanceLines = pgTable('cenvat_opening_balance_lines', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { cenvatOpeningBalance, cenvatOpeningBalanceLines };
