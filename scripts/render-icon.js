/* 用 Electron 把 scripts/icon.svg 栅格化为 build/icon.png（256×256，透明圆角） */
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const svg = fs.readFileSync(path.join(__dirname, 'icon.svg'), 'utf8');
const out = path.join(__dirname, '..', 'build', 'icon.png');
const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('force-device-scale-factor', '2');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 256, height: 256,
    show: false, frame: false, transparent: true,
    webPreferences: { offscreen: true }
  });
  win.webContents.once('did-finish-load', async () => {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      const img = await win.webContents.capturePage({ x: 0, y: 0, width: 256, height: 256 });
      fs.writeFileSync(out, img.toPNG());
      console.log('OK', out, JSON.stringify(img.getSize()));
    } catch (e) {
      console.error('CAPTURE_ERROR', e && e.message);
    }
    app.quit();
  });
  win.loadURL(url);
  setTimeout(() => { console.error('TIMEOUT'); app.exit(1); }, 15000);
});
