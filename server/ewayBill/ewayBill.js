const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ewaybill_records (
      ewb_id         INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id     INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_id     INTEGER,
      irn            TEXT,
      ewb_no         TEXT,
      ewb_date       TEXT,
      valid_upto     TEXT,
      doc_no         TEXT,
      doc_date       TEXT,
      trans_mode     TEXT,
      veh_no         TEXT,
      distance       INTEGER,
      status         TEXT DEFAULT 'PENDING',
      cancel_reason  TEXT,
      cancel_remarks TEXT,
      cancelled_at   TEXT,
      raw_response   TEXT,
      created_at     TEXT DEFAULT (datetime('now')),
      updated_at     TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };
