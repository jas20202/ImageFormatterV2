const saveJsonButton = document.getElementById('saveJSON');
let basePath = '';
let loadedData = [];

saveJsonButton.addEventListener('click', function () {
    console.log("I was clicked");
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

function saveEntryWithImage(formData, imageFile) {
    const fileReader = new FileReader();
    fileReader.onload = function (e) {
        console.log(e);
        // Send everything to the main process
        electronAPI.saveEntry({
            formData,
            imageBuffer: e.target.result,
            imageName: `${formData.Id}.png`
        });
    };

    if (imageFile) {
        fileReader.readAsArrayBuffer(imageFile);
    } else {
        electronAPI.saveEntry({ formData });
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
    //document.getElementById('json-loader').click();
}

document.getElementById('json-loader').addEventListener('change', function () { 
    const file = this.files[0];
    if (file) {
        console.log('test: ' + file.webkitRelativePath)
        basePath = electronAPI.dirname(file.webkitRelativePath);
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                loadedData = JSON.parse(e.target.result);
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
        };
        reader.readAsText(file);
    }
});