// script.js (Final Version - Cylinder Arms with Correct Default Material + Shine Effect Logic)

import {
    initBackgroundEffect,
    startBackgroundEffect,
    stopBackgroundEffect,
    resizeBackgroundEffect
} from './bogdan-background.js';
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
                 cb.style.left = '0';
            }
        }
    });
}

// Function to fetch and create/insert the main background art element
function setupBackgroundArt() {
    fetch('mars.txt')
        .then(response => response.ok ? response.text() : Promise.reject(`Failed mars.txt: ${response.statusText}`))
        .then(asciiArt => {
            let artElement = document.getElementById('background-mars-art');
            if (!artElement) {
                artElement = document.createElement('pre');
                artElement.id = 'background-mars-art';
                const body = document.body;
                const navbar = document.querySelector('.navbar');
                if (navbar) {
                    body.insertBefore(artElement, navbar);
                } else {
                     const firstScript = document.querySelector('script');
                     if (firstScript) {
                         body.insertBefore(artElement, firstScript);
                     } else {
                         body.appendChild(artElement);
                     }
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
    console.log("DOM Content Loaded. Initializing Bogdan (Cylinder Arms, Correct Colors)..."); // Updated log

    // --- Run background art setup early ---
    setupBackgroundArt();

    // === Three.js Variables ===
    let scene, camera, renderer, station, clock;
    const originalMaterials = new Map(); // Stores original materials during highlight
    let currentlyHighlightedZone = null;
    const mainSpinSpeedZ = 0.003;
    const driftTiltSpeedX = 0.3;
    const maxDriftTiltAngleX = Math.PI / 24;
    let threeJsAnimationFrameId = null;
    // === End Three.js Variables ===

    // === Materials ===
    // Base material (green wireframe) - used for rings, core, and ARMS by default
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x008800, wireframe: true, transparent: true, opacity: 0.85 });

    // Highlight materials - applied temporarily when a zone is selected/scanned
    const highlightMaterials = {
        'yadro-central': new THREE.MeshBasicMaterial({ color: 0xaaaaaa, wireframe: true, depthTest: false }),
        'free-port': new THREE.MeshBasicMaterial({ color: 0x33ff33, wireframe: true, depthTest: false }),
        'critical-infrastructure-alpha-bravo': new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, depthTest: false }),
        'warrens': new THREE.MeshBasicMaterial({ color: 0x00c3fe, wireframe: true, depthTest: false }), // Blue for Warrens highlight
        'operational-security': new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, depthTest: false }),
        'authorized-personnel': new THREE.MeshBasicMaterial({ color: 0xaa00aa, wireframe: true, depthTest: false }),
        'restricted-access': new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, depthTest: false }),
    };
    // === End Materials ===

    // --- Page Element Variables ---
    const legendItems = document.querySelectorAll('.legend-item');
    const zoneDescriptionDiv = document.getElementById('zone-description');
    const videoPlayerContainer = document.getElementById('video-player-container');
    const nextVideoButton = document.getElementById('nextVideoButton');
    const backgroundToggleButton = document.getElementById('matrixRainToggle');
    const spinToggleButton = document.getElementById('spinToggle');
    const statusReportDiv = document.getElementById('status-report');
    const scanButton = document.getElementById('scanButton');
    let messagesArray = [];
    let zoneDescriptions = {};
    let videoPlaylist = [];
    let currentVideoIndex = 0;
    let backgroundEffectEnabled = true;
    let isSpinning = true;
    // --- End Page Element Variables ---

    // === Scan Cycle Variables ===
    let scanIntervalId = null;
    let scanCurrentIndex = 0;
    let isScanning = false;
    const scanStepInterval = 600;
    const scanOrder = [ 'yadro-central', 'critical-infrastructure-alpha-bravo', 'free-port', 'warrens', 'authorized-personnel', 'operational-security', 'restricted-access' ];
    const scanOriginalMaterials = new Map();
    // === End Scan Cycle Variables ===

    // === Core Three.js Functions ===

    // <<< --- START OF REPLACEMENT: Corrected createStation13 Function --- >>>
    function createStation13() {
        const group = new THREE.Group(); // Use THREE namespace
        group.name = "Station Model Group";

        // Station Dimensions (remain the same)
        const outerRingRadius = 0.5;
        const outerRingTubeRadius = 0.05;
        const innerCoreRadius = 0.15;
        const innerCoreTubeRadius = 0.025;
        const torusSegments = 16;
        const ringSegmentsPerQuadrant = 12;

        // Final Arm Parameters (Hardcoded from user choice)
        const finalArmRadius = 0.019;
        const clearance = -0.003;
        const positionOffset = -0.014;

        // Calculate Arm Length based on clearance
        const idealMaxLength = (outerRingRadius - outerRingTubeRadius) - (innerCoreRadius + innerCoreTubeRadius);
        const finalArmLength = Math.max(0.01, idealMaxLength - (2 * clearance));

        // Calculate Arm Position based on offset
        const finalArmPositionRadius = ((outerRingRadius + innerCoreRadius) / 2) + positionOffset;

        console.log(`Cylinder Station Arm Params: R=${finalArmRadius.toFixed(3)}, L=${finalArmLength.toFixed(3)}, PosR=${finalArmPositionRadius.toFixed(3)}`);

        // --- Outer Ring Segments ---
        // Uses baseMaterial by default, highlighting logic applies highlightMaterials
        const ringZoneSegments = [
            { zone: 'critical-infrastructure-alpha-bravo', start: 0, length: Math.PI / 2 },
            { zone: 'free-port', start: Math.PI / 2, length: Math.PI / 2 },
            { zone: 'critical-infrastructure-alpha-bravo', start: Math.PI, length: Math.PI / 2 },
            { zone: 'authorized-personnel', start: 3 * Math.PI / 2, length: Math.PI / 6 },
            { zone: 'operational-security', start: 5 * Math.PI / 3, length: Math.PI / 6 },
            { zone: 'restricted-access', start: 11 * Math.PI / 6, length: Math.PI / 6 },
        ];
        ringZoneSegments.forEach((segment, index) => {
            const arcSegments = Math.max(3, Math.ceil(ringSegmentsPerQuadrant * (segment.length / (Math.PI / 2))));
            const ringGeometry = new THREE.TorusGeometry( outerRingRadius, outerRingTubeRadius, torusSegments, arcSegments, segment.length );
            ringGeometry.rotateZ(segment.start);
            const ringMesh = new THREE.Mesh(ringGeometry, baseMaterial.clone()); // Use baseMaterial
            ringMesh.userData.zone = segment.zone; // Assign zone data
            ringMesh.name = `Outer Ring Segment ${index} (${segment.zone})`;
            group.add(ringMesh);
        });

        // --- Arms ---
        // Uses baseMaterial by default, highlighting logic applies highlightMaterials['warrens']
        const armZoneMapping = [ null, null, 'warrens', null, null, null, null ];
        // Create geometry once for efficiency
        const armGeometry = new THREE.CylinderGeometry(finalArmRadius, finalArmRadius, finalArmLength, 12);
        armGeometry.rotateZ(Math.PI / 2); // Align length along X-axis once

        for (let i = 0; i < 7; i++) {
            // *** THE KEY FIX: Use baseMaterial for the arms by default ***
            const armMesh = new THREE.Mesh(armGeometry, baseMaterial.clone());
            // *** ------------------------------------------------------ ***

            const angle = (i / 7) * (Math.PI * 2);
            // Position using the calculated final radius
            armMesh.position.set(
                Math.cos(angle) * finalArmPositionRadius,
                Math.sin(angle) * finalArmPositionRadius,
                0
            );
            armMesh.rotation.z = angle;
            armMesh.renderOrder = 1;
            const zoneName = armZoneMapping[i];
            armMesh.userData.zone = zoneName || null; // Assign zone data (crucial for highlighting)
            armMesh.name = `Arm ${i} (Cylinder - ${zoneName || 'unassigned'})`;
            group.add(armMesh);
        }

        // --- Central Core Components ---
        // Use baseMaterial by default, highlighting logic applies highlightMaterials['yadro-central']
        const core = new THREE.Mesh(new THREE.TorusGeometry(innerCoreRadius, innerCoreTubeRadius, 16, 48), baseMaterial.clone());
        core.userData.zone = 'yadro-central';
        core.name = "Central Core Ring";
        group.add(core);

        const hubPlate = new THREE.Mesh(new THREE.CircleGeometry(innerCoreRadius * 0.9, 48), baseMaterial.clone());
        hubPlate.userData.zone = 'yadro-central';
        hubPlate.name = "Central Hub Plate";
        hubPlate.position.z = -0.01;
        group.add(hubPlate);

        const ringPlatform = new THREE.Mesh(new THREE.RingGeometry(0.05, innerCoreRadius * 0.95, 48), baseMaterial.clone());
        ringPlatform.userData.zone = 'yadro-central';
        ringPlatform.name = "Central Ring Platform";
        ringPlatform.position.z = 0.01;
        group.add(ringPlatform);

        // Apply final scaling (same as original)
        group.scale.set(125, 125, 125);

        return group; // Return the final station model
    }
    // <<< --- END OF REPLACEMENT: Corrected createStation13 Function --- >>>


    // --- initThreeJSScene, onThreeJSWindowResize, start/stop/animateStation (Unchanged from original) ---
    function initThreeJSScene() { clock = new THREE.Clock(); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(60, 1, 1, 1000); camera.position.set(0, 0, 140); camera.lookAt(0, 0, 0); const cE = document.getElementById('stationCanvas'); const mC = document.querySelector('.map-container'); if (!cE || !mC) { console.error("3JS Init Err: Canvas or Map Container not found."); return; } renderer = new THREE.WebGLRenderer({ antialias: true, canvas: cE, alpha: true }); renderer.setPixelRatio(window.devicePixelRatio); const cR = mC.getBoundingClientRect(); renderer.setSize(cR.width, cR.height); camera.aspect = cR.width / cR.height; camera.updateProjectionMatrix(); const aL = new THREE.AmbientLight(0xcccccc, 0.8); scene.add(aL); const dL = new THREE.DirectionalLight(0xffffff, 0.6); dL.position.set(0, 5, 10); scene.add(dL); station = createStation13(); scene.add(station); startAnimationLoop(); }
    function onThreeJSWindowResize() { const mC = document.querySelector('.map-container'); if (camera && renderer && mC) { const cR = mC.getBoundingClientRect(); if (cR.width > 0 && cR.height > 0) { camera.aspect = cR.width / cR.height; camera.updateProjectionMatrix(); renderer.setSize(cR.width, cR.height); } } }
    function startAnimationLoop() { if (threeJsAnimationFrameId === null) { animateStation(); } }
    function stopAnimationLoop() { if (threeJsAnimationFrameId !== null) { cancelAnimationFrame(threeJsAnimationFrameId); threeJsAnimationFrameId = null; } }
    function animateStation() { threeJsAnimationFrameId = requestAnimationFrame(animateStation); const elapsedTime = clock ? clock.getElapsedTime() : 0; if (station && isSpinning) { station.rotation.z += mainSpinSpeedZ; station.rotation.x = Math.sin(elapsedTime * driftTiltSpeedX) * maxDriftTiltAngleX; } if (renderer && scene && camera) { renderer.render(scene, camera); } }
    // === End Three.js Functions ===

    // --- Highlighting Logic (Unchanged from original) ---
    // This logic correctly handles applying highlightMaterials and restoring originalMaterials (which will now be baseMaterial for arms)
    function clearScanHighlight() { scanOriginalMaterials.forEach((m, u) => { const o = scene?.getObjectByProperty('uuid', u); if (o && o.isMesh) { o.material = m; o.renderOrder = m.renderOrder || 0; } }); scanOriginalMaterials.clear(); }
    function highlightScanStep(zoneName) { clearScanHighlight(); if (!zoneName || !highlightMaterials[zoneName] || !station) return; station.traverse((o) => { if (o.isMesh && o.userData.zone === zoneName) { if (!originalMaterials.has(o.uuid)) { if (!scanOriginalMaterials.has(o.uuid)) scanOriginalMaterials.set(o.uuid, o.material); if (highlightMaterials[zoneName]) { o.material = highlightMaterials[zoneName]; o.renderOrder = 3; } } } }); }
    function clearAllHighlights() { stopScanCycle(); originalMaterials.forEach((originalMaterial, uuid) => { const object = scene?.getObjectByProperty('uuid', uuid); if (object && object.isMesh) { object.material = originalMaterial; object.renderOrder = originalMaterial.renderOrder || 0; } }); originalMaterials.clear(); if (legendItems) legendItems.forEach(i => i.classList.remove('highlighted-legend')); currentlyHighlightedZone = null; }
    function highlightZone(zoneName) { stopScanCycle(); clearAllHighlights(); if (!zoneName || !highlightMaterials[zoneName] || !station) return; currentlyHighlightedZone = zoneName; const li = document.querySelector(`.legend-item[data-sector="${zoneName}"]`); if (li) li.classList.add('highlighted-legend'); const targetMaterial = highlightMaterials[zoneName]; station.traverse((o) => { if (o.isMesh && o.userData.zone === zoneName) { if (!originalMaterials.has(o.uuid)) originalMaterials.set(o.uuid, o.material); if (targetMaterial) { o.material = targetMaterial; o.renderOrder = 2; } else { console.error(`Missing highlight material: ${zoneName}`); } } }); }
    // === End Highlighting Logic ===

    // --- Scan Cycle Functions (Unchanged from original) ---
    function stopScanCycle() { if (scanIntervalId !== null) { clearInterval(scanIntervalId); scanIntervalId = null; isScanning = false; clearScanHighlight(); if (scanButton) { scanButton.disabled = false; scanButton.textContent = "SCAN"; } if (currentlyHighlightedZone) { const li = document.querySelector(`.legend-item[data-sector="${currentlyHighlightedZone}"]`); if (li) li.classList.add('highlighted-legend'); if(station) { station.traverse((o) => { if (o.isMesh && o.userData.zone === currentlyHighlightedZone) { if (highlightMaterials[currentlyHighlightedZone]) { o.material = highlightMaterials[currentlyHighlightedZone]; o.renderOrder = 2; } } }); } } } }
    function performScanCycle() { if (isScanning) return; isScanning = true; if (scanButton) { scanButton.disabled = true; scanButton.textContent = "SCANNING..."; } clearAllHighlights(); scanCurrentIndex = 0; scanIntervalId = setInterval(() => { if (scanCurrentIndex >= scanOrder.length) { stopScanCycle(); return; } highlightScanStep(scanOrder[scanCurrentIndex]); scanCurrentIndex++; }, scanStepInterval); }
    // === End Scan Cycle Functions ===

    // --- Other Helper Functions (Unchanged from original) ---
    const clearHighlights = () => { clearAllHighlights(); };
    const displayZoneInfo = (sectorName) => { const d = zoneDescriptionDiv; if (!d) return; if (zoneDescriptions && zoneDescriptions[sectorName]) { d.textContent = zoneDescriptions[sectorName].description; d.style.color = zoneDescriptions[sectorName].color; } else { d.textContent = "Click zone for info."; d.style.color = "#99ff99"; } };
    function startMessageRotation() { fetch('messages.json') .then(r => r.ok ? r.json() : Promise.reject(`Failed messages.json: ${r.statusText}`)) .then(m => { if (m && m.length > 0) { messagesArray = m; displayNextMessage(); setInterval(displayNextMessage, 3000); } else { if (statusReportDiv) { statusReportDiv.textContent = "Error loading msgs."; statusReportDiv.style.color = "yellow"; } } }) .catch(e => { console.error("Err msgs:", e); if (statusReportDiv) { statusReportDiv.textContent = "Failed msgs."; statusReportDiv.style.color = "red"; } }); }
    function displayNextMessage() { if (messagesArray.length === 0 || !statusReportDiv) return; const i = Math.floor(Math.random() * messagesArray.length); const o = messagesArray[i]; statusReportDiv.textContent = o.message; statusReportDiv.style.color = o.color; }
    function loadZoneDescriptions() { fetch('zone-info.json') .then(r => r.ok ? r.json() : Promise.reject(`Failed zone-info.json: ${r.statusText}`)) .then(d => { zoneDescriptions = d; displayZoneInfo(null); }) .catch(e => { console.error("Err zone-info:", e); if (zoneDescriptionDiv) { zoneDescriptionDiv.textContent = "Failed zone info."; zoneDescriptionDiv.style.color = "red"; } }); }
    function loadYouTubeVideo(vId) { if (!videoPlayerContainer) return; videoPlayerContainer.innerHTML = ''; const ifr = document.createElement('iframe'); ifr.width = '100%'; ifr.height = '100%'; ifr.style.position = 'absolute'; ifr.style.top = '0'; ifr.style.left = '0'; ifr.src = `https://www.youtube.com/embed/${vId}?autoplay=0&controls=1&loop=0&playlist=${videoPlaylist.join(',')}&showinfo=0`; ifr.frameBorder = '0'; ifr.allowFullscreen = true; videoPlayerContainer.appendChild(ifr); }
    function loadVideoPlaylist() { fetch('videos.json') .then(r => r.ok ? r.json() : Promise.reject(`Failed videos.json: ${r.statusText}`)) .then(vids => { videoPlaylist = vids; if (vids.length > 0) { currentVideoIndex = Math.floor(Math.random() * vids.length); loadYouTubeVideo(vids[currentVideoIndex]); } else { if (videoPlayerContainer) { videoPlayerContainer.textContent = "No videos."; videoPlayerContainer.style.color = "yellow"; } } }) .catch(e => { console.error("Err videos:", e); if (videoPlayerContainer) { videoPlayerContainer.textContent = "Failed videos."; videoPlayerContainer.style.color = "red"; } }); }
    // === END Other Helpers ===


    // --- Initialize Sequence (Unchanged from original) ---
    fetch('bogdan_ascii.txt')
        .then(response => response.ok ? response.text() : Promise.reject(`Failed bogdan_ascii: ${response.statusText}`))
        .then(art => { const e = document.getElementById('ascii-art-bottom-left'); if (e) e.textContent = art; })
        .catch(e => console.error(`Error fetching bogdan_ascii.txt:`, e));

    try {
        initBackgroundEffect('backgroundCanvas');
        if (backgroundEffectEnabled) { startBackgroundEffect(); if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: ON'; }
        else { if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: OFF'; }
    } catch (err) { console.error("ERROR initializing Bogdan background effect:", err); if (backgroundToggleButton) backgroundToggleButton.textContent = 'EFFECTS: ERR'; }

    startMessageRotation();
    loadZoneDescriptions();
    loadVideoPlaylist();
    initThreeJSScene(); // Calls the corrected createStation13

    if (document.fonts) { document.fonts.ready.then(() => { console.log("Fonts loaded, running updateBarPositions."); updateBarPositions(); setTimeout(updateBarPositions, 100); }).catch(err => { console.error('Font loading error:', err); setTimeout(updateBarPositions, 500); }); }
    else { console.warn("Font Loading API not supported, using timeout."); setTimeout(updateBarPositions, 500); }
    setTimeout(updateBarPositions, 1500);

    // --- Attach Event Listeners (Unchanged from original) ---
    if (legendItems && legendItems.length > 0) { legendItems.forEach(item => { item.addEventListener('click', () => { const sN = item.dataset.sector; if (sN === currentlyHighlightedZone && sN !== null) { clearAllHighlights(); displayZoneInfo(null); } else { highlightZone(sN); displayZoneInfo(sN); } }); }); }
    else { console.error("Legend items not found."); }
    if (backgroundToggleButton) { backgroundToggleButton.addEventListener('click', () => { backgroundEffectEnabled = !backgroundEffectEnabled; if (backgroundEffectEnabled) { startBackgroundEffect(); backgroundToggleButton.textContent = 'EFFECTS: ON'; } else { stopBackgroundEffect(); backgroundToggleButton.textContent = 'EFFECTS: OFF'; } }); }
    else { console.error("#matrixRainToggle not found."); }
    if (spinToggleButton) { spinToggleButton.addEventListener('click', () => { isSpinning = !isSpinning; spinToggleButton.textContent = isSpinning ? 'SPIN: ON' : 'SPIN: OFF'; if (isSpinning && threeJsAnimationFrameId === null) { startAnimationLoop(); } }); }
    else { console.error("#spinToggle not found."); }
    if (nextVideoButton) { nextVideoButton.addEventListener('click', () => { if (videoPlaylist.length > 0) { currentVideoIndex = (currentVideoIndex + 1) % videoPlaylist.length; loadYouTubeVideo(videoPlaylist[currentVideoIndex]); } }); }
    else { console.error("#nextVideoButton not found."); }
    if (scanButton) { scanButton.addEventListener('click', performScanCycle); }
    else { console.error("#scanButton not found."); }
    window.addEventListener('resize', debounce(() => { onThreeJSWindowResize(); resizeBackgroundEffect(); updateBarPositions(); }, 250));
    // --- End Initialize ---

    // --- START: Sequential Shine Sweep Logic (Moved Here) ---

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


}); // End DOMContentLoaded