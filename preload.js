const { contextBridge, ipcRenderer } = require('electron');

// Связываем с рендер-процессом
contextBridge.exposeInMainWorld('electronAPI', {
    showAlert: (message) => ipcRenderer.invoke('show-alert', message),
    sendPromptInput: (input) => ipcRenderer.send('prompt-input', input),
    sendPromptInput2: (input) => ipcRenderer.send('prompt-rename', input),
    onPromptResponse: (callback) => ipcRenderer.on('prompt-response', (event, input) => callback(input)),
    onRenameResponse: (callback) => ipcRenderer.on('rename-response', (event, input) => callback(input)),
    openPrompt: (promptType) => ipcRenderer.send('open-prompt-window', promptType),
    openRename: (promptType) => ipcRenderer.send('rename-prompt-window', promptType),
    onPromptResponse: (callback) => ipcRenderer.once('prompt-response', (event, input) => callback(input)),
    offPromptResponse: (callback) => ipcRenderer.removeListener('prompt-response', callback), // Удаление обработчика

    // Эти методы были не в объекте, добавляем их внутрь объекта
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    listFiles: (dirPath) => ipcRenderer.invoke('list-files', dirPath),
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    createFile: (dirPath, fileName) => ipcRenderer.invoke('create-file', dirPath, fileName),
    deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
    saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),
    renameFile: (oldFilePath, newFilePath) => ipcRenderer.invoke('rename-file', oldFilePath, newFilePath)
});
