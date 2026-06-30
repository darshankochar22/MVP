const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS gst_filings (
      filing_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id    INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      fy_id         INTEGER,
      return_type   TEXT NOT NULL,
      return_period TEXT NOT NULL,
      status        TEXT DEFAULT 'DRAFT',
      arn           TEXT,
      reference_id  TEXT,
      summary       TEXT,
      raw_response  TEXT,
      filed_at      TEXT,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
