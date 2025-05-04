const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

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
    ipcMain.on('save-entry', async (event, { formData, imageBuffer, imageName }) => {
        console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA")
        const { canceled, filePaths } = await dialog.showOpenDialog({
          title: 'Choose folder to save your files',
          properties: ['openDirectory'],
        });
      
        if (canceled) return;
      
        const baseDir = filePaths[0];
        const imagesDir = path.join(baseDir, 'images');
        const jsonPath = path.join(baseDir, 'image-metadata.json');
      
        if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
      
        // Write image if present
        if (imageBuffer && imageName) {
          const imgPath = path.join(imagesDir, imageName);
          fs.writeFileSync(imgPath, Buffer.from(imageBuffer));
          formData.PathOfImage = path.join(imagesDir, imageName); // Absolute path
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