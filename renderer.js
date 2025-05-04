const imageInput = document.getElementById('image');
const saveJsonButton = document.getElementById('saveJSON');
const preview = document.getElementById('image-preview');

let loadedData = [];
let selectedIndex = -1;
let currentImageFile = null;  // Store current uploaded file
let currentImagePath = '';    // Store original path (e.g., from JSON)
let basePath = '';

imageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        console.log(file); 
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            currentImageFile = file;
            currentImagePath = ""; // clear previous path
        };
        reader.readAsDataURL(file); 
    } else {
        preview.src = '#';
        preview.style.display = 'none';
        currentImageFile = null;
        currentImagePath = '';
    }
}); 

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

function getFormData() {
    return {
        Id: loadedData[selectedIndex]?.Id || crypto.randomUUID(),
        PathOfImage: currentImageFile ? preview.src : currentImagePath,  // leave blank if uploading a new image
        Title: document.getElementById('name').value,
        AltText: document.getElementById('alt').value,
        Description: document.getElementById('caption').value,
        CreationDate: document.getElementById('creation-date').value,
        Categories: Array.from(document.querySelectorAll('input[name="categories"]:checked')).map(cb => cb.value),
        Characters: Array.from(document.querySelectorAll('input[name="characters"]:checked')).map(cb => cb.value),
        Medium: document.querySelector('input[name="medium"]:checked')?.value || '',
        NeedsTriggerWarning: document.getElementById('trigger-warning').checked,
        YouTubeLink: document.getElementById('youtube-link').value,
        SpotifyLink: document.getElementById('spotify-link').value
    };
}
 
function setFormData(data) {
    document.getElementById('name').value = data.Title || '';
    document.getElementById('alt').value = data.AltText || '';
    document.getElementById('caption').value = data.Description || '';
    document.querySelectorAll('input[name="categories"]').forEach(cb => cb.checked = data.Categories?.includes(cb.value));
    document.querySelectorAll('input[name="characters"]').forEach(cb => cb.checked = data.Characters?.includes(cb.value));
    document.querySelectorAll('input[name="medium"]').forEach(rb => rb.checked = (rb.value === data.Medium));
    document.getElementById('creation-date').value = data.CreationDate || '';
    document.getElementById('trigger-warning').checked = data.NeedsTriggerWarning || false;
    document.getElementById('youtube-link').value = data.YouTubeLink || '';
    document.getElementById('spotify-link').value = data.SpotifyLink || '';

    if (data.PathOfImage) {
        const fullPath = electronAPI.joinPath(basePath, data.PathOfImage);
        console.log(fullPath);
        preview.src = `file://${fullPath}`;
        preview.style.display = 'block';
    }
}

function clearFields() {
    setFormData({});
    preview.setAttribute('src', '#');
    preview.style.display = 'none';
    imageInput.value = '';
    selectedIndex = -1;
}

function loadJSON() {
    document.getElementById('json-loader').click();
}

document.getElementById('json-loader').addEventListener('change', function () { 
    const file = this.files[0];
    basePath = filePaths[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                loadedData = JSON.parse(e.target.result);
                if (Array.isArray(loadedData) && loadedData.length > 0) {
                    selectedIndex = 0;
                    setFormData(loadedData[0]);
                } else {
                    alert("JSON is not a valid array or is empty.");
                }
            } catch (err) {
                alert("Error parsing JSON: " + err.message);
            }
        };
        reader.readAsText(file);
        renderEntryList();
    }
});

function deleteEntry() {
    if (selectedIndex >= 0 && confirm("Delete this entry?")) {
    loadedData.splice(selectedIndex, 1);
    if (loadedData.length > 0) {
        selectedIndex = 0;
        setFormData(loadedData[0]);
    } else {
        clearFields();
        loadedData = [];
    }
    }
    renderEntryList();
}

function renderEntryList() {
    const listContainer = document.getElementById('entry-list');
    listContainer.innerHTML = '';

    loadedData.forEach((entry, index) => {
        const div = document.createElement('div');
        div.textContent = entry.Title || `(Untitled #${index + 1})`;
        div.className = 'entry-item';
        div.style.cursor = 'pointer';
        div.style.padding = '5px';
        div.style.borderBottom = '1px solid #eee';
        if (index === selectedIndex) {
            div.style.backgroundColor = '#ddeeff';
        }

        div.addEventListener('click', () => {
            selectedIndex = index;
            setFormData(entry);
            renderEntryList();
        });

        listContainer.appendChild(div);
    });
}