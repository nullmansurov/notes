const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 600,
        webPreferences: {
            nodeIntegration: true,  // Включаем интеграцию Node.js
            contextIsolation: false // Отключаем изоляцию контекста
        },
        icon: path.join(__dirname, 'favicon.ico')
    });

    win.loadFile('index.html');

    // Переопределяем стандартные браузерные функции прямо в рендерере
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

// Обработчик для вызова prompt через Electron
ipcMain.handle('show-prompt-dialog', async (event, message, defaultValue) => {
    const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['OK', 'Cancel'],
        defaultId: 0,
        cancelId: 1,
        title: 'Prompt',
        message: message,
        input: true,
        detail: 'Enter a value:', // Подпись для поля ввода
        input: defaultValue // Значение по умолчанию
    });

    // Возвращаем значение, если нажали OK, или null, если нажали Cancel
    return result.response === 0 ? result.inputValue : null;
});
