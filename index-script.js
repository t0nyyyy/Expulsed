// index-script.js - JavaScript for the homepage (index.html)

document.addEventListener('DOMContentLoaded', () => {
    function loadSvgArt() {
        fetch('logo.svg')
            .then(response => response.text())
            .then(svgText => {
                const asciiArtContainer = document.getElementById('ascii-art-container');
                if (asciiArtContainer) {
                    asciiArtContainer.innerHTML = svgText;
                } else {
                    console.error("Could not find #ascii-art-container");
                }
            })
            .catch(error => console.error('Error loading SVG art:', error));
    }

    loadSvgArt();
});