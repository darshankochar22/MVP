const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { vouchers } = require('../../db/schema');

/** Statistics - voucher counts by type for a financial year. */
const statistics = async (company_id, fy_id) => {
  try {
    const rows = await db.all(
      sql`SELECT voucher_type AS vch_type, COUNT(*) AS count
          FROM ${vouchers}
          WHERE company_id = ${company_id} AND fy_id = ${fy_id} AND is_cancelled = 0
          GROUP BY voucher_type
          ORDER BY count DESC`
    );
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { statistics };