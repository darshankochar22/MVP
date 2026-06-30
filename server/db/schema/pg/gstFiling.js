const { pgTable, bigint, integer, text, timestamp } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

const gstFilings = pgTable('gst_filings', {
  filingId: bigint('filing_id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  fyId: bigint('fy_id', { mode: 'number' }),
  returnType: text('return_type').notNull(),
  returnPeriod: text('return_period').notNull(),
  status: text('status').default('DRAFT'),
  arn: text('arn'),
  referenceId: text('reference_id'),
  summary: text('summary'),
  rawResponse: text('raw_response'),
  filedAt: text('filed_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

module.exports = { gstFilings };
