const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS voucher_entry_actions (
      action_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id            INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_id            INTEGER REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
      action_type           TEXT,
      action_data           TEXT,
      autofill_ledger_id    INTEGER REFERENCES ledgers(ledger_id),
      autofill_amount       REAL,
      autofill_narration    TEXT,
      previous_mode         TEXT,
      new_mode              TEXT,
      additional_details    TEXT,
      related_report_type   TEXT,
      related_report_id     INTEGER,
      is_optional           INTEGER DEFAULT 0,
      optional_reason       TEXT,
      performed_by          TEXT,
      performed_at          TEXT DEFAULT (datetime('now')),
      created_at            TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };