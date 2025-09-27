const saveJsonButton = document.getElementById('saveJSON');
let basePath = '';
let loadedData = [];

saveJsonButton.addEventListener('click', function () {
    console.log("BasePath: " + basePath);
    const formData = getFormData();

    if (selectedIndex >= 0) {
        loadedData[selectedIndex] = formData;
    } else {
        loadedData.push(formData);
        selectedIndex = loadedData.length - 1;
    }

    // Delegate saving to main process via IPC
    saveEntryWithImage(formData, currentImageFile);
    renderEntryList();
});

async function saveEntryWithImage(formData, imageFile) {
    const fileReader = new FileReader();
    fileReader.onload = async function (e) {
        console.log(e);
        // Send everything to the main process
        basePath = await electronAPI.saveEntry({
            formData,
            imageBuffer: e.target.result,
            imageName: `${formData.Id}.png`,
            basePath
        });
    };

    if (imageFile) {
        fileReader.readAsArrayBuffer(imageFile);
    } else {
        basePath = await electronAPI.saveEntry({ formData });
    }
}

async function loadJSON() {
    const filePath = await electronAPI.openFile();
    basePath = electronAPI.dirname(filePath);
    if (filePath) {
        const data = await electronAPI.readFile(filePath);
        try {
            loadedData = JSON.parse(data);
            if (Array.isArray(loadedData) && loadedData.length > 0) {
                selectedIndex = 0;
                setFormData(loadedData[0]);
                renderEntryList();
            } else {
                alert("JSON is not a valid array or is empty.");
            }
        } catch (err) {
            alert("Error parsing JSON: " + err.message);
        }
    }
}