const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_vouchers (
      attendance_voucher_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id             INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_number         TEXT,
      date                   TEXT NOT NULL,
      narration              TEXT,
      created_at             TEXT DEFAULT (datetime('now')),
      updated_at             TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS attendance_voucher_entries (
      entry_id               INTEGER PRIMARY KEY AUTOINCREMENT,
      attendance_voucher_id  INTEGER NOT NULL REFERENCES attendance_vouchers(attendance_voucher_id) ON DELETE CASCADE,
      employee_id            INTEGER REFERENCES employees(employee_id),
      attendance_type_id     INTEGER REFERENCES attendance_types(attendance_type_id),
      value                  REAL DEFAULT 0
    )
  `);
};

module.exports = { init };
