const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    // Создание окна браузера
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Если нужно, добавьте preload
        },
        icon: path.join(__dirname, 'favicon.ico') // Установите иконку приложения
    });

    // Загрузка HTML страницы
    win.loadFile('index.html');
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
