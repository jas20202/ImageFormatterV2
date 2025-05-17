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