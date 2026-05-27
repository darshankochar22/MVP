// db/schema/voucherEntryAction.js

const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS voucher_entry_actions (
      action_id             INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id            INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_id            INTEGER REFERENCES vouchers(voucher_id) ON DELETE CASCADE,
      action_type           TEXT NOT NULL,
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

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_vea_company
      ON voucher_entry_actions (company_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_vea_voucher
      ON voucher_entry_actions (voucher_id)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_vea_performed_at
      ON voucher_entry_actions (performed_at DESC)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_vea_action_type
      ON voucher_entry_actions (company_id, action_type)
  `);
};

module.exports = { init };