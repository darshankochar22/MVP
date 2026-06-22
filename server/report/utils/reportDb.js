const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { voucherEntries, vouchers } = require('../../db/schema');

const getEntries = async (company_id, fy_id) => {
  const rows = await db.all(
    sql`SELECT e.*, v.date, v.voucher_type, v.voucher_number
        FROM ${voucherEntries} e
        INNER JOIN ${vouchers} v ON v.voucher_id = e.voucher_id
        WHERE v.company_id = ${company_id} AND v.fy_id = ${fy_id} AND v.is_cancelled = 0
          AND COALESCE(v.is_optional, 0) = 0 AND COALESCE(v.is_post_dated, 0) = 0`
  );
  return rows;
};

module.exports = { getEntries };