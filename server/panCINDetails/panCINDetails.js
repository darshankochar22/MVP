const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pan_cin_details (
      pan_cin_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id     INTEGER NOT NULL UNIQUE REFERENCES companies(company_id) ON DELETE CASCADE,
      pan_number     TEXT,
      cin_number     TEXT,
      is_active      INTEGER DEFAULT 1,
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
