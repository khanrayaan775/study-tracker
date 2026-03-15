const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

function getStorePath() {
  return path.join(app.getPath('userData'), 'store.json');
}

function readStore() {
  try {
    const data = fs.readFileSync(getStorePath(), 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function writeStore(store) {
  fs.writeFileSync(getStorePath(), JSON.stringify(store), 'utf8');
}

ipcMain.handle('storage-get', (_, key) => {
  const store = readStore();
  return { value: store[key] ?? null };
});

ipcMain.handle('storage-set', (_, key, value) => {
  const store = readStore();
  store[key] = value;
  writeStore(store);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 700,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f5',
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    const base = path.join(app.getAppPath(), 'dist');
    win.loadFile(path.join(base, 'index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
