// Excise Opening Balance — singleton voucher-style master (one row per company)
// + opening-balance line items (Issue #151).
// Mirrors serviceTaxDetails: company_id is the PK and a FK to companies.
// `excise_opening_balance_lines` holds the Particulars/Amount opening entries.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_opening_balance (
      company_id        INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      voucher_no        TEXT,
      voucher_date      TEXT,
      gst_registration  TEXT,
      tax_unit          TEXT DEFAULT 'Default Tax Unit',
      status            TEXT DEFAULT 'Excise Opening Balance',
      narration         TEXT,

      created_at        TEXT DEFAULT (datetime('now')),
      updated_at        TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_opening_balance_lines (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id   INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      particulars  TEXT NOT NULL,
      amount       REAL DEFAULT 0,
      sort_order   INTEGER DEFAULT 0
    )
  `);

  // Future column additions go here (idempotent try/catch each).
  const migrations = [];
  for (const stmt of migrations) {
    try {
      await db.execute(stmt);
    } catch (err) {
      // Column already exists — safe to ignore.
    }
  }
};

module.exports = { init };
