const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const REQUEST_FILE = "restore-request.json";

const processPendingRestore = async () => {
    try {
        console.log(
            "Checking pending restore..."
        );
        const userData =
            app.getPath("userData");

        const requestPath =
            path.join(
                userData,
                REQUEST_FILE
            );

        if (!fs.existsSync(requestPath)) {
            return;
        }

        const request =
            JSON.parse(
                fs.readFileSync(
                    requestPath,
                    "utf8"
                )
            );

        const dbPath =
            path.join(
                userData,
                "startup.db"
            );

        const walPath =
            dbPath + "-wal";

        const shmPath =
            dbPath + "-shm";

        console.log(
            "Restore request found:",
            request.backupPath
        );

        if (!fs.existsSync(request.backupPath)) {
            console.error(
                "Backup file missing"
            );

            fs.unlinkSync(requestPath);

            return;
        }

        if (fs.existsSync(dbPath))
            fs.unlinkSync(dbPath);

        if (fs.existsSync(walPath))
            fs.unlinkSync(walPath);

        if (fs.existsSync(shmPath))
            fs.unlinkSync(shmPath);

        fs.copyFileSync(
            request.backupPath,
            dbPath
        );

        fs.unlinkSync(requestPath);

        console.log(
            "Database restored successfully"
        );

    } catch (err) {

        console.error(
            "Restore failed:",
            err
        );
    }
};

module.exports = {
    processPendingRestore,
};