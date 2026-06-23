const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { ledgers, voucherEntries, vouchers } = require('../../db/schema');

const ledgerReport = async (company_id, fy_id, ledger_id, from_date, to_date) => {
  try {
    if (!ledger_id) {
      const firstLedger = await db.all(
        sql`SELECT ${ledgers.ledgerId} AS ledger_id FROM ${ledgers}
            WHERE ${ledgers.companyId} = ${company_id} AND ${ledgers.isActive} = 1
            LIMIT 1`
      );
      if (firstLedger.length === 0) return { success: true, rows: [] };
      ledger_id = firstLedger[0].ledger_id;
    }
    const ledgerRows = await db.all(
      sql`SELECT * FROM ${ledgers} WHERE ${ledgers.ledgerId} = ${ledger_id}`
    );
    if (ledgerRows.length === 0) return { success: false, error: 'Ledger not found' };

    const rawOpening = Number(ledgerRows[0].opening_balance) || 0;
    const effectiveOpening = rawOpening < 0
      ? rawOpening
      : (ledgerRows[0].opening_balance_type === 'Cr' ? -rawOpening : rawOpening);

    // Build the entry query with optional date bounds, mirroring the legacy
    // conditional WHERE clauses. sql.join lets us append predicates only when
    // the corresponding date filter is supplied.
    const conditions = [
      sql`v.company_id = ${company_id}`,
      sql`v.fy_id = ${fy_id}`,
      sql`e.ledger_id = ${ledger_id}`,
      sql`v.is_cancelled = 0`,
      sql`COALESCE(v.is_optional, 0) = 0`,
      sql`COALESCE(v.is_post_dated, 0) = 0`,
    ];
    if (from_date) conditions.push(sql`v.date >= ${from_date}`);
    if (to_date)   conditions.push(sql`v.date <= ${to_date}`);

    const result = await db.all(
      sql`SELECT e.*, v.date, v.voucher_type, v.voucher_number, v.narration as voucher_narration
          FROM ${voucherEntries} e
          INNER JOIN ${vouchers} v ON v.voucher_id = e.voucher_id
          WHERE ${sql.join(conditions, sql` AND `)}
          ORDER BY v.date ASC`
    );

    let runningBalance = effectiveOpening;
    const rows = result.map(e => {
      runningBalance += e.type === 'Dr' ? e.amount : -e.amount;
      return {
        date: e.date,
        voucher_type: e.voucher_type,
        voucher_number: e.voucher_number,
        debit:  e.type === 'Dr' ? e.amount : 0,
        credit: e.type === 'Cr' ? e.amount : 0,
        balance: runningBalance,
        narration: e.narration || e.voucher_narration,
      };
    });

    return {
      success: true,
      ledger_name: ledgerRows[0].name,
      opening_balance: effectiveOpening,
      rows,
      closing_balance: runningBalance,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = ledgerReport;