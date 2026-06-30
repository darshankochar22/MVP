const { sqliteTable, integer, text } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

const datetimeNow = sql`(datetime('now'))`;

// ewaybill_records: one row per generated/cancelled e-Way Bill.
const ewaybillRecords = sqliteTable('ewaybill_records', {
  ewbId: integer('ewb_id').primaryKey({ autoIncrement: true }),
  companyId: integer('company_id').notNull(),
  voucherId: integer('voucher_id'),
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
  createdAt: text('created_at').default(datetimeNow),
  updatedAt: text('updated_at').default(datetimeNow),
});

module.exports = { ewaybillRecords };
