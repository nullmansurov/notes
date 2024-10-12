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

    // Переопределение функции prompt для использования Electron
    win.webContents.executeJavaScript(`
        window.prompt = (message, defaultValue = '') => {
            const { ipcRenderer } = require('electron');
            return ipcRenderer.invoke('show-prompt-dialog', message, defaultValue);
        };
    `);
}

// Удаляем меню
Menu.setApplicationMenu(null);

// Запуск приложения
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

// Обработчик для вызова кастомного prompt
ipcMain.handle('show-prompt-dialog', async (event, message, defaultValue) => {
    const promptWindow = new BrowserWindow({
        width: 400,
        height: 200,
        resizable: false,
        modal: true,
        parent: BrowserWindow.getFocusedWindow(),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    promptWindow.loadURL(`data:text/html,
        <html>
        <body>
            <h1>${message}</h1>
            <input type="text" id="input" value="${defaultValue}" />
            <button onclick="require('electron').ipcRenderer.send('prompt-response', document.getElementById('input').value)">OK</button>
            <button onclick="require('electron').ipcRenderer.send('prompt-response', null)">Cancel</button>
        </body>
        </html>`);

    return new Promise((resolve) => {
        ipcMain.once('prompt-response', (event, result) => {
            promptWindow.close();
            resolve(result);
        });
    });
});
