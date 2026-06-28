// Excise Opening Balance service — Drizzle ORM (follows serviceTaxDetailsService).
//   * READS use db.all(sql`SELECT ...`) so the legacy snake_case shape is preserved
//     and mapped to the camelCase the frontend uses.
//   * MUTATIONS use the query builder (upsert the singleton by company_id, and
//     replace the opening-balance child rows atomically).
const { db } = require('../db/index');
const { sql, eq } = require('drizzle-orm');
const { exciseOpeningBalance, exciseOpeningBalanceLines } = require('../db/schema');

const DEFAULTS = {
  voucherNo: '',
  voucherDate: '',
  gstRegistration: '',
  taxUnit: 'Default Tax Unit',
  status: 'Excise Opening Balance',
  narration: '',
  lines: [],
};

const loadLines = async (company_id) => {
  const rows = await db.all(
    sql`SELECT * FROM ${exciseOpeningBalanceLines}
        WHERE ${exciseOpeningBalanceLines.companyId} = ${company_id}
        ORDER BY ${exciseOpeningBalanceLines.sortOrder} ASC, ${exciseOpeningBalanceLines.id} ASC`
  );
  return (rows || []).map((r) => ({
    particulars: r.particulars || '',
    amount: Number(r.amount) || 0,
  }));
};

const get = async (company_id) => {
  try {
    const rows = await db.all(
      sql`SELECT * FROM ${exciseOpeningBalance}
          WHERE ${exciseOpeningBalance.companyId} = ${company_id}
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
        voucherNo: r.voucher_no || '',
        voucherDate: r.voucher_date || '',
        gstRegistration: r.gst_registration || '',
        taxUnit: r.tax_unit || DEFAULTS.taxUnit,
        status: r.status || DEFAULTS.status,
        narration: r.narration || '',
        lines,
      },
    };
  } catch (err) {
    console.error('Error fetching excise opening balance:', err);
    return { success: false, error: err.message };
  }
};

const toColumns = (data) => ({
  voucherNo: data.voucherNo || null,
  voucherDate: data.voucherDate || null,
  gstRegistration: data.gstRegistration || null,
  taxUnit: data.taxUnit || DEFAULTS.taxUnit,
  status: data.status || DEFAULTS.status,
  narration: data.narration || null,
});

const replaceLines = async (company_id, lines) => {
  await db.delete(exciseOpeningBalanceLines).where(eq(exciseOpeningBalanceLines.companyId, company_id));
  const rows = (lines || [])
    .filter((l) => l && String(l.particulars || '').trim() !== '')
    .map((l, i) => ({
      companyId: company_id,
      particulars: String(l.particulars).trim(),
      amount: Number(l.amount) || 0,
      sortOrder: i,
    }));
  if (rows.length > 0) await db.insert(exciseOpeningBalanceLines).values(rows);
};

const save = async (data) => {
  try {
    const company_id = data.company_id;
    if (!company_id) return { success: false, error: 'Company ID is required' };

    const existing = await db.all(
      sql`SELECT ${exciseOpeningBalance.companyId} FROM ${exciseOpeningBalance}
          WHERE ${exciseOpeningBalance.companyId} = ${company_id}
          LIMIT 1`
    );

    if (existing && existing.length > 0) {
      await db
        .update(exciseOpeningBalance)
        .set({ ...toColumns(data), updatedAt: sql`datetime('now')` })
        .where(eq(exciseOpeningBalance.companyId, company_id));
    } else {
      await db
        .insert(exciseOpeningBalance)
        .values({ companyId: company_id, ...toColumns(data) });
    }

    await replaceLines(company_id, data.lines);

    return { success: true };
  } catch (err) {
    console.error('Error saving excise opening balance:', err);
    return { success: false, error: err.message };
  }
};

module.exports = { get, save };
