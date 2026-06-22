const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { vouchers, stockItems, stockCategories, voucherStockEntries } = require('../../db/schema');

/** Stock Category Summary - closing inventory value by stock category. */
const stockCategorySummary = async (company_id, fy_id) => {
  try {
    const INWARD = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
    const OUTWARD = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];
    const rows = await db.all(sql`
      SELECT COALESCE(sc.name, 'No Category') AS category_name,
             SUM(
               COALESCE((SELECT SUM(vse2.quantity) FROM ${voucherStockEntries} vse2
                 JOIN ${vouchers} v2 ON v2.voucher_id = vse2.voucher_id
                 WHERE vse2.stock_item_id = si.item_id AND v2.company_id = ${company_id} AND v2.fy_id = ${fy_id}
                   AND v2.voucher_type IN (${sql.join(INWARD.map(t => sql`${t}`), sql`, `)}) AND v2.is_cancelled = 0), 0) -
               COALESCE((SELECT SUM(vse3.quantity) FROM ${voucherStockEntries} vse3
                 JOIN ${vouchers} v3 ON v3.voucher_id = vse3.voucher_id
                 WHERE vse3.stock_item_id = si.item_id AND v3.company_id = ${company_id} AND v3.fy_id = ${fy_id}
                   AND v3.voucher_type IN (${sql.join(OUTWARD.map(t => sql`${t}`), sql`, `)}) AND v3.is_cancelled = 0), 0)
             ) AS qty,
             SUM(
               COALESCE((SELECT SUM(vse4.amount) FROM ${voucherStockEntries} vse4
                 JOIN ${vouchers} v4 ON v4.voucher_id = vse4.voucher_id
                 WHERE vse4.stock_item_id = si.item_id AND v4.company_id = ${company_id} AND v4.fy_id = ${fy_id}
                   AND v4.voucher_type IN (${sql.join(INWARD.map(t => sql`${t}`), sql`, `)}) AND v4.is_cancelled = 0), 0) -
               COALESCE((SELECT SUM(vse5.amount) FROM ${voucherStockEntries} vse5
                 JOIN ${vouchers} v5 ON v5.voucher_id = vse5.voucher_id
                 WHERE vse5.stock_item_id = si.item_id AND v5.company_id = ${company_id} AND v5.fy_id = ${fy_id}
                   AND v5.voucher_type IN (${sql.join(OUTWARD.map(t => sql`${t}`), sql`, `)}) AND v5.is_cancelled = 0), 0)
             ) AS value
      FROM ${stockItems} si
      LEFT JOIN ${stockCategories} sc ON sc.sc_id = si.category_id
      WHERE si.company_id = ${company_id} AND si.is_active = 1
      GROUP BY sc.sc_id, sc.name
      ORDER BY category_name ASC`
    );
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { stockCategorySummary };