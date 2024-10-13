const { contextBridge, ipcRenderer } = require('electron');

// Связываем с рендер-процессом
contextBridge.exposeInMainWorld('electronAPI', {
    showAlert: (message) => ipcRenderer.invoke('show-alert', message),
    showConfirm: (message) => ipcRenderer.invoke('show-confirm', message),
    openPrompt: (promptType) => ipcRenderer.send('open-prompt-window', promptType), // Передаем тип запроса
    sendPromptInput: (input) => ipcRenderer.send('prompt-input', input), // Отправить данные
    onPromptResponse: (callback) => ipcRenderer.on('prompt-response', (event, response) => callback(response)), // Стандартная подписка
    oncePromptResponse: (callback) => ipcRenderer.once('prompt-response', (event, response) => callback(response)), // Одноразовая подписка
    offPromptResponse: (callback) => ipcRenderer.removeListener('prompt-response', callback) // Удаление обработчика
});
