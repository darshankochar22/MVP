const { pgTable, bigint, bigserial, text, integer, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id)
// ON DELETE CASCADE. Singleton voucher header, one row per company. Issue #148.
const plaOpeningBalance = pgTable('pla_opening_balance', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: text('voucher_no'),
  voucherDate: text('voucher_date'),
  gstRegistration: text('gst_registration'),
  taxUnit: text('tax_unit').default('Not Applicable'),
  status: text('status').default('PLA Opening Balance'),
  narration: text('narration'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const plaOpeningBalanceLines = pgTable('pla_opening_balance_lines', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: integer('sort_order').default(0),
});

module.exports = { plaOpeningBalance, plaOpeningBalanceLines };
