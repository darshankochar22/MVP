const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tax_units (
      tax_unit_id               INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id                INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                      TEXT NOT NULL,
      alias                     TEXT,
      address_line1             TEXT,
      address_line2             TEXT,
      address_line3             TEXT,
      address_line4             TEXT,
      state                     TEXT,
      pincode                   TEXT,
      telephone                 TEXT,
      registered_for            TEXT DEFAULT 'Excise',
      set_alter_excise_details  INTEGER DEFAULT 0,
      registration_type         TEXT DEFAULT 'Importer',
      type_of_manufacturer      TEXT,
      ecc_number                TEXT,
      set_alter_excise_tariff   INTEGER DEFAULT 0,
      tariff_name               TEXT,
      hsn_code                  TEXT,
      reporting_uom             TEXT,
      valuation_type            TEXT,
      tariff_rate               REAL DEFAULT 0,
      tariff_rate_per_unit      REAL DEFAULT 0,
      set_alter_rule11_book     INTEGER DEFAULT 0,
      rule11_book               TEXT,
      sort_order                INTEGER DEFAULT 0,
      is_active                 INTEGER DEFAULT 1,
      created_at                TEXT DEFAULT (datetime('now')),
      updated_at                TEXT DEFAULT (datetime('now'))
    )
  `);

  // Idempotent migrations for DBs created before these columns existed.
  const addColumns = [
    `ALTER TABLE tax_units ADD COLUMN type_of_manufacturer TEXT`,
    `ALTER TABLE tax_units ADD COLUMN tariff_name TEXT`,
    `ALTER TABLE tax_units ADD COLUMN hsn_code TEXT`,
    `ALTER TABLE tax_units ADD COLUMN reporting_uom TEXT`,
    `ALTER TABLE tax_units ADD COLUMN valuation_type TEXT`,
    `ALTER TABLE tax_units ADD COLUMN tariff_rate REAL DEFAULT 0`,
    `ALTER TABLE tax_units ADD COLUMN tariff_rate_per_unit REAL DEFAULT 0`,
    `ALTER TABLE tax_units ADD COLUMN rule11_book TEXT`,
  ];
  for (const stmt of addColumns) {
    try {
      await db.execute(stmt);
    } catch (e) {
      // column already exists — ignore
    }
  }
};

module.exports = { init };
