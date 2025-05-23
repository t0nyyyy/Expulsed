import {
    init as initThreeD,
    stationGroup,
    animate as animateThreeD,
    setStationRotation,
    highlightSector,
    unhighlightSector,
    unhighlightAllSectors
} from './moon-camp-3d.js';

// === NEW: Import background effect controls ===
import {
    initBackgroundEffect,
    startBackgroundEffect,
    stopBackgroundEffect,
    resizeBackgroundEffect
} from './moon-camp-background.js';
// ============================================

// --- State Variables Moved to Top Scope ---
// REMOVED: let videoPlaylist = [];
// REMOVED: let currentVideoIndex = 0;
let messagesArray = [];
let zoneDescriptions = {};
let zoneHighlightColors = {}; // *** NEW: Store highlight colors ***
let backgroundEffectEnabled = true; // *** NEW: State for background effect ***
let customAnimationsEnabled = true; // *** ADDED: State for custom split animations ***
let rotationAngle = 0;
let isSpinning = true;
let animationFrameId = null; // For station rotation logic loop
let threeJsInitialized = false; // *** CRITICAL FLAG ***

// --- DOM Element Variables ---
let legendItems, zoneDescriptionDiv, scanButton,
    // REMOVED: videoPlayerContainer,
    matrixRainToggleButton, // Keep the button variable, ID is the same ('matrixRainToggle')
    spinToggleButton, statusReportDiv,
    asciiArtContainerBottom,
    toggleCustomAnimationsButton, // *** ADDED ***
    splitAnimationWrapper; // *** ADDED ***


// --- Central Initialization Function ---
function initializeEverything() {
    // *** Check if already initialized ***
    if (threeJsInitialized) {
        console.log("Skipping initializeEverything - Already ran."); // DEBUG
        return;
    }
    console.log("Running initializeEverything (Triggered after reveal)..."); // DEBUG

    // Assign DOM elements now that DOM is loaded
    legendItems = document.querySelectorAll('.legend-item');
    zoneDescriptionDiv = document.getElementById('zone-description');
    scanButton = document.getElementById('scanButton');
    // REMOVED: videoPlayerContainer = document.getElementById('video-player-container');
    matrixRainToggleButton = document.getElementById('matrixRainToggle');
    spinToggleButton = document.getElementById('spinToggle');
    statusReportDiv = document.getElementById('status-report');
    asciiArtContainerBottom = document.getElementById('ascii-art-bottom-left');
    // *** ADDED Assignments ***
    toggleCustomAnimationsButton = document.getElementById('toggleCustomAnimationsButton');
    splitAnimationWrapper = document.querySelector('.split-animation-wrapper');
    // *************************

    // --- Initialize 3D ---
    try {
        initThreeD();
        animateThreeD(); // Start the Three.js render loop (runs continuously)
        console.log("Three.js Initialized and Animation Loop Started."); // DEBUG
    } catch(err) {
         console.error("ERROR during Three.js init or animation start:", err);
         if(zoneDescriptionDiv) zoneDescriptionDiv.textContent = "Error loading 3D map.";
         return; // Stop further initialization if 3D fails critically
    }

    // --- Mark as Initialized *** BEFORE *** starting other loops/fetches ---
    threeJsInitialized = true;

    // --- Initial Calls for other features ---
    // Fetch background ASCII art
    fetch('moon.txt')
        .then(response => response.text())
        .then(asciiArt => {
            const asciiArtPre = document.createElement('pre');
            asciiArtPre.id = 'background-moon-art';
            asciiArtPre.textContent = asciiArt;
            const body = document.body;
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                if (!document.getElementById('background-moon-art')) { body.insertBefore(asciiArtPre, navbar); }
            } else if (!document.getElementById('background-moon-art')) { body.appendChild(asciiArtPre); }
        })
        .catch(error => { console.error("Error loading moon.txt:", error); });

    // Fetch Bottom Left ASCII Art
    fetch('crater_ascii.txt')
        .then(response => response.text())
        .then(asciiArt => {
             if (asciiArtContainerBottom) { asciiArtContainerBottom.textContent = asciiArt; }
        })
        .catch(error => { console.error("Error fetching ASCII art:", error); });

    // === Initial setup for NEW Background Effect ===
    try {
        initBackgroundEffect('backgroundCanvas'); // Initialize the effect
        if (backgroundEffectEnabled) {
            startBackgroundEffect(); // Start if enabled by default
            if (matrixRainToggleButton) matrixRainToggleButton.textContent = 'EFFECTS: ON';
        } else {
             if (matrixRainToggleButton) matrixRainToggleButton.textContent = 'EFFECTS: OFF';
        }
    } catch (err) {
        console.error("ERROR initializing background effect:", err);
        if (matrixRainToggleButton) matrixRainToggleButton.textContent = 'EFFECTS: ERR';
    }
    // ==============================================

    // Start other features
    startMessageRotation();
    loadZoneDescriptions(); // *** This now also loads highlight colors ***
    // REMOVED: loadVideoPlaylist();
    updateBarPositions(); // Requires legendItems to be assigned

    // === Initialize Custom Split Animations ===
    console.log("Initializing custom split animations...");
    try {
        // Check if the functions exist before calling (robustness)
        if (typeof createNetworkNodePulse === 'function') {
            createNetworkNodePulse('moon-animation-alpha'); // Use the new ID
        } else {
            console.error("createNetworkNodePulse function not found!");
            const alphaContainer = document.getElementById('moon-animation-alpha');
            if (alphaContainer) alphaContainer.textContent = "Error: Network Pulse unavailable.";
        }

        if (typeof createBravoData === 'function') {
             createBravoData('moon-animation-bravo');       // Use the new ID
        } else {
            console.error("createBravoData function not found!");
            const bravoContainer = document.getElementById('moon-animation-bravo');
            if (bravoContainer) bravoContainer.textContent = "Error: Data Grid unavailable.";
        }
        console.log("Custom split animations initialized.");

        // Set initial visibility based on state
        if (splitAnimationWrapper) {
             splitAnimationWrapper.style.display = customAnimationsEnabled ? 'flex' : 'none';
        }
        if (toggleCustomAnimationsButton) {
            toggleCustomAnimationsButton.textContent = customAnimationsEnabled ? 'ANIMATIONS: ON' : 'ANIMATIONS: OFF';
        }

    } catch (error) {
        console.error("Error initializing custom split animations:", error);
        // Optional: Display error in the UI containers
        const alphaContainer = document.getElementById('moon-animation-alpha');
        if (alphaContainer) alphaContainer.textContent = "Animation Error";
        const bravoContainer = document.getElementById('moon-animation-bravo');
        if (bravoContainer) bravoContainer.textContent = "Animation Error";
    }
    // =========================================


    // --- START: Sequential Shine Sweep Logic (Unchanged) ---

    // 1. Select all the elements you want the shine applied to sequentially
    const shineTargets = document.querySelectorAll('.your-shine-target'); // Use the class you gave your target elements

    // 2. Filter out any null elements (robustness)
    const validShineTargets = Array.from(shineTargets).filter(el => el !== null);

    let currentShineIndex = 0;
    const numberOfTargets = validShineTargets.length;
    let shineTimeoutId = null; // To manage the timeout

    // 3. IMPORTANT: Set the duration in milliseconds.
    //    This MUST match the 'animation-duration' value in your CSS (e.g., 2.4s in CSS = 2400 here)
    const animationDuration = 2400;

    if (numberOfTargets > 0) {
        console.log(`Sequential Shine Initialized: ${numberOfTargets} targets, duration ${animationDuration}ms.`);

        // Function to trigger the shine on the next element
        const triggerNextShine = () => {
            // Remove shine from the current element (if it exists)
            if (validShineTargets[currentShineIndex]) {
               validShineTargets[currentShineIndex].classList.remove('is-shining');
            }

            // Move to the next index, looping back around
            currentShineIndex = (currentShineIndex + 1) % numberOfTargets;

            // Add shine to the new current element (if it exists)
            if (validShineTargets[currentShineIndex]) {
                validShineTargets[currentShineIndex].classList.add('is-shining');
            }

            // Schedule the next transition using the animation duration
            shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };

        // Function to start or restart the entire sequence
        const startShineSequence = () => {
             // Clear any pending timeout to prevent duplicates
             clearTimeout(shineTimeoutId);
             // Remove 'is-shining' from all targets for a clean start
             validShineTargets.forEach(target => target.classList.remove('is-shining'));
             // Add shine to the element at the current index
             if (validShineTargets[currentShineIndex]) {
                  validShineTargets[currentShineIndex].classList.add('is-shining');
             }
             // Set the first timeout to continue the sequence
             shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };

        // Initial start of the sequence
        startShineSequence();

        // Optional: Pause/Resume when the browser tab visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                 // Tab hidden: Pause the sequence
                 clearTimeout(shineTimeoutId);
                 if (validShineTargets[currentShineIndex]) {
                    validShineTargets[currentShineIndex].classList.remove('is-shining');
                 }
                 console.log('Shine sequence paused (tab hidden)');
            } else {
                 // Tab visible: Resume the sequence
                 console.log('Shine sequence restarting (tab visible)');
                 startShineSequence();
            }
        });

    } else {
        console.warn("Sequential Shine: Could not find any valid targets with '.your-shine-target'.");
    }

    // --- END: Sequential Shine Sweep Logic ---


    // --- Start rotation LOGIC loop ONLY if isSpinning is true ---
    // This loop *only* calculates the angle and calls the 3D function
    if (isSpinning) {
        animateRotation(); // Start the rotation *logic* loop
        if (spinToggleButton) spinToggleButton.textContent = 'SPIN: ON';
    } else {
        if (spinToggleButton) spinToggleButton.textContent = 'SPIN: OFF';
    }

    // Attach Event Listeners (Only once)
    attachEventListeners();
}

// --- setPageReady Hook (Unchanged) ---
let pageReadyCalled = false; // Flag for setPageReady
if (typeof window.setPageReady !== 'function') {
    console.log("setPageReady not found, creating..."); // DEBUG
    window.setPageReady = () => {
        if (pageReadyCalled) return; // Prevent multiple calls
        pageReadyCalled = true;
        console.log("Custom setPageReady called!"); // DEBUG
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => { if (loadingScreen) loadingScreen.style.display = 'none'; }, 500);
        }
        initializeEverything();
    };
} else {
    console.log("setPageReady found, wrapping original..."); // DEBUG
    const originalSetPageReady = window.setPageReady;
    window.setPageReady = () => {
        if (pageReadyCalled) return; // Prevent multiple calls
        pageReadyCalled = true;
        console.log("Wrapped setPageReady called!"); // DEBUG
        originalSetPageReady(); // Call the original function first
        initializeEverything(); // Then call our initialization
    };
}

// --- DOMContentLoaded Listener (Unchanged) ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Waiting for setPageReady to trigger init.");
});


// --- Helper Functions ---

// *** MODIFIED clearHighlights to include 3D (Unchanged from previous step) ***
const clearHighlights = () => {
    if (legendItems) {
        legendItems.forEach(item => {
            item.classList.remove('highlighted-legend');
        });
    }
    if (threeJsInitialized) { // Only call if 3D is ready
       unhighlightAllSectors(); // Call the imported 3D function
    }
};

// *** displayZoneInfo (Unchanged) ***
const displayZoneInfo = (sectorName) => {
    if (!zoneDescriptionDiv) return; // Check if assigned
    if (zoneDescriptions[sectorName]) {
        const zoneText = zoneDescriptions[sectorName].description;
        const zoneColor = zoneDescriptions[sectorName].color; // Use color from JSON if available
        zoneDescriptionDiv.textContent = zoneText;
        zoneDescriptionDiv.style.color = zoneColor || '#99ff99'; // Fallback to default green
    } else {
        zoneDescriptionDiv.textContent = "Click zone for info.";
        zoneDescriptionDiv.style.color = "#99ff99";
    }
};

// *** animateRotation (Logic Loop - Unchanged) ***
function animateRotation() {
    // 1. Perform rotation calculation for the current frame
    rotationAngle += 0.05;
    if (threeJsInitialized) { // Check 3D is ready before calling
       setStationRotation(rotationAngle);
    }

    // 2. Check if we should continue *before* requesting the next frame
    if (isSpinning) {
        animationFrameId = requestAnimationFrame(animateRotation); // Continue loop
    } else {
        animationFrameId = null; // Ensure ID is cleared when stopped
        console.log("Rotation logic loop stopped."); // DEBUG
    }
}

// --- Remaining Helper Functions (Unchanged except for removed video functions) ---
function startMessageRotation() {
    fetch('messages.json').then(response => response.json()).then(messages => { messagesArray = messages; if (messagesArray.length > 0) { displayNextMessage(); setInterval(displayNextMessage, 3000); } else if (statusReportDiv) { statusReportDiv.textContent = "No status messages loaded."; statusReportDiv.style.color = "yellow"; } }).catch(error => { console.error("Error fetching messages:", error); if (statusReportDiv) { statusReportDiv.textContent = "Failed to load status messages."; statusReportDiv.style.color = "red"; } });
}
function displayNextMessage() {
    if (messagesArray.length === 0 || !statusReportDiv) return; const randomIndex = Math.floor(Math.random() * messagesArray.length); const messageObject = messagesArray[randomIndex]; statusReportDiv.textContent = messageObject.message; statusReportDiv.style.color = messageObject.color;
}
function loadZoneDescriptions() {
    fetch('zone-info.json')
        .then(response => {
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            return response.json();
         })
        .then(data => {
            zoneDescriptions = {}; // Clear previous
            zoneHighlightColors = {}; // Clear previous
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    zoneDescriptions[key] = { // Store description and text color
                        description: data[key].description,
                        color: data[key].color
                    };
                    // Ensure highlightColor exists, default to white if missing or invalid
                    let hlColor = data[key].highlightColor;
                    if (!hlColor || typeof hlColor !== 'string' || !hlColor.startsWith('#')) {
                        console.warn(`Invalid or missing highlightColor for ${key}, defaulting to #ffffff`);
                        hlColor = '#ffffff';
                    }
                    zoneHighlightColors[key] = hlColor;
                }
            }
            console.log("Zone Descriptions Loaded:", zoneDescriptions); // DEBUG
            console.log("Zone Highlight Colors Loaded:", zoneHighlightColors); // DEBUG
            displayZoneInfo("", "Click on a zone or legend item for details."); // Set initial message
        })
        .catch(error => {
            console.error("Error fetching or parsing zone descriptions:", error);
             if (zoneDescriptionDiv) {
                zoneDescriptionDiv.textContent = "Failed to load zone information.";
                zoneDescriptionDiv.style.color = "red";
             }
        });
}

// REMOVED: function loadYouTubeVideo(videoId) { ... }
// REMOVED: function loadVideoPlaylist() { ... }

function debounce(func, wait) {
    let timeout; return function(...args) { const context = this; clearTimeout(timeout); timeout = setTimeout(() => func.apply(context, args), wait); };
}
function updateBarPositions() {
    const currentLegendItems = document.querySelectorAll('.legend-item'); if (!currentLegendItems || currentLegendItems.length === 0) return; const gapPixels = 10; currentLegendItems.forEach(item => { const textWrapper = item.querySelector('span'); const colorBar = item.querySelector('.color-bar'); if (textWrapper && colorBar) { const textWidth = textWrapper.getBoundingClientRect().width; const leftPosition = textWidth + gapPixels; colorBar.style.left = `${leftPosition}px`; } });
}

// --- Function to Attach Event Listeners (Only run once) ---
let listenersAttached = false; // Flag for listeners
function attachEventListeners() {
    if (listenersAttached) return; // Prevent attaching multiple times
    listenersAttached = true;

    console.log("Attaching event listeners..."); // DEBUG

    // *** MODIFIED Legend Listener (Unchanged) ***
    if (legendItems) {
        legendItems.forEach(item => {
            item.addEventListener('click', () => {
                clearHighlights(); // Clears legend and calls unhighlightAllSectors()
                const sectorName = item.dataset.sector;
                item.classList.add('highlighted-legend'); // Highlight legend text background
                displayZoneInfo(sectorName); // Update info panel

                // Highlight 3D Sector
                if (threeJsInitialized && zoneHighlightColors[sectorName]) {
                    console.log(`Highlighting 3D sector: ${sectorName} with color ${zoneHighlightColors[sectorName]}`); // DEBUG
                    highlightSector(sectorName, zoneHighlightColors[sectorName]); // Call imported function
                } else {
                    console.warn(`Could not highlight 3D sector: ${sectorName}. Initialized: ${threeJsInitialized}, Color found: ${!!zoneHighlightColors[sectorName]}`);
                }
            });
        });
    }

    // === UPDATED: Toggle Button Listener for Background Effect (Unchanged) ===
    if (matrixRainToggleButton) {
        matrixRainToggleButton.addEventListener('click', () => {
            backgroundEffectEnabled = !backgroundEffectEnabled; // Toggle the state
            if (backgroundEffectEnabled) {
                startBackgroundEffect(); // Start the new effect
                matrixRainToggleButton.textContent = 'EFFECTS: ON';
            } else {
                stopBackgroundEffect(); // Stop the new effect
                matrixRainToggleButton.textContent = 'EFFECTS: OFF';
            }
        });
    }

    // *** Spin Toggle Listener (Unchanged) ***
    if (spinToggleButton) {
        spinToggleButton.addEventListener('click', () => {
            isSpinning = !isSpinning; // Toggle the state flag
            if (isSpinning) {
                spinToggleButton.textContent = 'SPIN: ON';
                if (!animationFrameId) { console.log("Starting rotation logic loop..."); animateRotation(); }
            } else {
                spinToggleButton.textContent = 'SPIN: OFF';
                console.log("Spin toggled OFF. Logic loop will stop on next frame check.");
            }
        });
    }

    // *** REMOVED Next Video Button Listener ***
    // if (nextVideoButton) { ... }

    // *** ADDED Toggle Custom Animations Button Listener ***
    if (toggleCustomAnimationsButton && splitAnimationWrapper) {
        toggleCustomAnimationsButton.addEventListener('click', () => {
            customAnimationsEnabled = !customAnimationsEnabled; // Toggle the state

            // Update visibility of the animation wrapper
            splitAnimationWrapper.style.display = customAnimationsEnabled ? 'flex' : 'none';

            // Update button text
            toggleCustomAnimationsButton.textContent = customAnimationsEnabled ? 'ANIMATIONS: ON' : 'ANIMATIONS: OFF';

            console.log(`Custom animations toggled: ${customAnimationsEnabled ? 'ON' : 'OFF'}`);
        });
    } else {
            console.warn("Could not attach listener: Toggle button or animation wrapper not found.");
    }
    // ============================================


    // *** Scan Button Listener (Unchanged) ***
    if (scanButton) {
        scanButton.addEventListener('click', () => {
            clearHighlights(); // Clear previous highlights first
            if (Object.keys(zoneDescriptions).length === 0) { console.warn("Scan attempted before zone descriptions loaded."); return; }

            const sectorNames = Object.keys(zoneDescriptions);
            let delay = 0; const highlightDuration = 1000; const interval = 1000;

            const actualSectorNames = sectorNames.filter(name => zoneHighlightColors[name]); // Ensure it's a sector we can highlight

            actualSectorNames.forEach(sectorName => {
                const colorToUse = zoneHighlightColors[sectorName];
                setTimeout(() => {
                    console.log(`Scanning: Highlighting ${sectorName} with ${colorToUse}`);
                    if (threeJsInitialized) {
                        highlightSector(sectorName, colorToUse); // HIGHLIGHT ON
                    }
                    setTimeout(() => {
                        console.log(`Scanning: Unhighlighting ${sectorName}`);
                         if (threeJsInitialized) {
                            unhighlightSector(sectorName); // HIGHLIGHT OFF
                         }
                    }, highlightDuration);
                }, delay);
                delay += interval; // Increment delay for the *next* sector's highlight start
            });
        });
    }

    // === UPDATED: Resize Listener (Unchanged) ===
    window.addEventListener('resize', debounce(() => {
        resizeBackgroundEffect(); // Call the resize function from the background module
        updateBarPositions();
    }, 250));

} // END of attachEventListeners