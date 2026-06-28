// CENVAT Opening Balance service — Drizzle ORM (follows serviceTaxDetailsService).
//   * READS use db.all(sql`SELECT ...`) so the legacy snake_case shape is preserved
//     and mapped to the camelCase the frontend uses.
//   * MUTATIONS use the query builder (upsert the singleton by company_id, and
//     replace the Particulars/Amount child rows atomically).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { cenvatOpeningBalance, cenvatOpeningBalanceLines } = require('../db/schema');

const DEFAULTS = {
  voucherNo: 1,
  voucherDate: '',
  cenvatCreditOf: 'Inputs',
  taxUnit: 'Not Applicable',
  gstRegistration: '',
  narration: '',
  lines: [],
};

const loadLines = async (company_id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${cenvatOpeningBalanceLines}
        WHERE ${cenvatOpeningBalanceLines.companyId} = ${company_id}
        ORDER BY ${cenvatOpeningBalanceLines.sortOrder} ASC, ${cenvatOpeningBalanceLines.id} ASC`
  );
  return (rows || []).map((r) => ({
    particulars: r.particulars || '',
    amount: Number(r.amount) || 0,
  }));
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${cenvatOpeningBalance}
          WHERE ${cenvatOpeningBalance.companyId} = ${company_id}
          LIMIT 1`
    );

    if (!rows || rows.length === 0) {
      return { success: true, exists: false, data: { ...DEFAULTS, lines: [] } };
    }

    const r = rows[0];
    const lines = await loadLines(company_id);
    return {
      success: true,
      exists: true,
      data: {
        voucherNo: Number(r.voucher_no) || DEFAULTS.voucherNo,
        voucherDate: r.voucher_date || '',
        cenvatCreditOf: r.cenvat_credit_of || DEFAULTS.cenvatCreditOf,
        taxUnit: r.tax_unit || DEFAULTS.taxUnit,
        gstRegistration: r.gst_registration || '',
        narration: r.narration || '',
        lines,
      },
    };
  } catch (err) {
    console.error('Error fetching CENVAT opening balance:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => ({
  voucherNo: Number(data.voucherNo) || DEFAULTS.voucherNo,
  voucherDate: data.voucherDate || null,
  cenvatCreditOf: data.cenvatCreditOf || DEFAULTS.cenvatCreditOf,
  taxUnit: data.taxUnit || DEFAULTS.taxUnit,
  gstRegistration: data.gstRegistration || null,
  narration: data.narration || null,
});

const replaceLines = async (company_id, lines) => {
  await db.delete(cenvatOpeningBalanceLines).where(eq(cenvatOpeningBalanceLines.companyId, company_id));
  const rows = (lines || [])
    .filter((l) => l && String(l.particulars || '').trim() !== '')
    .map((l, i) => ({
      companyId: company_id,
      particulars: String(l.particulars).trim(),
      amount: Number(l.amount) || 0,
      sortOrder: i,
    }));
  if (rows.length > 0) await db.insert(cenvatOpeningBalanceLines).values(rows);
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${cenvatOpeningBalance.companyId} FROM ${cenvatOpeningBalance}
          WHERE ${cenvatOpeningBalance.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(cenvatOpeningBalance)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(cenvatOpeningBalance.companyId, company_id));
    } else {
      await db
        .insert(cenvatOpeningBalance)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    await replaceLines(company_id, data.lines);

    return { success: true };
  } catch (err) {
    console.error('Error saving CENVAT opening balance:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
