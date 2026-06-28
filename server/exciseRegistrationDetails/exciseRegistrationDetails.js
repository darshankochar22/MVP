// Excise Registration Details — singleton config (one row per company) + excise
// tariff/duty masters (Issue #145).
// Mirrors serviceTaxDetails / payrollStatutoryDetails: company_id is the PK and
// a FK to companies. `excise_tariff_items` holds the optional "Define excise
// tariff and duty details as masters" list.
const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_registration_details (
      company_id                       INTEGER PRIMARY KEY REFERENCES companies(company_id) ON DELETE CASCADE,

      unit_name                        TEXT,
      address                          TEXT,
      state                            TEXT,
      pincode                          TEXT,
      telephone_no                     TEXT,
      registration_type                TEXT DEFAULT 'Dealer',
      type_of_manufacturer             TEXT,
      ecc_number                       TEXT,
      set_alter_excise_tariff_details  INTEGER DEFAULT 0,
      define_excise_tariff_as_masters  INTEGER DEFAULT 0,
      deactivate_from                  TEXT,

      created_at                       TEXT DEFAULT (datetime('now')),
      updated_at                       TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS excise_tariff_items (
      id                               INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id                       INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      tariff_name                      TEXT NOT NULL,
      hsn_code                         TEXT,
      reporting_uom                    TEXT,
      valuation_type                   TEXT DEFAULT 'Ad Valorem',
      rate                             REAL DEFAULT 0,
      sort_order                       INTEGER DEFAULT 0
    )
  `);

  // Migrations for DBs created before a column existed (ignored if already present).
  const migrations = [
    { col: 'type_of_manufacturer', sql: "ALTER TABLE excise_registration_details ADD COLUMN type_of_manufacturer TEXT" },
  ];
  for (const m of migrations) {
    try {
      await db.execute(m.sql);
    } catch (err) {
      // Ignored if column already exists
    }
  }
};

module.exports = { init };
