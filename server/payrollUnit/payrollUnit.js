const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payroll_units (
      payroll_unit_id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      symbol          TEXT,
      formal_name     TEXT,
      unit_type       TEXT DEFAULT 'Simple',
      decimal_places  INTEGER DEFAULT 0,
      first_unit      TEXT,
      conversion      REAL,
      second_unit     TEXT,
      is_active       INTEGER DEFAULT 1,
      is_predefined   INTEGER DEFAULT 0,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    )
  `);

  for (const col of ['formal_name', 'first_unit', 'conversion', 'second_unit']) {
    try { await db.execute(`ALTER TABLE payroll_units ADD COLUMN ${col} TEXT`); } catch (_) {}
  }
};

module.exports = { init };