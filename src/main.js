
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#1e1e1e',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon: path.join(__dirname, 'EP.ico')
  });

  mainWindow.loadFile('./src/index.html');
  
  // Ensure window stays on top even if focus is lost
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  
  // Keep on top after focus loss
  mainWindow.on('blur', () => {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  });
  
  // Register global shortcuts
  registerShortcuts();
}

function registerShortcuts() {
  // Ctrl+M to minimize
  globalShortcut.register('CommandOrControl+M', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        mainWindow.focus();
      } else {
        mainWindow.minimize();
      }
    }
  });
  
  // Ctrl+N to restore/show
  globalShortcut.register('CommandOrControl+N', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.show();
      mainWindow.focus();
      mainWindow.setAlwaysOnTop(true, 'screen-saver');
    }
  });
}

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

// Unregister all shortcuts when app quits
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Handle AI requests from renderer
ipcMain.handle('send-message', async (event, message, apiKey, provider = 'groq') => {
  try {
    let url, model;
    
    if (provider === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      model = 'llama-3.3-70b-versatile';
    } else {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      model = 'google/gemini-2.0-flash-exp:free';
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        ...(provider === 'openrouter' && {
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'Electron AI Chat'
        })
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error?.message || JSON.stringify(data);
      throw new Error(`${errorMsg}`);
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API');
    }

    return { 
      success: true, 
      response: data.choices[0].message.content 
    };
  } catch (error) {
    console.error('Full error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});