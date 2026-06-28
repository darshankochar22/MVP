const { pgTable, bigint, bigserial, text, real, timestamp } = require('drizzle-orm/pg-core');
const { companies } = require('./company');

// company_id is a plain BIGINT PK (NOT identity) AND a FK to companies(company_id)
// ON DELETE CASCADE. Singleton "Excise Opening Balance" voucher per company. Issue #151.
const exciseOpeningBalance = pgTable('excise_opening_balance', {
  companyId: bigint('company_id', { mode: 'number' }).primaryKey().references(() => companies.companyId, { onDelete: 'cascade' }),

  voucherNo: text('voucher_no'),
  voucherDate: text('voucher_date'),
  gstRegistration: text('gst_registration'),
  taxUnit: text('tax_unit').default('Default Tax Unit'),
  status: text('status').default('Excise Opening Balance'),
  narration: text('narration'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

const exciseOpeningBalanceLines = pgTable('excise_opening_balance_lines', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  particulars: text('particulars').notNull(),
  amount: real('amount').default(0),
  sortOrder: bigint('sort_order', { mode: 'number' }).default(0),
});

module.exports = { exciseOpeningBalance, exciseOpeningBalanceLines };
