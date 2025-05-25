const { ipcMain, dialog, app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { electron } = require('process');
const sharp = require('sharp');
const url = require('url');
const fs = require('fs').promises;

const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac
    ? [{
        label: app.name,
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }]
    : []),
  // { role: 'fileMenu' }
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
            { type: 'separator' },
            {
              label: 'Speech',
              submenu: [
                { role: 'startSpeaking' },
                { role: 'stopSpeaking' }
              ]
            }
          ]
        : [
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
          ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac
        ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ]
          : [
            { role: 'close' },
            { type: 'separator' },
            {
              label: 'Settings',
              click: async () => {
                const { shell } = require('electron')
                createSettingsWindow()
              }
            }
          ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Learn More',
        click: async () => {
          const { shell } = require('electron')
          await shell.openExternal('https://github.com/jas20202/ImageFormatterV2')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		title: 'Image Formatter',
		width: 1100,
		height: 650,
    icon: path.join(__dirname, 'favicon.png'),
      webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, 'preload.js')
      }
	});

  const startUrl = url.format({
      pathname: path.join(__dirname, 'ui/index.html'),
      protocol: 'file',
  });

  mainWindow.loadURL(startUrl);
}

function createSettingsWindow() {
	const settingsWindow = new BrowserWindow({
		title: 'Settings',
		width: 750,
		height: 420,
    icon:'favicon.png',
      webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, 'preload.js')
      }
	});

  const settingsUrl = url.format({
      pathname: path.join(__dirname, 'ui/settings.html'),
      protocol: 'file',
  });
  settingsWindow.setMenu(null);
  settingsWindow.loadURL(settingsUrl);
  // settingsWindow.on('close', (e) => {
  //   ipcMain.emit('refresh-checkboxes');
  // });
}


app.whenReady().then(() => {
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
  });

  ipcMain.handle('file:readFile', async (event, filePath) => {
      const data = await fs.readFile(filePath, 'utf8');
      return data;
  });

  ipcMain.handle('file:checkIfExists', async (event, filePath) => {
    try {
      filePath = path.join(__dirname, filePath),
      await fs.readFile(filePath, 'utf8');
      return true;
    } catch (err) {
      return false;
    }
  });

  ipcMain.handle('file:readCSV', async (event, filePath) => {
    try {
      filePath = path.join(__dirname, filePath);
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = fileContent.split(',');
    } catch (err) {
      data = []
    }
    return data;
  });

  ipcMain.handle('file:writeCSV', async (event, filePath, data) => {
    const content = data.toString();
    await fs.writeFile(filePath, content);
    return data;
  });

  ipcMain.handle('save-entry', async (event, { formData, imageBuffer, imageName, basePath }) => {
      let baseDir = basePath;
      console.log(baseDir);
      if(basePath == ''){
        console.log("Saving new JSON...")
        const { canceled, filePaths } = await dialog.showOpenDialog({
          title: 'Choose folder to save your files',
          properties: ['openDirectory'],
        });
        baseDir = filePaths[0]; 
      
        if (canceled) return '';
      }

      try {
        const imagesDir = path.join(baseDir, 'images');
        const thumbsDir = path.join(baseDir, 'thumbnails');
        const jsonPath = path.join(baseDir, 'image-metadata.json');
    
        // Check if directories exist, if not create them
        try {
          await fs.access(imagesDir);
        } catch (err) {
          console.log('Creating images directory');
          await fs.mkdir(imagesDir, { recursive: true });
        }
    
        try {
          await fs.access(thumbsDir);
        } catch (err) {
          console.log('Creating thumbnails directory');
          await fs.mkdir(thumbsDir, { recursive: true });
        }
    
        // Write image if present
        if (imageBuffer && imageName) {
          const imgPath = path.join(imagesDir, imageName);
          console.log('Saving image to:', imgPath);
          await fs.writeFile(imgPath, Buffer.from(imageBuffer)); // Using promises version of writeFile
    
          // Assuming you're using `sharp` to generate thumbnails
          const thumbPath = path.join(thumbsDir, imageName);
          await sharp(Buffer.from(imageBuffer))
            .resize({ height: 200 })
            .toFile(thumbPath);
    
          formData.PathOfImage = path.join('images', imageName); // Update image path
        }
    
        // Read and update JSON metadata
        let data = [];
        try {
          data = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
        } catch (err) {
          console.error('Failed to read existing JSON.');
        }
    
        // Update or insert formData
        const existingIndex = data.findIndex(item => item.Id === formData.Id);
        if (existingIndex !== -1) {
          data[existingIndex] = formData; // Replace existing entry
        } else {
          data.push(formData); // Add new entry
        }
    
        // Save updated data to JSON
        await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
        console.log('Metadata saved successfully');
        console.log(baseDir);
        return baseDir;
      } catch (err) {
        console.error('Error saving entry:', err);
      }
  });

  createMainWindow();
});