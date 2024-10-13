const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;
let promptWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'favicon.ico'),
        autoHideMenuBar: true // Убираем меню из главного окна
    });

    mainWindow.loadFile('index.html');

    // Открываем ссылки в системном браузере
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url); // Открытие ссылки в браузере
        return { action: 'deny' }; // Предотвращаем открытие в новом окне Electron
    });

    // Убираем контекстное меню (если не нужно его кастомизировать)
    mainWindow.webContents.on('context-menu', (e) => {
        e.preventDefault(); // Отключаем стандартное контекстное меню
    });
}

function createPromptWindow(htmlFile) {
    promptWindow = new BrowserWindow({
        width: 400,
        height: 200,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        },
        modal: true,
        parent: mainWindow,
        autoHideMenuBar: true // Убираем меню из окна prompt
    });

    promptWindow.loadFile(htmlFile);
}

// Обрабатываем запросы на alert и confirm
ipcMain.handle('show-alert', (event, message) => {
    return new Promise((resolve) => {
        const response = BrowserWindow.getFocusedWindow().webContents.executeJavaScript(`
            alert("${message}");
            "Alert closed";
        `);
        resolve(response);
    });
});

ipcMain.handle('show-confirm', (event, message) => {
    return new Promise((resolve) => {
        const response = BrowserWindow.getFocusedWindow().webContents.executeJavaScript(`
            confirm("${message}");
        `);
        resolve(response);
    });
});

// Открытие окна Prompt для разных типов
ipcMain.on('open-prompt-window', (event, promptType) => {
    if (promptType === 'url') {
        createPromptWindow('promptURL.html'); // Загружаем HTML для URL
    } else {
        createPromptWindow('prompt.html'); // Загружаем общий HTML
    }
});

// Получение данных из prompt
ipcMain.on('prompt-input', (event, input) => {
    // Отправляем данные обратно в главное окно
    mainWindow.webContents.send('prompt-response', input);
    // Закрываем окно prompt после получения данных
    if (promptWindow) {
        promptWindow.close();
    }
});

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
