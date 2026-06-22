const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, groups } = require('../../db/schema');
const { ledgerReport } = require('./ledgerReport');

const bankBook = async (company_id, fy_id, ledger_id, from_date, to_date) => {
  try {
    if (!ledger_id) {
      const bankLedger = await db.all(
        sql`SELECT l.ledger_id FROM ${ledgers} l
            INNER JOIN ${groups} g ON g.group_id = l.group_id
            WHERE l.company_id = ${company_id}
              AND (g.name = 'Bank Accounts' OR l.ledger_type = 'Bank' OR l.name LIKE '%Bank%')
              AND l.is_active = 1
            LIMIT 1`
      );
      if (bankLedger.length === 0) return { success: true, rows: [], vouchers: [] };
      ledger_id = bankLedger[0].ledger_id;
    }
    return await ledgerReport(company_id, fy_id, ledger_id, from_date, to_date);
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { bankBook };