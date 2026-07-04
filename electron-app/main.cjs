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
        { label: 'JSON İçe Aktar', click: () => mainWindow.webContents.send('menu:import-json') },
        { label: 'JSON Olarak Yedekle', click: () => mainWindow.webContents.send('menu:export-json') },
        { label: 'PDF\'den Bilgi Çek', accelerator: 'CmdOrCtrl+O', click: () => mainWindow.webContents.send('menu:import') },
        { type: 'separator' },
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
        { label: 'Erişilebilirlik & İçerik Denetimi', accelerator: 'F7', click: () => mainWindow.webContents.send('menu:check') },
        { label: 'Metinleri Otomatik Düzenle', accelerator: 'CmdOrCtrl+D', click: () => mainWindow.webContents.send('menu:autofix') },
        { type: 'separator' },
        { label: 'AI Sağlayıcı Ayarları', click: () => mainWindow.webContents.send('menu:ai-settings') }
      ]
    },
    {
      label: 'Görünüm',
      submenu: [
        { label: 'Tema Değiştir', accelerator: 'CmdOrCtrl+Shift+T', click: () => mainWindow.webContents.send('menu:theme') },
        { label: 'Yazı Boyutu +', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.send('menu:font-inc') },
        { label: 'Yazı Boyutu -', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.send('menu:font-dec') },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Yardım',
      submenu: [
        { label: 'Kullanım Kılavuzu', accelerator: 'F1', click: () => mainWindow.webContents.send('menu:help') },
        { label: 'Kısayollar', accelerator: 'F2', click: () => mainWindow.webContents.send('menu:shortcuts') },
        { label: 'Hakkında', click: () => dialog.showMessageBox(mainWindow, {
          type: 'info', title: 'Hakkında',
          message: 'Öz Geçmiş Asistanı v4.0',
          detail: 'Profesyonel, erişilebilir CV oluşturucu.\n\nOpenAI & Gemini AI destekli.\nElectron + JavaScript ile geliştirildi.\n\n© 2026'
        }) }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'Öz Geçmiş Asistanı v4.0',
    backgroundColor: '#0f1216',
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
    const stat = fs.statSync(p);
    if (stat.size > 5 * 1024 * 1024) return { error: 'Görsel 5 MB\'dan büyük olamaz.' };
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
      return { text: data.text || '' };
    } catch (e) {
      return { error: e.message };
    }
  });

  ipcMain.handle('dialog:openJson', async () => {
    const r = await dialog.showOpenDialog(mainWindow, {
      title: 'JSON Yedeği Seç',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (r.canceled || !r.filePaths[0]) return null;
    try {
      const txt = fs.readFileSync(r.filePaths[0], 'utf8');
      return { data: JSON.parse(txt) };
    } catch (e) {
      return { error: 'Geçersiz JSON: ' + e.message };
    }
  });

  ipcMain.handle('dialog:save', async (_, { defaultName, filters, dataBase64, dataText }) => {
    const r = await dialog.showSaveDialog(mainWindow, { defaultPath: defaultName, filters });
    if (r.canceled || !r.filePath) return null;
    try {
      if (dataText != null) fs.writeFileSync(r.filePath, dataText, 'utf8');
      else fs.writeFileSync(r.filePath, Buffer.from(dataBase64, 'base64'));
      return r.filePath;
    } catch (e) {
      return { error: e.message };
    }
  });

  // HIGH-FIDELITY PDF: render HTML in hidden window, use Chromium printToPDF (full Unicode/Türkçe support)
  ipcMain.handle('pdf:renderFromHtml', async (_, { html, defaultName }) => {
    const r = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    if (r.canceled || !r.filePath) return null;

    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true, sandbox: true, contextIsolation: true, nodeIntegration: false }
    });
    try {
      await win.loadURL('data:text/html;charset=utf-8;base64,' + Buffer.from(html, 'utf8').toString('base64'));
      // wait a tick for fonts/images
      await new Promise(res => setTimeout(res, 250));
      const pdf = await win.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { top: 0.4, bottom: 0.4, left: 0.4, right: 0.4 }
      });
      fs.writeFileSync(r.filePath, pdf);
      return r.filePath;
    } catch (e) {
      return { error: e.message };
    } finally {
      win.destroy();
    }
  });

  ipcMain.handle('ai:generate', async (_, { provider, apiKey, model, prompt, system }) => {
    if (!apiKey) throw new Error('API anahtarı yok. Araçlar → AI Sağlayıcı Ayarları menüsünden anahtarınızı girin.');
    const sys = system || 'Sen Türkçe profesyonel CV yazım uzmanısın. Kısa, etkili, işveren odaklı, ATS uyumlu metinler üretirsin. Sadece istenen çıktıyı ver, açıklama ekleme.';

    try {
      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: sys }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          })
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Gemini hatası (${res.status}): ${t.slice(0, 300)}`);
        }
        const j = await res.json();
        return j.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
      }

      // OpenAI (default)
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            { role: 'system', content: sys },
            { role: 'user', content: prompt }
          ]
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`OpenAI hatası (${res.status}): ${t.slice(0, 300)}`);
      }
      const j = await res.json();
      return j.choices?.[0]?.message?.content || '';
    } catch (e) {
      if (e.message?.includes('fetch failed') || e.message?.includes('ENOTFOUND')) {
        throw new Error('İnternet bağlantısı kurulamadı. Ağınızı kontrol edin.');
      }
      throw e;
    }
  });

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
