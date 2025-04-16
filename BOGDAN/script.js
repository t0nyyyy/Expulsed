// BOGDAN/script.js (Final Version - Incorporating C & D Animations)

import {
    initBackgroundEffect,
    startBackgroundEffect,
    stopBackgroundEffect,
    resizeBackgroundEffect
} from './bogdan-background.js'; // Assuming this handles the Bogdan-specific background

// Assumes THREE is global from HTML script tag

// === Helper Functions (Defined OUTSIDE DOMContentLoaded) ===

function debounce(func, wait) {
    let t; return function(...a) { const c = this; clearTimeout(t); t = setTimeout(() => func.apply(c, a), wait); };
}

// Restore original bar update logic
function updateBarPositions() {
    const currentLegendItems = document.querySelectorAll('.legend-item');
    if (!currentLegendItems || currentLegendItems.length === 0) {
        return;
    }
    const gp = 10; // Default gap
    currentLegendItems.forEach(i => {
        const tw = i.querySelector('.legend-text-wrapper'); // Target WRAPPER
        const cb = i.querySelector('.color-bar');
        if (tw && cb) {
            const w = tw.getBoundingClientRect().width; // Measure WRAPPER width
            if (w > 0) {
                let cg = gp;
                const go = i.dataset.gapOverride; // Check for override
                if (go) { cg = parseInt(go, 10); }
                const lp = w + cg; // Calculate left offset
                cb.style.left = `${lp}px`; // Set left style (CSS handles right edge)
            } else {
                 cb.style.left = '0'; // Fallback if width is 0
            }
        }
    });
}

// Function to fetch and create/insert the main background art element
function setupBackgroundArt() {
    fetch('mars.txt') // Assuming bogdan uses mars.txt
        .then(response => response.ok ? response.text() : Promise.reject(`Failed mars.txt: ${response.statusText}`))
        .then(asciiArt => {
            let artElement = document.getElementById('background-mars-art');
            if (!artElement) {
                artElement = document.createElement('pre');
                artElement.id = 'background-mars-art';
                const body = document.body;
                // Try inserting before navbar or first script as fallback
                const navbar = document.querySelector('.navbar');
                const firstScript = document.querySelector('script');
                if (navbar) {
                    body.insertBefore(artElement, navbar);
                } else if (firstScript) {
                     body.insertBefore(artElement, firstScript);
                } else {
                     body.appendChild(artElement); // Absolute fallback
                }
                console.log("Created and inserted #background-mars-art element.");
            } else {
                 console.log("#background-mars-art element already exists.");
            }
            artElement.textContent = asciiArt;
        })
        .catch(error => {
            console.error("Error setting up background art:", error);
        });
}


// === Main Initialization Logic ===
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing Bogdan (with Charlie/Delta Animations)..."); // Updated log

    // --- Run background art setup early ---
    setupBackgroundArt(); // Keep using Mars art for now

    // === Three.js Variables (Unchanged) ===
    let scene, camera, renderer, station, clock;
    const originalMaterials = new Map();
    let currentlyHighlightedZone = null;
    const mainSpinSpeedZ = 0.003;
    const driftTiltSpeedX = 0.3;
    const maxDriftTiltAngleX = Math.PI / 24;
    let threeJsAnimationFrameId = null;
    // === End Three.js Variables ===

    // === Materials (Unchanged) ===
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x008800, wireframe: true, transparent: true, opacity: 0.85 });
    const highlightMaterials = {
        'yadro-central': new THREE.MeshBasicMaterial({ color: 0xaaaaaa, wireframe: true, depthTest: false }),
        'free-port': new THREE.MeshBasicMaterial({ color: 0x33ff33, wireframe: true, depthTest: false }),
        'critical-infrastructure-alpha-bravo': new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, depthTest: false }),
        'warrens': new THREE.MeshBasicMaterial({ color: 0x00c3fe, wireframe: true, depthTest: false }),
        'operational-security': new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, depthTest: false }),
        'authorized-personnel': new THREE.MeshBasicMaterial({ color: 0xaa00aa, wireframe: true, depthTest: false }),
        'restricted-access': new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false }),
    };
    // === End Materials ===

    // --- Page Element Variables ---
    const legendItems = document.querySelectorAll('.legend-item');
    const zoneDescriptionDiv = document.getElementById('zone-description');
    // REMOVED: const videoPlayerContainer = document.getElementById('video-player-container');
    // REMOVED: const nextVideoButton = document.getElementById('nextVideoButton');
    const backgroundToggleButton = document.getElementById('matrixRainToggle'); // Keep original ID for effects button
    const spinToggleButton = document.getElementById('spinToggle');
    const statusReportDiv = document.getElementById('status-report');
    const scanButton = document.getElementById('scanButton');
    // *** ADDED ***
    const toggleBogdanAnimationsButton = document.getElementById('toggleBogdanAnimationsButton');
    const splitAnimationWrapper = document.querySelector('.split-animation-wrapper');
    // *************
    let messagesArray = [];
    let zoneDescriptions = {};
    // REMOVED: let videoPlaylist = [];
    // REMOVED: let currentVideoIndex = 0;
    let backgroundEffectEnabled = true; // For the main background effect
    let customAnimationsEnabled = true; // *** ADDED for C/D animations ***
    let isSpinning = true; // For the 3D station
    // --- End Page Element Variables ---

    // === Scan Cycle Variables (Unchanged) ===
    let scanIntervalId = null;
    let scanCurrentIndex = 0;
    let isScanning = false;
    const scanStepInterval = 600;
    const scanOrder = [ 'yadro-central', 'critical-infrastructure-alpha-bravo', 'free-port', 'warrens', 'authorized-personnel', 'operational-security', 'restricted-access' ];
    const scanOriginalMaterials = new Map();
    // === End Scan Cycle Variables ===

    // === Core Three.js Functions (Unchanged) ===
    // createStation13, initThreeJSScene, onThreeJSWindowResize, startAnimationLoop, stopAnimationLoop, animateStation
    function createStation13() {
        const group = new THREE.Group(); group.name = "Station Model Group";
        const outerRingRadius = 0.5; const outerRingTubeRadius = 0.05;
        const innerCoreRadius = 0.15; const innerCoreTubeRadius = 0.025;
        const torusSegments = 16; const ringSegmentsPerQuadrant = 12;
        const finalArmRadius = 0.019; const clearance = -0.003; const positionOffset = -0.014;
        const idealMaxLength = (outerRingRadius - outerRingTubeRadius) - (innerCoreRadius + innerCoreTubeRadius);
        const finalArmLength = Math.max(0.01, idealMaxLength - (2 * clearance));
        const finalArmPositionRadius = ((outerRingRadius + innerCoreRadius) / 2) + positionOffset;
        console.log(`Cylinder Station Arm Params: R=${finalArmRadius.toFixed(3)}, L=${finalArmLength.toFixed(3)}, PosR=${finalArmPositionRadius.toFixed(3)}`);
        const ringZoneSegments = [ { zone: 'critical-infrastructure-alpha-bravo', start: 0, length: Math.PI / 2 }, { zone: 'free-port', start: Math.PI / 2, length: Math.PI / 2 }, { zone: 'critical-infrastructure-alpha-bravo', start: Math.PI, length: Math.PI / 2 }, { zone: 'authorized-personnel', start: 3 * Math.PI / 2, length: Math.PI / 6 }, { zone: 'operational-security', start: 5 * Math.PI / 3, length: Math.PI / 6 }, { zone: 'restricted-access', start: 11 * Math.PI / 6, length: Math.PI / 6 }, ];
        ringZoneSegments.forEach((segment, index) => { const arcSegments = Math.max(3, Math.ceil(ringSegmentsPerQuadrant * (segment.length / (Math.PI / 2)))); const ringGeometry = new THREE.TorusGeometry( outerRingRadius, outerRingTubeRadius, torusSegments, arcSegments, segment.length ); ringGeometry.rotateZ(segment.start); const ringMesh = new THREE.Mesh(ringGeometry, baseMaterial.clone()); ringMesh.userData.zone = segment.zone; ringMesh.name = `Outer Ring Segment ${index} (${segment.zone})`; group.add(ringMesh); });
        const armZoneMapping = [ null, null, 'warrens', null, null, null, null ];
        const armGeometry = new THREE.CylinderGeometry(finalArmRadius, finalArmRadius, finalArmLength, 12); armGeometry.rotateZ(Math.PI / 2);
        for (let i = 0; i < 7; i++) { const armMesh = new THREE.Mesh(armGeometry, baseMaterial.clone()); const angle = (i / 7) * (Math.PI * 2); armMesh.position.set( Math.cos(angle) * finalArmPositionRadius, Math.sin(angle) * finalArmPositionRadius, 0 ); armMesh.rotation.z = angle; armMesh.renderOrder = 1; const zoneName = armZoneMapping[i]; armMesh.userData.zone = zoneName || null; armMesh.name = `Arm ${i} (Cylinder - ${zoneName || 'unassigned'})`; group.add(armMesh); }
        const core = new THREE.Mesh(new THREE.TorusGeometry(innerCoreRadius, innerCoreTubeRadius, 16, 48), baseMaterial.clone()); core.userData.zone = 'yadro-central'; core.name = "Central Core Ring"; group.add(core);
        const hubPlate = new THREE.Mesh(new THREE.CircleGeometry(innerCoreRadius * 0.9, 48), baseMaterial.clone()); hubPlate.userData.zone = 'yadro-central'; hubPlate.name = "Central Hub Plate"; hubPlate.position.z = -0.01; group.add(hubPlate);
        const ringPlatform = new THREE.Mesh(new THREE.RingGeometry(0.05, innerCoreRadius * 0.95, 48), baseMaterial.clone()); ringPlatform.userData.zone = 'yadro-central'; ringPlatform.name = "Central Ring Platform"; ringPlatform.position.z = 0.01; group.add(ringPlatform);
        group.scale.set(125, 125, 125); return group;
    }
    function initThreeJSScene() { clock = new THREE.Clock(); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(60, 1, 1, 1000); camera.position.set(0, 0, 140); camera.lookAt(0, 0, 0); const cE = document.getElementById('stationCanvas'); const mC = document.querySelector('.map-container'); if (!cE || !mC) { console.error("3JS Init Err: Canvas or Map Container not found."); return; } renderer = new THREE.WebGLRenderer({ antialias: true, canvas: cE, alpha: true }); renderer.setPixelRatio(window.devicePixelRatio); const cR = mC.getBoundingClientRect(); renderer.setSize(cR.width, cR.height); camera.aspect = cR.width / cR.height; camera.updateProjectionMatrix(); const aL = new THREE.AmbientLight(0xcccccc, 0.8); scene.add(aL); const dL = new THREE.DirectionalLight(0xffffff, 0.6); dL.position.set(0, 5, 10); scene.add(dL); station = createStation13(); scene.add(station); startAnimationLoop(); }
    function onThreeJSWindowResize() { const mC = document.querySelector('.map-container'); if (camera && renderer && mC) { const cR = mC.getBoundingClientRect(); if (cR.width > 0 && cR.height > 0) { camera.aspect = cR.width / cR.height; camera.updateProjectionMatrix(); renderer.setSize(cR.width, cR.height); } } }
    function startAnimationLoop() { if (threeJsAnimationFrameId === null) { animateStation(); } }
    function stopAnimationLoop() { if (threeJsAnimationFrameId !== null) { cancelAnimationFrame(threeJsAnimationFrameId); threeJsAnimationFrameId = null; } }
    function animateStation() { threeJsAnimationFrameId = requestAnimationFrame(animateStation); const elapsedTime = clock ? clock.getElapsedTime() : 0; if (station && isSpinning) { station.rotation.z += mainSpinSpeedZ; station.rotation.x = Math.sin(elapsedTime * driftTiltSpeedX) * maxDriftTiltAngleX; } if (renderer && scene && camera) { renderer.render(scene, camera); } }
    // === End Three.js Functions ===

    // --- Highlighting Logic (Unchanged) ---
    function clearScanHighlight() { scanOriginalMaterials.forEach((m, u) => { const o = scene?.getObjectByProperty('uuid', u); if (o && o.isMesh) { o.material = m; o.renderOrder = m.renderOrder || 0; } }); scanOriginalMaterials.clear(); }
    function highlightScanStep(zoneName) { clearScanHighlight(); if (!zoneName || !highlightMaterials[zoneName] || !station) return; station.traverse((o) => { if (o.isMesh && o.userData.zone === zoneName) { if (!originalMaterials.has(o.uuid)) { if (!scanOriginalMaterials.has(o.uuid)) scanOriginalMaterials.set(o.uuid, o.material); if (highlightMaterials[zoneName]) { o.material = highlightMaterials[zoneName]; o.renderOrder = 3; } } } }); }
    function clearAllHighlights() { stopScanCycle(); originalMaterials.forEach((originalMaterial, uuid) => { const object = scene?.getObjectByProperty('uuid', uuid); if (object && object.isMesh) { object.material = originalMaterial; object.renderOrder = originalMaterial.renderOrder || 0; } }); originalMaterials.clear(); if (legendItems) legendItems.forEach(i => i.classList.remove('highlighted-legend')); currentlyHighlightedZone = null; }
    function highlightZone(zoneName) { stopScanCycle(); clearAllHighlights(); if (!zoneName || !highlightMaterials[zoneName] || !station) return; currentlyHighlightedZone = zoneName; const li = document.querySelector(`.legend-item[data-sector="${zoneName}"]`); if (li) li.classList.add('highlighted-legend'); const targetMaterial = highlightMaterials[zoneName]; station.traverse((o) => { if (o.isMesh && o.userData.zone === zoneName) { if (!originalMaterials.has(o.uuid)) originalMaterials.set(o.uuid, o.material); if (targetMaterial) { o.material = targetMaterial; o.renderOrder = 2; } else { console.error(`Missing highlight material: ${zoneName}`); } } }); }
    // === End Highlighting Logic ===

    // --- Scan Cycle Functions (Unchanged) ---
    function stopScanCycle() { if (scanIntervalId !== null) { clearInterval(scanIntervalId); scanIntervalId = null; isScanning = false; clearScanHighlight(); if (scanButton) { scanButton.disabled = false; scanButton.textContent = "SCAN"; } if (currentlyHighlightedZone) { const li = document.querySelector(`.legend-item[data-sector="${currentlyHighlightedZone}"]`); if (li) li.classList.add('highlighted-legend'); if(station) { station.traverse((o) => { if (o.isMesh && o.userData.zone === currentlyHighlightedZone) { if (highlightMaterials[currentlyHighlightedZone]) { o.material = highlightMaterials[currentlyHighlightedZone]; o.renderOrder = 2; } } }); } } } }
    function performScanCycle() { if (isScanning) return; isScanning = true; if (scanButton) { scanButton.disabled = true; scanButton.textContent = "SCANNING..."; } clearAllHighlights(); scanCurrentIndex = 0; scanIntervalId = setInterval(() => { if (scanCurrentIndex >= scanOrder.length) { stopScanCycle(); return; } highlightScanStep(scanOrder[scanCurrentIndex]); scanCurrentIndex++; }, scanStepInterval); }
    // === End Scan Cycle Functions ===

    // --- Other Helper Functions ---
    const clearHighlights = () => { clearAllHighlights(); }; // Keep alias
    const displayZoneInfo = (sectorName) => { const d = zoneDescriptionDiv; if (!d) return; if (zoneDescriptions && zoneDescriptions[sectorName]) { d.textContent = zoneDescriptions[sectorName].description; d.style.color = zoneDescriptions[sectorName].color; } else { d.textContent = "Click zone for info."; d.style.color = "#99ff99"; } };
    function startMessageRotation() { fetch('messages.json').then(r => r.ok ? r.json() : Promise.reject(`Failed messages.json: ${r.statusText}`)).then(m => { if (m && m.length > 0) { messagesArray = m; displayNextMessage(); setInterval(displayNextMessage, 3000); } else { if (statusReportDiv) { statusReportDiv.textContent = "Error loading msgs."; statusReportDiv.style.color = "yellow"; } } }).catch(e => { console.error("Err msgs:", e); if (statusReportDiv) { statusReportDiv.textContent = "Failed msgs."; statusReportDiv.style.color = "red"; } }); }
    function displayNextMessage() { if (messagesArray.length === 0 || !statusReportDiv) return; const i = Math.floor(Math.random() * messagesArray.length); const o = messagesArray[i]; statusReportDiv.textContent = o.message; statusReportDiv.style.color = o.color; }
    function loadZoneDescriptions() { fetch('zone-info.json').then(r => r.ok ? r.json() : Promise.reject(`Failed zone-info.json: ${r.statusText}`)).then(d => { zoneDescriptions = d; displayZoneInfo(null); }).catch(e => { console.error("Err zone-info:", e); if (zoneDescriptionDiv) { zoneDescriptionDiv.textContent = "Failed zone info."; zoneDescriptionDiv.style.color = "red"; } }); }

    // REMOVED: function loadYouTubeVideo(vId) { ... }
    // REMOVED: function loadVideoPlaylist() { ... }

    // === END Other Helpers ===


    // --- Initialize Sequence ---
    fetch('bogdan_ascii.txt') // Keep bogdan ASCII art
        .then(response => response.ok ? response.text() : Promise.reject(`Failed bogdan_ascii: ${response.statusText}`))
        .then(art => { const e = document.getElementById('ascii-art-bottom-left'); if (e) e.textContent = art; })
        .catch(e => console.error(`Error fetching bogdan_ascii.txt:`, e));

    try {
        initBackgroundEffect('backgroundCanvas'); // Init main background
        if (backgroundEffectEnabled) { startBackgroundEffect(); if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: ON'; }
        else { if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: OFF'; }
    } catch (err) { console.error("ERROR initializing Bogdan background effect:", err); if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: ERR'; }

    startMessageRotation();
    loadZoneDescriptions();
    // REMOVED: loadVideoPlaylist();
    initThreeJSScene(); // Calls createStation13 which includes 3D model

    // === Initialize Custom Split Animations (Charlie & Delta) ===
    console.log("Initializing custom split animations (Charlie/Delta)...");
    try {
        // Check if the functions exist before calling
        if (typeof createCharlieDigital === 'function') {
            createCharlieDigital('bogdan-animation-charlie', 1.1); // Use the new ID, keep speed factor
        } else {
            console.error("createCharlieDigital function not found!");
            const charlieContainer = document.getElementById('bogdan-animation-charlie');
            if (charlieContainer) charlieContainer.textContent = "Error: Binary Scroll unavailable.";
        }

        if (typeof createDeltaScanline === 'function') {
             createDeltaScanline('bogdan-animation-delta'); // Use the new ID
        } else {
            console.error("createDeltaScanline function not found!");
            const deltaContainer = document.getElementById('bogdan-animation-delta');
            if (deltaContainer) deltaContainer.textContent = "Error: Code Scan unavailable.";
        }
        console.log("Custom split animations initialized.");

        // Set initial visibility based on state
        if (splitAnimationWrapper) {
             splitAnimationWrapper.style.display = customAnimationsEnabled ? 'flex' : 'none';
        }
        if (toggleBogdanAnimationsButton) {
            toggleBogdanAnimationsButton.textContent = customAnimationsEnabled ? 'ANIMATIONS: ON' : 'ANIMATIONS: OFF';
        }

    } catch (error) {
        console.error("Error initializing custom split animations:", error);
        const charlieContainer = document.getElementById('bogdan-animation-charlie');
        if (charlieContainer) charlieContainer.textContent = "Animation Error";
        const deltaContainer = document.getElementById('bogdan-animation-delta');
        if (deltaContainer) deltaContainer.textContent = "Animation Error";
    }
    // ============================================================


    // Font loading and initial bar position update (Unchanged)
    if (document.fonts) { document.fonts.ready.then(() => { console.log("Fonts loaded, running updateBarPositions."); updateBarPositions(); setTimeout(updateBarPositions, 100); }).catch(err => { console.error('Font loading error:', err); setTimeout(updateBarPositions, 500); }); }
    else { console.warn("Font Loading API not supported, using timeout."); setTimeout(updateBarPositions, 500); }
    setTimeout(updateBarPositions, 1500); // Extra update after potential renders

    // --- Attach Event Listeners ---
    if (legendItems && legendItems.length > 0) { legendItems.forEach(item => { item.addEventListener('click', () => { const sN = item.dataset.sector; if (sN === currentlyHighlightedZone && sN !== null) { clearAllHighlights(); displayZoneInfo(null); } else { highlightZone(sN); displayZoneInfo(sN); } }); }); }
    else { console.error("Legend items not found."); }

    // Background Effect Toggle (Unchanged)
    if (backgroundToggleButton) { backgroundToggleButton.addEventListener('click', () => { backgroundEffectEnabled = !backgroundEffectEnabled; if (backgroundEffectEnabled) { startBackgroundEffect(); backgroundToggleButton.textContent = 'EFFECTS: ON'; } else { stopBackgroundEffect(); backgroundToggleButton.textContent = 'EFFECTS: OFF'; } }); }
    else { console.error("#matrixRainToggle (Effects Button) not found."); }

    // Spin Toggle (Unchanged)
    if (spinToggleButton) { spinToggleButton.addEventListener('click', () => { isSpinning = !isSpinning; spinToggleButton.textContent = isSpinning ? 'SPIN: ON' : 'SPIN: OFF'; if (isSpinning && threeJsAnimationFrameId === null) { startAnimationLoop(); } }); }
    else { console.error("#spinToggle not found."); }

    // REMOVED: Next Video Button Listener
    // if (nextVideoButton) { ... }

    // *** ADDED: Toggle Custom Animations Button Listener ***
    if (toggleBogdanAnimationsButton && splitAnimationWrapper) {
        toggleBogdanAnimationsButton.addEventListener('click', () => {
            customAnimationsEnabled = !customAnimationsEnabled; // Toggle state
            splitAnimationWrapper.style.display = customAnimationsEnabled ? 'flex' : 'none'; // Update visibility
            toggleBogdanAnimationsButton.textContent = customAnimationsEnabled ? 'ANIMATIONS: ON' : 'ANIMATIONS: OFF'; // Update text
            console.log(`Bogdan custom animations toggled: ${customAnimationsEnabled ? 'ON' : 'OFF'}`);
        });
    } else {
         console.warn("Could not attach listener: Bogdan Toggle button or animation wrapper not found.");
    }
    // =====================================================

    // Scan Button Listener (Unchanged)
    if (scanButton) { scanButton.addEventListener('click', performScanCycle); }
    else { console.error("#scanButton not found."); }

    // Resize Listener (Unchanged)
    window.addEventListener('resize', debounce(() => { onThreeJSWindowResize(); resizeBackgroundEffect(); updateBarPositions(); }, 250));
    // --- End Attach Event Listeners ---


    // --- START: Sequential Shine Sweep Logic (Unchanged - Keep this) ---
    const shineTargets = document.querySelectorAll('.your-shine-target');
    const validShineTargets = Array.from(shineTargets).filter(el => el !== null);
    let currentShineIndex = 0;
    const numberOfTargets = validShineTargets.length;
    let shineTimeoutId = null;
    const animationDuration = 2400; // MUST match CSS animation duration

    if (numberOfTargets > 0) {
        console.log(`Sequential Shine Initialized: ${numberOfTargets} targets, duration ${animationDuration}ms.`);
        const triggerNextShine = () => {
            if (validShineTargets[currentShineIndex]) validShineTargets[currentShineIndex].classList.remove('is-shining');
            currentShineIndex = (currentShineIndex + 1) % numberOfTargets;
            if (validShineTargets[currentShineIndex]) validShineTargets[currentShineIndex].classList.add('is-shining');
            shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };
        const startShineSequence = () => {
             clearTimeout(shineTimeoutId);
             validShineTargets.forEach(target => target.classList.remove('is-shining'));
             if (validShineTargets[currentShineIndex]) validShineTargets[currentShineIndex].classList.add('is-shining');
             shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };
        startShineSequence(); // Initial start
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                 clearTimeout(shineTimeoutId);
                 if (validShineTargets[currentShineIndex]) validShineTargets[currentShineIndex].classList.remove('is-shining');
                 console.log('Shine sequence paused (tab hidden)');
            } else {
                 console.log('Shine sequence restarting (tab visible)');
                 startShineSequence();
            }
        });
    } else {
        console.warn("Sequential Shine: Could not find any valid targets with '.your-shine-target'.");
    }
    // --- END: Sequential Shine Sweep Logic ---


}); // End DOMContentLoaded