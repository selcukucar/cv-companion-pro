const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createMenu() {
  const template = [
    {
      label: 'Dosya',
      submenu: [
        { label: 'Yeni Taslak', accelerator: 'CmdOrCtrl+N', click: () => mainWindow.webContents.send('menu:new') },
        { label: 'Taslakları Yönet', accelerator: 'CmdOrCtrl+T', click: () => mainWindow.webContents.send('menu:drafts') },
        { type: 'separator' },
        { label: 'PDF İçe Aktar', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu:import') },
        { label: 'PDF Olarak Kaydet', accelerator: 'CmdOrCtrl+S', click: () => mainWindow.webContents.send('menu:save-pdf') },
        { label: 'Word Olarak Kaydet', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow.webContents.send('menu:save-docx') },
        { type: 'separator' },
        { label: 'Çıkış', role: 'quit' }
      ]
    },
    {
      label: 'Araçlar',
      submenu: [
        { label: 'AI Özet Oluştur', accelerator: 'CmdOrCtrl+G', click: () => mainWindow.webContents.send('menu:ai') },
        { label: 'Erişilebilirlik Denetimi', accelerator: 'F7', click: () => mainWindow.webContents.send('menu:check') },
        { label: 'Metinleri Düzenle', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('menu:autofix') },
        { type: 'separator' },
        { label: 'AI Ayarları', click: () => mainWindow.webContents.send('menu:ai-settings') }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Tema Değiştir', accelerator: 'CmdOrCtrl+Shift+T', click: () => mainWindow.webContents.send('menu:theme') },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Kısayollar', accelerator: 'F1', click: () => mainWindow.webContents.send('menu:help') },
        { label: 'Hakkında', click: () => dialog.showMessageBox(mainWindow, {
          type: 'info', title: 'Hakkında',
          message: 'Öz Geçmiş Asistanı v3.0',
          detail: 'Profesyonel, erişilebilir CV oluşturucu.\nElectron + JavaScript ile geliştirildi.'
        }) }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Öz Geçmiş Asistanı v3.0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  createMenu();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store');
  global.store = new Store({ name: 'ozgecmis-data' });

  ipcMain.handle('store:get', (_, key) => global.store.get(key));
  ipcMain.handle('store:set', (_, key, value) => { global.store.set(key, value); return true; });
  ipcMain.handle('store:delete', (_, key) => { global.store.delete(key); return true; });

  ipcMain.handle('dialog:openImage', async () => {
    const r = await dialog.showOpenDialog(mainWindow, {
      title: 'Profil Fotoğrafı Seç',
      filters: [{ name: 'Görseller', extensions: ['jpg', 'jpeg', 'png'] }],
      properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    const p = r.filePaths[0];
    const ext = path.extname(p).slice(1).toLowerCase();
    const b64 = fs.readFileSync(p).toString('base64');
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${b64}`;
  });

  ipcMain.handle('pdf:extract', async () => {
    const r = await dialog.showOpenDialog(mainWindow, {
      title: 'PDF Dosyası Seç',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(fs.readFileSync(r.filePaths[0]));
      return data.text || '';
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('dialog:save', async (_, { defaultName, filters, dataBase64 }) => {
    const r = await dialog.showSaveDialog(mainWindow, { defaultPath: defaultName, filters });
    if (r.canceled || !r.filePath) return null;
    fs.writeFileSync(r.filePath, Buffer.from(dataBase64, 'base64'));
    return r.filePath;
  });

  ipcMain.handle('ai:generate', async (_, { apiKey, prompt, model }) => {
    if (!apiKey) throw new Error('API anahtarı ayarlanmamış. Araçlar → AI Ayarları menüsünden anahtarınızı girin.');
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Sen Türkçe profesyonel CV yazım uzmanısın. Kısa, etkili, işveren odaklı özetler üretirsin.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    if (!res.ok) throw new Error(`AI hatası (${res.status}): ${await res.text()}`);
    const j = await res.json();
    return j.choices?.[0]?.message?.content || '';
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
