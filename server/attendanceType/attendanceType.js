const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_types (
      attendance_type_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id          INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name                TEXT NOT NULL,
      alias               TEXT,
      type                TEXT DEFAULT 'Attendance / Leave with Pay',
      unit_id             INTEGER REFERENCES payroll_units(payroll_unit_id),
      period              TEXT DEFAULT 'Per Day',
      carry_forward       INTEGER DEFAULT 0,
      encashment          INTEGER DEFAULT 0,
      max_days            REAL DEFAULT 0,
      is_active           INTEGER DEFAULT 1,
      is_predefined       INTEGER DEFAULT 0,
      created_at          TEXT DEFAULT (datetime('now')),
      updated_at          TEXT DEFAULT (datetime('now'))
    )
  `);

  for (const col of ['alias', 'period', 'carry_forward', 'encashment', 'max_days']) {
    try { await db.execute(`ALTER TABLE attendance_types ADD COLUMN ${col} TEXT`); } catch (_) {}
  }
};

module.exports = { init };