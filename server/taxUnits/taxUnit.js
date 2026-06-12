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
      ecc_number                TEXT,
      set_alter_excise_tariff   INTEGER DEFAULT 0,
      set_alter_rule11_book     INTEGER DEFAULT 0,
      sort_order                INTEGER DEFAULT 0,
      is_active                 INTEGER DEFAULT 1,
      created_at                TEXT DEFAULT (datetime('now')),
      updated_at                TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };