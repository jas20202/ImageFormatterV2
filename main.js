const { ipcMain, dialog, app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');

function createMainWindow() {
	const mainWindow = new BrowserWindow({
		title: 'Image Formatter',
		width: 1000,
		height: 600
	});

    const startUrl = url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
    }); // Sieht aus, als sei format depricated, ggfs. muss ich das anders machen
    
    mainWindow.loadURL(startUrl);
}

let jsonData = [];

ipcMain.on('save-entry', async (event, { formData, imageBuffer, imageName }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Entry Folder',
      buttonLabel: 'Save',
      defaultPath: 'image-data',
      properties: ['createDirectory', 'showOverwriteConfirmation']
    });

    if (canceled) return;

    const dir = filePath.replace(/\.json$/, ''); // remove `.json` if present
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    const imagesDir = path.join(dir, 'images');
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

    if (imageBuffer && imageName) {
      const imagePath = path.join(imagesDir, imageName);
      fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
      formData.PathOfImage = `./images/${imageName}`;
    }

    // Save JSON entry
    jsonData.push(formData);
    const jsonPath = path.join(dir, 'image-metadata.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

    event.sender.send('save-success', 'Data saved successfully!');
  } catch (err) {
    console.error('Failed to save:', err);
    event.sender.send('save-failure', err.message);
  }
});

app.whenReady().then(createMainWindow);