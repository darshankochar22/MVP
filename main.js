const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

ipcMain.handle("app:getDataPath", () => app.getPath("userData"));

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    if (isDev) {
        win.loadURL('http://localhost:5173');
        win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(app.getAppPath(), 'client', 'dist', 'index.html'));
        win.webContents.openDevTools();
    }
}

app.whenReady().then(async () => {

    try {
        const {
            processPendingRestore
        } = require(
            "./server/backup/restoreManager"
        );

        await processPendingRestore();

        const {
            initDB,
            db
        } = require(
            "./server/db/index"
        );

        await initDB();

        const {
            runAutoBackup
        } = require(
            "./server/backup/autoBackup"
        );

        await runAutoBackup();
        require(
            "./server/index.js"
        );

        createWindow();

    } catch (err) {

        console.error(
            "DB init failed:",
            err
        );

        createWindow();
    }

    app.on("activate", () => {

        if (
            BrowserWindow
            .getAllWindows()
            .length === 0
        ) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});