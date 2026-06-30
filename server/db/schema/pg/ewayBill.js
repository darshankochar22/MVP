const { pgTable, bigint, integer, text, timestamp } = require('drizzle-orm/pg-core');
const { sql } = require('drizzle-orm');
const { companies } = require('./company');

const ewaybillRecords = pgTable('ewaybill_records', {
  ewbId: bigint('ewb_id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  companyId: bigint('company_id', { mode: 'number' }).notNull().references(() => companies.companyId, { onDelete: 'cascade' }),
  voucherId: bigint('voucher_id', { mode: 'number' }),
  irn: text('irn'),
  ewbNo: text('ewb_no'),
  ewbDate: text('ewb_date'),
  validUpto: text('valid_upto'),
  docNo: text('doc_no'),
  docDate: text('doc_date'),
  transMode: text('trans_mode'),
  vehNo: text('veh_no'),
  distance: integer('distance'),
  status: text('status').default('PENDING'),
  cancelReason: text('cancel_reason'),
  cancelRemarks: text('cancel_remarks'),
  cancelledAt: text('cancelled_at'),
  rawResponse: text('raw_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().default(sql`now()`),
});

module.exports = { ewaybillRecords };
