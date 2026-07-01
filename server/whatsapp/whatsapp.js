const init = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_config (
      config_id       INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      phone_number_id TEXT NOT NULL,
      waba_id         TEXT NOT NULL,
      access_token    TEXT NOT NULL,
      is_active       INTEGER DEFAULT 1,
      created_at      TEXT DEFAULT (datetime('now')),
      updated_at      TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_templates (
      template_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      language        TEXT DEFAULT 'en',
      category        TEXT,
      status          TEXT DEFAULT 'PENDING',
      created_at      TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      log_id          INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id      INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      voucher_id      INTEGER,
      to_number       TEXT NOT NULL,
      message_type    TEXT NOT NULL,
      template_name   TEXT,
      status          TEXT DEFAULT 'PENDING',
      wamid           TEXT,
      error           TEXT,
      sent_at         TEXT DEFAULT (datetime('now'))
    )
  `);

  // CRM inbox: party contacts imported from ledgers (or synced from the BSP).
  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_contacts (
      contact_id        INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id        INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      ledger_id         INTEGER,
      name              TEXT,
      phone             TEXT NOT NULL,
      last_message_at   TEXT,
      last_message_text TEXT,
      unread_count      INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now')),
      UNIQUE (company_id, phone)
    )
  `);

  // Conversation history — filled by the poll-based sync against the BSP.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      message_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id  INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      phone       TEXT NOT NULL,
      direction   TEXT NOT NULL,
      type        TEXT DEFAULT 'text',
      body        TEXT,
      media_url   TEXT,
      wamid       TEXT,
      status      TEXT,
      ts          TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
      campaign_id   INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id    INTEGER NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
      name          TEXT NOT NULL,
      template_name TEXT,
      audience      TEXT,
      total         INTEGER DEFAULT 0,
      sent          INTEGER DEFAULT 0,
      failed        INTEGER DEFAULT 0,
      status        TEXT DEFAULT 'PENDING',
      created_at    TEXT DEFAULT (datetime('now'))
    )
  `);
};

module.exports = { init };