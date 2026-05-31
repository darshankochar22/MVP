const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS voucher_types (
      vt_id            INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id       INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name             TEXT NOT NULL,
      short_name       TEXT,
      category         TEXT,
      numbering_method TEXT DEFAULT 'Automatic',
      is_predefined    INTEGER DEFAULT 0,
      is_active        INTEGER DEFAULT 1,
      created_at       TEXT DEFAULT (datetime('now')),
      updated_at       TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS voucher_type_configs (
      config_id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_type_id               INTEGER NOT NULL REFERENCES voucher_types(vt_id) ON DELETE CASCADE,
      use_effective_dates           INTEGER DEFAULT 0,
      allow_zero_value_transactions INTEGER DEFAULT 0,
      make_voucher_optional         INTEGER DEFAULT 0,
      allow_narration               INTEGER DEFAULT 1,
      allow_narration_per_ledger    INTEGER DEFAULT 0,
      print_after_save              INTEGER DEFAULT 0
    )
  `);
};

module.exports = { init };