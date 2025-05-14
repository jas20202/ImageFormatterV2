const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const sharp = require('sharp');
const url = require('url');
const fs = require('fs').promises;

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		title: 'Image Formatter',
		width: 1000,
		height: 600,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
	});

    const startUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
    }); // Sieht aus, als sei format depricated, ggfs. muss ich das anders machen
    
    mainWindow.loadURL(startUrl);
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

  ipcMain.on('save-entry', async (event, { formData, imageBuffer, imageName }) => {
      console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA")
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Choose folder to save your files',
        properties: ['openDirectory'],
      });
    
      if (canceled) return;
    
      const baseDir = filePaths[0];
      const imagesDir = path.join(baseDir, 'images');
      const thumbsDir = path.join(baseDir, 'thumbnails');
      const jsonPath = path.join(baseDir, 'image-metadata.json');
    
      if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
      if (!fs.existsSync(thumbsDir)) fs.mkdirSync(thumbsDir, { recursive: true });
    
      // Write image if present
      if (imageBuffer && imageName) {
        const imgPath = path.join(imagesDir, imageName);
        console.log(imgPath);
        fs.writeFileSync(imgPath, Buffer.from(imageBuffer));

        const thumbPath = path.join(thumbsDir, imageName);
        await sharp(Buffer.from(imageBuffer))
          .resize({ height: 200 }) // Or height, or both
          .toFile(thumbPath);

        formData.PathOfImage = path.join('images', imageName); // Absolute path
      }
    
      let data = [];
      if (fs.existsSync(jsonPath)) {
        try {
          data = JSON.parse(fs.readFileSync(jsonPath));
        } catch (err) {
          console.error('Failed to read existing JSON:', err);
        }
      }
    
      // Update or insert formData
      const existingIndex = data.findIndex(item => item.Id === formData.Id);
      if (existingIndex !== -1) {
        data[existingIndex] = formData;
      } else {
        data.push(formData);
      }
    
      fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
    
      event.sender.send('save-success', 'Saved!');
  });

  createMainWindow();
});