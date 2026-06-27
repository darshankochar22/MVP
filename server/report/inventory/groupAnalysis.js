const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { vouchers, stockItems, ledgers, voucherEntries, voucherStockEntries, units } = require('../../db/schema');

const INWARD  = ['Purchase', 'Receipt Note', 'Rejection In', 'Material In'];
const OUTWARD = ['Sales', 'Delivery Note', 'Rejection Out', 'Material Out'];

/**
 * Shared core: per stock-item purchase & sales movement, restricted to vouchers
 * whose accounting entries reference a ledger matching `ledgerFilter`.
 */
const partyMovementAnalysis = async (company_id, fy_id, ledgerFilter) => {
  const rows = await db.all(sql`
    SELECT
      si.item_id,
      si.name      AS item_name,
      u.name       AS unit_name,
      SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD.map(t => sql`${t}`), sql`, `)})
               THEN COALESCE(vse.quantity, 0) ELSE 0 END) AS purchase_qty,
      SUM(CASE WHEN v.voucher_type IN (${sql.join(INWARD.map(t => sql`${t}`), sql`, `)})
               THEN COALESCE(vse.amount, 0)   ELSE 0 END) AS purchase_value,
      SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD.map(t => sql`${t}`), sql`, `)})
               THEN COALESCE(vse.quantity, 0) ELSE 0 END) AS sales_qty,
      SUM(CASE WHEN v.voucher_type IN (${sql.join(OUTWARD.map(t => sql`${t}`), sql`, `)})
               THEN COALESCE(vse.amount, 0)   ELSE 0 END) AS sales_value
    FROM ${voucherStockEntries} vse
    INNER JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
    INNER JOIN ${stockItems} si ON si.item_id = vse.stock_item_id
    LEFT JOIN ${units} u ON u.unit_id = si.unit_id
    WHERE v.company_id = ${company_id}
      AND v.fy_id = ${fy_id}
      AND v.is_cancelled = 0
      AND COALESCE(v.is_optional, 0) = 0
      AND COALESCE(v.is_post_dated, 0) = 0
      AND EXISTS (
        SELECT 1 FROM ${voucherEntries} ve
        INNER JOIN ${ledgers} l ON l.ledger_id = ve.ledger_id
        WHERE ve.voucher_id = v.voucher_id AND ${ledgerFilter}
      )
    GROUP BY si.item_id, si.name, u.name
    HAVING (purchase_qty > 0 OR sales_qty > 0)
    ORDER BY si.name ASC
  `);

  return rows.map(r => ({
    item_id:        r.item_id,
    item_name:      r.item_name,
    unit_name:      r.unit_name || '',
    purchase_qty:   r.purchase_qty   || 0,
    purchase_value: r.purchase_value || 0,
    purchase_rate:  r.purchase_qty ? (r.purchase_value / r.purchase_qty) : 0,
    sales_qty:      r.sales_qty      || 0,
    sales_value:    r.sales_value    || 0,
    sales_rate:     r.sales_qty ? (r.sales_value / r.sales_qty) : 0,
  }));
};

/** Group Analysis — movement for all items transacted with any ledger in a ledger group. */
const groupAnalysis = async (company_id, fy_id, group_id) => {
  try {
    const items = await partyMovementAnalysis(company_id, fy_id, sql`l.group_id = ${group_id}`);
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/** Ledger Analysis — movement for all items transacted with a single ledger. */
const ledgerAnalysis = async (company_id, fy_id, ledger_id) => {
  try {
    const items = await partyMovementAnalysis(company_id, fy_id, sql`l.ledger_id = ${ledger_id}`);
    return { success: true, items };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { groupAnalysis, ledgerAnalysis };
