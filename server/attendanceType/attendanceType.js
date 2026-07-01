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

  // One-time cleanup: attendance/production types are no longer pre-seeded — users
  // create their own. Retire any predefined types left over from an older company
  // seed so they neither appear in the list nor block creating a same-named type.
  // Deactivate (not delete) to preserve references from any existing attendance
  // voucher. Idempotent: once retired they no longer match.
  try {
    await db.execute(`UPDATE attendance_types SET is_active = 0 WHERE is_predefined = 1 AND is_active = 1`);
  } catch (_) {}
};

module.exports = { init };