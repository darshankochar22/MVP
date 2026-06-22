const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { vouchers, stockItems, stockGroups, voucherStockEntries } = require('../../db/schema');

/** Stock Group Summary - closing inventory value grouped by stock group. */
const stockGroupSummary = async (company_id, fy_id) => {
  try {
    const INWARD = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
    const OUTWARD = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];
    const rows = await db.all(sql`
      SELECT sg.name AS group_name,
             COALESCE(SUM(
               si.opening_quantity * COALESCE(si.opening_rate, 0) +
               COALESCE((SELECT SUM(vse2.amount) FROM ${voucherStockEntries} vse2
                 JOIN ${vouchers} v2 ON v2.voucher_id = vse2.voucher_id
                 WHERE vse2.stock_item_id = si.item_id AND v2.company_id = ${company_id} AND v2.fy_id = ${fy_id}
                   AND v2.voucher_type IN (${sql.join(INWARD.map(t => sql`${t}`), sql`, `)}) AND v2.is_cancelled = 0), 0) -
               COALESCE((SELECT SUM(vse3.amount) FROM ${voucherStockEntries} vse3
                 JOIN ${vouchers} v3 ON v3.voucher_id = vse3.voucher_id
                 WHERE vse3.stock_item_id = si.item_id AND v3.company_id = ${company_id} AND v3.fy_id = ${fy_id}
                   AND v3.voucher_type IN (${sql.join(OUTWARD.map(t => sql`${t}`), sql`, `)}) AND v3.is_cancelled = 0), 0)
             ), 0) AS value
      FROM ${stockGroups} sg
      LEFT JOIN ${stockItems} si ON si.group_id = sg.sg_id AND si.company_id = ${company_id} AND si.is_active = 1
      WHERE sg.company_id = ${company_id} AND sg.is_active = 1
      GROUP BY sg.sg_id, sg.name
      ORDER BY sg.name ASC`
    );
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { stockGroupSummary };