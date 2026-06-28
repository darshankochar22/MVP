// VAT Registration Details — singleton config (one row per company) + VAT
// commodity masters (Issue #144).
// Mirrors serviceTaxDetails / exciseRegistrationDetails: company_id is the PK and
// a FK to companies. `vat_commodities` holds the optional "Define VAT commodity
// and tax details as masters" list.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS vat_registration_details (
      company_id                       INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      state                            TEXT,
      tin                              TEXT,
      interstate_sales_tax_number      TEXT,
      set_alter_tax_rate_details       INTEGER DEFAULT 0,
      tax_rate                         REAL DEFAULT 0,
      tax_type                         TEXT DEFAULT 'Unknown',
      define_vat_commodity_as_masters  INTEGER DEFAULT 0,
      deactivate_from                  TEXT,

      created_at                       TEXT DEFAULT (datetime('now')),
      updated_at                       TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS vat_commodities (
      id                               INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id                       INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                             TEXT NOT NULL,
      rate                             REAL DEFAULT 0,
      tax_type                         TEXT DEFAULT 'Unknown',
      sort_order                       INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };
