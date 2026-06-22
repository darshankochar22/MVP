const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { costCentres, voucherCostCentres, voucherEntries, vouchers } = require('../../db/schema');

/** Cost Category Summary - debit/credit totals by cost centre grouped by category. */
const costCategorySummary = async (company_id, fy_id) => {
  try {
    // Cost-centre splits live in voucher_cost_centres(entry_id, cost_centre_id,
    // amount); the cost category is cost_centres.category. Aggregating vcc.amount
    // avoids fan-out when a voucher entry is split across several cost centres.
    const rows = await db.all(sql`
      SELECT COALESCE(cc.category, 'General') AS category_name,
             SUM(CASE WHEN ve.type = 'Dr' THEN vcc.amount ELSE 0 END) AS debit,
             SUM(CASE WHEN ve.type = 'Cr' THEN vcc.amount ELSE 0 END) AS credit
      FROM ${voucherCostCentres} vcc
      INNER JOIN ${voucherEntries} ve ON ve.entry_id = vcc.entry_id
      INNER JOIN ${vouchers} v ON v.voucher_id = vcc.voucher_id
      LEFT JOIN ${costCentres} cc ON cc.cc_id = vcc.cost_centre_id
      WHERE v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
      GROUP BY COALESCE(cc.category, 'General')
      ORDER BY category_name ASC`
    );
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { costCategorySummary };