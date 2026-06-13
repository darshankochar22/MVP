// server/backup/backupHistory.js

let db;

const init = async (_db) => {
    db = _db;

    await db.execute(`
        CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            size_bytes INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
};

module.exports = {
    init,
};