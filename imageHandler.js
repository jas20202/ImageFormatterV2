const imageInput = document.getElementById('image');
const preview = document.getElementById('image-preview');

let currentImageFile = null;  // Store current uploaded file
let currentImagePath = '';    // Store original path (e.g., from JSON)

function setImage(pathOfImage) {
    const fullPath = electronAPI.joinPath(basePath, pathOfImage);
    preview.src = `file://${fullPath}`;
    preview.style.display = 'block';
    currentImagePath = pathOfImage;
    currentImageFile = null;
    console.log(fullPath);
}

imageInput.addEventListener('change', function () {
    console.log(currentImagePath);
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
            currentImageFile = file;
            if(selectedIndex === -1) {
                currentImagePath = ""; 
            }
            console.log("inserting... " + currentImageFile);
        };
        reader.readAsDataURL(file); 
    } else {
        preview.src = '#';
        preview.style.display = 'none';
        currentImageFile = null;
        currentImagePath = '';
        console.log("none selected... " + currentImageFile);
    }
}); 