const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
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
        autoHideMenuBar: true
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

ipcMain.on('open-prompt-window', (event, promptType) => {
    createPromptWindow('prompt.html', promptType);
});

ipcMain.on('prompt-input', (event, input) => {
    mainWindow.webContents.send('prompt-response', input); // Отправляем введенные данные обратно в основное окно
    if (promptWindow) {
        promptWindow.close(); // Закрываем окно после получения ответа
    }
});

ipcMain.on('rename-prompt-window', (event, promptType) => {
    createPromptWindow('rename_prompt.html', promptType);
});

ipcMain.on('prompt-rename', (event, input) => {
    mainWindow.webContents.send('rename-response', input); // Отправляем введенные данные обратно в основное окно
    if (promptWindow) {
        promptWindow.close(); // Закрываем окно после получения ответа
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

// Обработчик для выбора папки
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    // Проверяем, был ли выбран путь
    if (result.canceled || result.filePaths.length === 0) {
        return null; // Если не выбрано, возвращаем null
    }
    
    return result.filePaths[0]; // Возвращаем путь к выбранной папке
});


// Список файлов и папок в выбранной директории
ipcMain.handle('list-files', async (event, dirPath) => {
    return fs.readdirSync(dirPath, { withFileTypes: true }).map(dirent => ({
        name: dirent.name,
        isDirectory: dirent.isDirectory()
    }));
});

// Обработчик для открытия файла
ipcMain.handle('open-file', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content;
    } catch (error) {
        console.error('Error opening file:', error);
        throw error;
    }
});

// Обработчик для создания файла
ipcMain.handle('create-file', async (event, dirPath, fileName) => {
    try {
        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, '', 'utf8'); // Создаем пустой файл
        return filePath;
    } catch (error) {
        console.error('Error creating file:', error);
        throw error;
    }
});

// Обработчик для удаления файла
ipcMain.handle('delete-file', async (event, filePath) => {
    try {
        fs.unlinkSync(filePath); // Удаляем файл
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
});

// Обработчик для сохранения файла
ipcMain.handle('save-file', async (event, filePath, content) => {
    try {
        fs.writeFileSync(filePath, content, 'utf8'); // Сохраняем контент в файл
        return true;
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
});

// Обработчик для переименования файла
ipcMain.handle('rename-file', async (event, oldFilePath, newFilePath) => {
    try {
        fs.renameSync(oldFilePath, newFilePath); // Переименовываем файл
        return true;
    } catch (error) {
        console.error('Error renaming file:', error);
        throw error;
    }
});
