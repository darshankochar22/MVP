// Shared bill-wise settlement history + pending-amount math.
//
// Outstandings, Interest Calculations, and Ledger Confirmation must all read the
// SAME settlement history and compute pending amounts through the SAME function —
// per-report copies of this logic drift apart on partial-payment edge cases.
//
// A "bill" groups voucher_bill_references rows by (ledger_id, bill_name):
//   - New Ref / Advance rows open the bill (origin amount, bill date, due date)
//   - Agst Ref rows settle it (each with its settlement voucher's date)

const { db } = require('../../db/index');
const { sql } = require('drizzle-orm');
const { voucherBillReferences, vouchers, ledgers } = require('../../db/schema');

/**
 * Fetch bills with their full settlement history for a set of ledgers.
 * Rows are clipped to vouchers dated <= toDate (report horizon).
 *
 * Returns: Array<{
 *   ledger_id, party_name, bill_name,
 *   bill_date, due_date, credit_period,
 *   original_amount,                       // sum of New Ref/Advance rows
 *   settlements: [{ date, amount }],       // Agst Ref rows, date-sorted
 * }>
 */
const getBillsWithSettlements = async (company_id, fy_id, { ledger_ids = null, toDate = null } = {}) => {
  const conds = [
    sql`v.company_id = ${company_id}`,
    sql`v.fy_id = ${fy_id}`,
    sql`v.is_cancelled = 0`,
    sql`COALESCE(v.is_optional, 0) = 0`,
    sql`COALESCE(v.is_post_dated, 0) = 0`,
    sql`vbr.bill_type IN ('New Ref', 'Advance', 'Agst Ref')`,
  ];
  if (Array.isArray(ledger_ids) && ledger_ids.length > 0) {
    conds.push(sql`vbr.ledger_id IN (${sql.join(ledger_ids, sql`, `)})`);
  }
  if (toDate) conds.push(sql`v.date <= ${toDate}`);

  const rows = await db.all(sql`
    SELECT vbr.ledger_id, l.name AS party_name, vbr.bill_name, vbr.bill_type,
           vbr.amount, vbr.due_date, vbr.credit_period, v.date AS voucher_date
    FROM ${voucherBillReferences} vbr
    JOIN ${vouchers} v ON v.voucher_id = vbr.voucher_id
    LEFT JOIN ${ledgers} l ON l.ledger_id = vbr.ledger_id
    WHERE ${sql.join(conds, sql` AND `)}
    ORDER BY v.date ASC, vbr.bill_id ASC
  `);

  const byKey = new Map();
  for (const r of rows) {
    const key = `${r.ledger_id}::${r.bill_name}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        ledger_id: r.ledger_id,
        party_name: r.party_name,
        bill_name: r.bill_name,
        bill_date: null,
        due_date: null,
        credit_period: null,
        original_amount: 0,
        settlements: [],
      });
    }
    const bill = byKey.get(key);
    if (r.bill_type === 'New Ref' || r.bill_type === 'Advance') {
      bill.original_amount += Number(r.amount) || 0;
      // First origin voucher defines the bill date / due date.
      if (!bill.bill_date || r.voucher_date < bill.bill_date) {
        bill.bill_date = r.voucher_date;
      }
      if (r.due_date && !bill.due_date) bill.due_date = r.due_date;
      if (r.credit_period && !bill.credit_period) bill.credit_period = r.credit_period;
    } else {
      bill.settlements.push({ date: r.voucher_date, amount: Number(r.amount) || 0 });
    }
  }

  const bills = [...byKey.values()];
  for (const bill of bills) {
    bill.settlements.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }
  return bills;
};

/**
 * Pending amount of a bill as of a date. Settlements dated after as_of_date are
 * ignored; overpayment floors at 0 (never negative).
 */
const pendingAmount = (bill, as_of_date) => {
  let settled = 0;
  for (const s of bill.settlements) {
    if (!as_of_date || s.date <= as_of_date) settled += s.amount;
  }
  return Math.max(0, (Number(bill.original_amount) || 0) - settled);
};

module.exports = { getBillsWithSettlements, pendingAmount };
