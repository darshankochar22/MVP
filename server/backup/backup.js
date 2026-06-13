// server/backup/backup.js

const fs = require("fs");
const path = require("path");

async function init(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS backup_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      auto_backup_enabled INTEGER DEFAULT 1,
      backup_frequency TEXT DEFAULT 'daily',
      max_backups INTEGER DEFAULT 10,
      last_backup_at TEXT,
      auto_backup_enabled INTEGER DEFAULT 1,
      backup_frequency TEXT DEFAULT 'daily'
    )
  `);

  await db.execute(`
    INSERT OR IGNORE INTO backup_settings(id)
    VALUES(1)
  `);
}

module.exports = {
  init,
};