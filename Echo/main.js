const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    autoHideMenuBar: true,
    backgroundColor: '#08080f', // matches your theme
    icon: path.join(__dirname, 'assets/icon.png') // your icon
  });

  // 🔥 ALWAYS load your local file
  win.loadFile('destini.html');
}

app.whenReady().then(createWindow);
