// PLA Opening Balance — singleton voucher-style config (one row per company)
// + child ledger lines (Issue #148).
// Mirrors serviceTaxDetails: company_id is the PK of the header and a FK to
// companies. `pla_opening_balance_lines` holds the voucher's Particulars/Amount
// entry lines. These are NEW tables — reconcile won't create them, so init() is
// the source of truth and the Drizzle file is the typed mirror.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pla_opening_balance (
      company_id        INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      voucher_no        TEXT,
      voucher_date      TEXT,
      gst_registration  TEXT,
      tax_unit          TEXT DEFAULT 'Not Applicable',
      status            TEXT DEFAULT 'PLA Opening Balance',
      narration         TEXT,

      created_at        TEXT DEFAULT (datetime('now')),
      updated_at        TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS pla_opening_balance_lines (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id   INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      particulars  TEXT NOT NULL,
      amount       REAL DEFAULT 0,
      sort_order   INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };
