const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { vouchers, stockItems, stockGroups, units, voucherStockEntries } = require('../../db/schema');
const { inwardCondSql, outwardCondSql } = require('../services/stockMovement');

/** Stock Item Summary - per-item inward/outward quantities and closing balance. */
const stockItemSummary = async (company_id, fy_id) => {
  try {
    const rows = await db.all(sql`
      SELECT si.item_id AS item_id,
             si.name AS item_name,
             sg.name AS group_name,
             u.name AS unit_name,
             COALESCE(si.opening_quantity, 0) AS opening_qty,
             COALESCE(si.opening_value, COALESCE(si.opening_quantity, 0) * COALESCE(si.opening_rate, 0)) AS opening_value,
             COALESCE(SUM(CASE WHEN ${inwardCondSql('v', 'vse')} THEN vse.quantity ELSE 0 END), 0) AS in_qty,
             COALESCE(SUM(CASE WHEN ${inwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END), 0) AS in_value,
             COALESCE(SUM(CASE WHEN ${outwardCondSql('v', 'vse')} THEN vse.quantity ELSE 0 END), 0) AS out_qty,
             COALESCE(SUM(CASE WHEN ${outwardCondSql('v', 'vse')} THEN vse.amount ELSE 0 END), 0) AS out_value
      FROM ${stockItems} si
      LEFT JOIN ${stockGroups} sg ON sg.sg_id = si.group_id
      LEFT JOIN ${units} u ON u.unit_id = si.unit_id
      LEFT JOIN ${voucherStockEntries} vse ON vse.stock_item_id = si.item_id
      LEFT JOIN ${vouchers} v ON v.voucher_id = vse.voucher_id
        AND v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
        AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0
      WHERE si.company_id = ${company_id} AND si.is_active = 1
      GROUP BY si.item_id, si.name, sg.name, u.name, si.opening_quantity, si.opening_rate, si.opening_value
      ORDER BY si.name ASC`
    );
    const mapped = rows.map(r => {
      const closing_qty = (r.opening_qty || 0) + (r.in_qty || 0) - (r.out_qty || 0);
      // Weighted-average COST — out_value is sale revenue, not consumption cost.
      const availQty = (r.opening_qty || 0) + (r.in_qty || 0);
      const avgRate = availQty > 0 ? ((r.opening_value || 0) + (r.in_value || 0)) / availQty : 0;
      const closing_value = closing_qty > 0 ? avgRate * closing_qty : 0;
      return {
        ...r,
        closing_qty,
        closing_value,
        rate: closing_qty ? closing_value / closing_qty : 0,
      };
    });
    return { success: true, rows: mapped };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { stockItemSummary };
