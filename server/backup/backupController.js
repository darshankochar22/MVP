// server/backup/backupController.js

const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { db } = require("../db/index");
const getBackupFolder = () => {const folder = path.join(app.getPath("userData"),"backups");
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    return folder;
};

const createBackup = async () => {
    try {
        const backupFolder = getBackupFolder();

        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, "-");

        const backupFile = path.join(backupFolder,`startup-backup-${timestamp}.db`);

        await db.execute(`VACUUM INTO '${backupFile.replace(/\\/g, "/")}'`);
        const stats = fs.statSync(backupFile);
        await db.execute({
            sql: `
                INSERT INTO backup_history
                (
                    file_name,
                    file_path,
                    size_bytes
                )
                VALUES (?, ?, ?)
            `,
            args: [
                path.basename(backupFile),
                backupFile,
                stats.size
            ]
        });

        await cleanupOldBackups();
        await syncHistoryWithFiles();

        await db.execute(`
      UPDATE backup_settings
      SET max_backups = 2
      WHERE id = 1
    `);

        return {success: true,file: backupFile,};
    } catch (error) {
        console.error(error);

        return {success: false, error: error.message,};
    }
};

const getBackups = async () => {
    try {
        const backupDir = getBackupFolder();

        const files = fs
            .readdirSync(backupDir)
            .filter(file => file.endsWith(".db"))
            .map(file => {
                const fullPath = path.join(
                    backupDir,
                    file
                );

                const stats = fs.statSync(fullPath);

                return {
                    name: file,
                    path: fullPath,
                    size: stats.size,
                    createdAt: stats.birthtime,
                };
            })
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );

        return files;

    } catch (error) {
        console.error("getBackups failed:", error);

        return [];
    }
};
const restoreBackup = async (_, backupPath) => {

    try {

        const requestPath =
            path.join(
                app.getPath("userData"),
                "restore-request.json"
            );

        fs.writeFileSync(
            requestPath,
            JSON.stringify({
                backupPath,
            })
        );

        app.relaunch();
        app.exit(0);

        return {
            success: true,
        };

    } catch (error) {

        console.error(error);

        return {
            success: false,
            error: error.message,
        };
    }
};

const getBackupHistory = async () => {
    try {

        const result = await db.execute(
            `
            SELECT *
            FROM backup_history
            ORDER BY id DESC
            `
        );

        return result.rows;

    } catch (error) {

        console.error(error);

        return [];
    }
};
const getSettings = async () => {

    const result =
        await db.execute(
            `SELECT *
             FROM backup_settings
             WHERE id = 1`
        );

    return result.rows[0];
};
const cleanupOldBackups =
    async () => {

    const settings =
        await db.execute(
            `SELECT max_backups
             FROM backup_settings
             WHERE id = 1`
        );
    const maxBackups =
        settings.rows[0]
            ?.max_backups || 10;

    const backupFolder =
        getBackupFolder();

    const files =
        fs.readdirSync(
            backupFolder
        )
        .filter(
            f => f.endsWith(".db")
        )
        .map(file => {

            const fullPath =
                path.join(
                    backupFolder,
                    file
                );

            return {
                file,
                fullPath,
                created:
                    fs.statSync(
                        fullPath
                    ).birthtime
            };
        })
        .sort(
            (a, b) =>
                b.created -
                a.created
        );

    const filesToDelete =
        files.slice(maxBackups);

    for (const file of filesToDelete) {

        try {

            fs.unlinkSync(
                file.fullPath
            );
            await db.execute({
            sql: `
                DELETE FROM backup_history
                WHERE file_path = ?
            `,
            args: [file.fullPath]
        });

        } catch (err) {

            console.error(
                "Delete failed",
                err
            );
        }
    }
};
const syncHistoryWithFiles = async () => {

    const folder = getBackupFolder();

    const existingFiles =
        fs.readdirSync(folder);

    const history =
        await db.execute(`
            SELECT id,file_name
            FROM backup_history
        `);

    for (const row of history.rows) {

        if (
            !existingFiles.includes(
                row.file_name
            )
        ) {

            await db.execute({
                sql: `
                    DELETE FROM backup_history
                    WHERE id = ?
                `,
                args: [row.id]
            });
        }
    }
};
const setLastBackupDateForTest = async () => {

    await db.execute(`
        UPDATE backup_settings
        SET last_backup_at =
        datetime('now','-2 day')
        WHERE id = 1
    `);

    return { success: true };
};
module.exports = {
    createBackup,
    getBackups,
    restoreBackup,
    getBackupHistory,
    getSettings,
    setLastBackupDateForTest,
};
