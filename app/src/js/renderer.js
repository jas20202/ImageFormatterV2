let selectedIndex = -1;
const customCharactersPath = "./settings/CustomCharacters.csv";
const customCategoriesPath = "./settings/CustomCategories.csv";
const defaultCharactersPath = "./settings/DefaultCharacters.csv";
const defaultCategoriesPath = "./settings/DefaultCategories.csv";

document.addEventListener('DOMContentLoaded', () => {
  loadCharacterList();
  loadCategoriesList()
});

async function loadCharacterList() {
    const customExists = await electronAPI.checkIfFileExists(customCharactersPath);
    let data = []
    if(customExists) {
        data = await electronAPI.readCSV(customCharactersPath);
    }else{
        data = await electronAPI.readCSV(defaultCharactersPath);
    }
    renderCheckboxList('characters-list', data);
}

async function loadCategoriesList() {
    const customExists = await electronAPI.checkIfFileExists(customCategoriesPath);
    let data = []
    if(customExists) {
        data = await electronAPI.readCSV(customCategoriesPath);
    }else{
        data = await electronAPI.readCSV(defaultCategoriesPath);
    }
    renderCheckboxList('categories-list', data);
}

function renderCheckboxList(id, data) {
    const listContainer = document.getElementById(id);
    listContainer.innerHTML = '';

    data.forEach((entry) => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = "checkbox";
        input.value = entry;
        
        label.appendChild(input);
        label.appendChild(document.createTextNode(entry));
        listContainer.appendChild(label);
    });
}

function getFormData() {
    console.log('saving... ' + currentImageFile);
    console.log('path... ' + currentImagePath);
    return {
        Id: loadedData[selectedIndex]?.Id || crypto.randomUUID(),
        PathOfImage: currentImageFile ? '': currentImagePath,  // leave blank if uploading a new image
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
 
async function setFormData(data) {
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
        setImage(data.PathOfImage);
    }
}

function clearFields() {
    setFormData({});
    preview.setAttribute('src', '#');
    preview.style.display = 'none';
    imageInput.value = '';
    selectedIndex = -1;
    currentImageFile = null;
    currentImagePath = "";
    imageLabel.innerHTML = "Load image";
    console.log("clearing... " + currentImageFile);
}

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
        div.id = 'entry-name';
        if (index === selectedIndex) {
            div.style.backgroundColor = 'var(--color-primary-100)';
            div.style.color = 'var(--color-surface-100)';
        }

        div.addEventListener('click', () => {
            selectedIndex = index;
            console.log(entry);
            setFormData(entry);
            renderEntryList();
        });

        listContainer.appendChild(div);
    });
}
