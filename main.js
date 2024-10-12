const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'favicon.ico')
    });

    win.loadFile('index.html');

    // Переопределяем встроенные функции `prompt`, `alert`, `confirm`
    win.webContents.executeJavaScript(`
        window.prompt = (message) => {
            return new Promise((resolve) => {
                const { ipcRenderer } = require('electron');
                ipcRenderer.invoke('prompt', message).then(resolve);
            });
        };

        window.alert = (message) => {
            const { ipcRenderer } = require('electron');
            ipcRenderer.invoke('alert', message);
        };

        window.confirm = (message) => {
            return new Promise((resolve) => {
                const { ipcRenderer } = require('electron');
                ipcRenderer.invoke('confirm', message).then(result => resolve(result));
            });
        };
    `);
}

// Удаляем меню
Menu.setApplicationMenu(null);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Обработчики для alert, prompt и confirm
ipcMain.handle('prompt', async (event, message) => {
    const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['OK', 'Cancel'],
        defaultId: 0,
        title: 'Prompt',
        message: message,
        input: true
    });
    return result.response === 0 ? result.inputValue : null; // Возвращаем значение
});

ipcMain.handle('alert', async (event, message) => {
    await dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        title: 'Alert',
        message: message
    });
});

ipcMain.handle('confirm', async (event, message) => {
    const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: message
    });
    return result.response === 0; // Возвращаем true, если нажали Yes
});
