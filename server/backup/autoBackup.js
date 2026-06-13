const { db } = require("../db");
const backupController = require("./backupController");

const shouldRunBackup = (
    settings
) => {

    if (
        !settings ||
        !settings.auto_backup_enabled
    ) {
        return false;
    }

    if (
        !settings.last_backup_at
    ) {
        return true;
    }

    const lastBackup =
        new Date(
            settings.last_backup_at
        );

    const now =
        new Date();

    const diffHours =
        (now - lastBackup) /
        (1000 * 60 * 60);

    switch (
        settings.backup_frequency
    ) {

        case "daily":
            return diffHours >= 24;

        case "weekly":
            return diffHours >=
                (24 * 7);

        case "monthly":
            return diffHours >=
                (24 * 30);

        default:
            return false;
    }
};

const runAutoBackup =
    async () => {

    try {

        const result =
            await db.execute(`
                SELECT *
                FROM backup_settings
                WHERE id = 1
            `);

        const settings =
            result.rows[0];

        console.log(
            "AUTO BACKUP CHECK",
            settings
        );

        if (
            shouldRunBackup(
                settings
            )
        ) {

            console.log(
                `[BACKUP] Auto backup started`
            );

            await backupController
                .createBackup();

            console.log(
                `[BACKUP] Auto backup completed`
            );
        }

    } catch (err) {

        console.error(
            "AUTO BACKUP FAILED",
            err
        );
    }
};

module.exports = {
    runAutoBackup,
};