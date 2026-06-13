const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS physical_stock_entries (
      physical_stock_entry_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id               INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_no               TEXT,
      voucher_date             TEXT NOT NULL,
      reference_no             TEXT,
      narration                TEXT,
      is_optional              INTEGER DEFAULT 0,
      is_post_dated            INTEGER DEFAULT 0,
      created_at               TEXT DEFAULT (datetime('now')),
      updated_at               TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS physical_stock_entry_lines (
      line_id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      physical_stock_entry_id  INTEGER NOT NULL REFERENCES physical_stock_entries(physical_stock_entry_id) ON DELETE CASCADE,
      stock_item_id            INTEGER REFERENCES stock_items(item_id),
      godown_id                INTEGER REFERENCES godowns(godown_id),
      batch_no                 TEXT,
      lot_no                   TEXT,
      manufacturing_date       TEXT,
      expiry_date              TEXT,
      quantity                 REAL DEFAULT 0,
      rate                     REAL DEFAULT 0,
      amount                   REAL DEFAULT 0,
      line_order               INTEGER DEFAULT 0,
      created_at               TEXT DEFAULT (datetime('now')),
      updated_at               TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
