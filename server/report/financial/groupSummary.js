const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, groups } = require('../../db/schema');
const { getEntries } = require('../utils/reportDb');
const { calcLedgerBalance } = require('../utils/ledgerBalance');

/** Group Summary - closing balance per account group derived from ledger + voucher entries. */
const groupSummary = async (company_id, fy_id) => {
  try {
    const entries = await getEntries(company_id, fy_id);
    const ledgerRows = await db.all(
      sql`SELECT l.ledger_id, l.name AS ledger_name, l.group_id, l.opening_balance, l.opening_balance_type,
                 g.name AS group_name, g.nature
          FROM ${ledgers} l
          LEFT JOIN ${groups} g ON g.group_id = l.group_id
          WHERE l.company_id = ${company_id} AND l.is_active = 1`
    );

    // Sum by group
    const groupMap = {};
    for (const l of ledgerRows) {
      const gname = l.group_name || 'Ungrouped';
      if (!groupMap[l.group_id]) groupMap[l.group_id] = { group_name: gname, debit: 0, credit: 0 };
      const balance = calcLedgerBalance(l.ledger_id, entries, l.opening_balance || 0, l.opening_balance_type || 'Dr');
      if (balance > 0) groupMap[l.group_id].debit += balance;
      else groupMap[l.group_id].credit += Math.abs(balance);
    }

    const rows = Object.values(groupMap).sort((a, b) => a.group_name.localeCompare(b.group_name));
    return { success: true, rows };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { groupSummary };