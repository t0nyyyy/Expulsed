// uiSetup.js

// Import the setup functions from other modules
import { setupStationLists } from './stationListSetup.js';
import { setupZoomBar, resizePreview } from './zoomBarSetup.js';

window.setupUI = async function() {
    // Set up the station and outpost lists
    await setupStationLists();

    // Set up the zoom bar
    setupZoomBar();

    // Add a window resize event handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        resizePreview();
    });

    // Initial resize
    resizePreview();
};