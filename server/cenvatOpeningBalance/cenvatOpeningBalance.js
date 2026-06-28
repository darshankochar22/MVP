// CENVAT Opening Balance — voucher-shaped singleton config (Issue #147).
// Lives under Gateway → Statutory Details → CENVAT Opening Balance.
// company_id is the PK and a FK to companies (one row per company).
// `cenvat_opening_balance_lines` holds the Particulars/Amount voucher grid.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cenvat_opening_balance (
      company_id          INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      voucher_no          INTEGER DEFAULT 1,
      voucher_date        TEXT,
      cenvat_credit_of    TEXT DEFAULT 'Inputs',
      tax_unit            TEXT DEFAULT 'Not Applicable',
      gst_registration    TEXT,
      narration           TEXT,

      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS cenvat_opening_balance_lines (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id          INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      particulars         TEXT NOT NULL,
      amount              REAL DEFAULT 0,
      sort_order          INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };
