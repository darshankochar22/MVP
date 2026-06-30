const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

const datetimeNow = sql`(datetime('now'))`;

// gst_filings: one row per return period + type, tracking its filing lifecycle
// (DRAFT -> SAVED -> FILED) against the GSP/GSTN.
const gstFilings = sqliteTable('gst_filings', {
  filingId: integer('filing_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  fyId: integer('fy_id'),
  returnType: text('return_type').notNull(),   // GSTR1 | GSTR3B
  returnPeriod: text('return_period').notNull(), // MMYYYY
  status: text('status').default('DRAFT'),       // DRAFT | SAVED | FILED | ERROR
  arn: text('arn'),
  referenceId: text('reference_id'),
  summary: text('summary'),                      // JSON of the computed return
  rawResponse: text('raw_response'),
  filedAt: text('filed_at'),
  createdAt: text('created_at').default(datetimeNow),
  updatedAt: text('updated_at').default(datetimeNow),
});

module.exports = { gstFilings };
