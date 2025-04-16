const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    alpha: true,
    antialias: true // Enable antialiasing for smoother lines
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0); // Transparent to show CSS background
renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI displays

// Add fog to the scene to fade distant objects
scene.fog = new THREE.FogExp2(0x000000, 0.0004); // Slightly increased fog density

// Set up camera position for a 3D scanning perspective
camera.position.set(0, 100, 2000); // Start further back to see the terrain
camera.lookAt(0, 0, 0);

// Terrain parameters - make width responsive to screen size
const terrainWidth = Math.max(window.innerWidth * 2.5, 2500); // Wider terrain for better coverage
const terrainLength = 6000; // Length along z-axis after rotation
const segmentsX = Math.min(Math.floor(window.innerWidth / 10), 150); // Adaptive detail based on screen width, max 150
const segmentsZ = 300; // Segments along length for detail
const noiseStrength = 50; // Height amplitude for rugged terrain
const xZoom = 150; // Noise scale for x
const zZoom = 150; // Noise scale for z

// Create two terrains for seamless looping
const geometry1 = new THREE.PlaneGeometry(terrainWidth, terrainLength, segmentsX, segmentsZ);
const geometry2 = new THREE.PlaneGeometry(terrainWidth, terrainLength, segmentsX, segmentsZ);

// Rotate terrains to lie flat on the XZ plane
geometry1.rotateX(-Math.PI / 2);
geometry2.rotateX(-Math.PI / 2);

// Add Perlin noise for terrain height
const simplex = new SimplexNoise();

function applyTerrainHeights(geometry) {
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        // Smoother noise by combining multiple octaves
        const noise1 = simplex.noise2D(x / xZoom, z / zZoom);
        const noise2 = simplex.noise2D(x / (xZoom * 0.5), z / (zZoom * 0.5)) * 0.3;
        const y = (noise1 + noise2) * noiseStrength;
        positions[i + 1] = y; // Update y (height)
    }
    geometry.attributes.position.needsUpdate = true;
}

// Apply rugged terrain to both geometries
applyTerrainHeights(geometry1);
applyTerrainHeights(geometry2);

// Use WireframeGeometry for triangular grid
const wireframeGeometry1 = new THREE.WireframeGeometry(geometry1);
const wireframeGeometry2 = new THREE.WireframeGeometry(geometry2);

// Material with matrix green and transparency for fading
// Create a subtle glow effect with a slight pulse
const material1 = new THREE.LineBasicMaterial({
    color: 0x008800, // UPDATED from 0x00cc00
    transparent: true,
    opacity: 0.8,
    fog: true, // Enable fog effect on material
    linewidth: 1 // Note: Most browsers only support linewidth of 1
});
const material2 = new THREE.LineBasicMaterial({
    color: 0x008800, // UPDATED from 0x00cc00
    transparent: true,
    opacity: 0.8,
    fog: true, // Enable fog effect on material
    linewidth: 1
});

// CHANGE: Use 'let' instead of 'const' for wireframe1 and wireframe2
let wireframe1 = new THREE.LineSegments(wireframeGeometry1, material1);
let wireframe2 = new THREE.LineSegments(wireframeGeometry2, material2);

// Position terrains end-to-end along z-axis
wireframe1.position.z = 0; // First terrain: z from -3000 to 3000
wireframe2.position.z = terrainLength; // Second terrain: z from 3000 to 9000

// Add wireframes to scene
scene.add(wireframe1);
scene.add(wireframe2);

// Animation variables
let cameraZ = 2000; // Starting z-position of the camera
const scrollSpeed = 2; // Match reference's scroll speed
const terrainLoopLength = terrainLength; // Distance before resetting (6000 units)
const fadeDistance = 1000; // Distance over which to fade
const visibilityDistance = 2500; // Distance at which terrain becomes visible
let pulseTime = 0; // For subtle pulsing effect

// Performance optimization
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// Animation loop for endless scrolling with performance optimization
function animate(currentTime) {
    requestAnimationFrame(animate);

    // Throttle rendering to target FPS
    const elapsed = currentTime - lastTime;
    if (elapsed < frameInterval) return;

    // Track time for smooth animation regardless of frame rate
    const delta = Math.min(elapsed / frameInterval, 2); // Cap delta at 2 to prevent huge jumps
    lastTime = currentTime - (elapsed % frameInterval);

    // Move camera forward (decrease z) - speed adjusted by delta for frame rate independence
    cameraZ -= scrollSpeed * delta;
    camera.position.z = cameraZ;

    // Reset terrain positions for endless loop
    if (wireframe1.position.z > cameraZ + terrainLength) {
        // If the first terrain is too far behind, move it ahead of the second one
        wireframe1.position.z = wireframe2.position.z - terrainLength;
    }
    if (wireframe2.position.z > cameraZ + terrainLength) {
        // If the second terrain is too far behind, move it ahead of the first one
        wireframe2.position.z = wireframe1.position.z - terrainLength;
    }

    // Subtle pulse effect for the wireframes
    pulseTime += 0.01 * delta;
    const pulse = 0.05 * Math.sin(pulseTime) + 0.95; // Subtle pulse between 0.9 and 1.0

    // Improved opacity management - based on distance from camera
    // For terrain 1
    const distanceFromCamera1 = wireframe1.position.z - cameraZ;
    if (distanceFromCamera1 < -terrainLength) {
        // Behind camera, hide completely
        material1.opacity = 0;
    } else if (distanceFromCamera1 < 0) {
        // Behind camera but still visible, fade out gradually
        material1.opacity = Math.max(0, 0.8 * (1 + distanceFromCamera1 / terrainLength) * pulse);
    } else if (distanceFromCamera1 > visibilityDistance) {
        // Too far ahead, gradually fade in as it approaches
        material1.opacity = Math.min(0.8, 0.8 * (1 - (distanceFromCamera1 - visibilityDistance) / 1000) * pulse);
    } else {
        // In optimal viewing range
        material1.opacity = 0.8 * pulse;
    }

    // For terrain 2
    const distanceFromCamera2 = wireframe2.position.z - cameraZ;
    if (distanceFromCamera2 < -terrainLength) {
        material2.opacity = 0;
    } else if (distanceFromCamera2 < 0) {
        material2.opacity = Math.max(0, 0.8 * (1 + distanceFromCamera2 / terrainLength) * pulse);
    } else if (distanceFromCamera2 > visibilityDistance) {
        material2.opacity = Math.min(0.8, 0.8 * (1 - (distanceFromCamera2 - visibilityDistance) / 1000) * pulse);
    } else {
        material2.opacity = 0.8 * pulse;
    }

    renderer.render(scene, camera);
}
animate(0);

// Optimize resize handler with debounce
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Update camera aspect ratio
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        // Update renderer size and pixel ratio
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Store current terrain positions
        const terrain1Z = wireframe1.position.z;
        const terrain2Z = wireframe2.position.z;

        // Update terrain width based on new screen size
        const newWidth = Math.max(window.innerWidth * 2.5, 2500);
        const newSegmentsX = Math.min(Math.floor(window.innerWidth / 10), 150);

        // Remove old wireframes from scene to prevent memory leaks
        scene.remove(wireframe1);
        scene.remove(wireframe2);

        // Create new geometries with updated width
        const newGeometry1 = new THREE.PlaneGeometry(newWidth, terrainLength, newSegmentsX, segmentsZ);
        const newGeometry2 = new THREE.PlaneGeometry(newWidth, terrainLength, newSegmentsX, segmentsZ);

        // Rotate new geometries
        newGeometry1.rotateX(-Math.PI / 2);
        newGeometry2.rotateX(-Math.PI / 2);

        // Clean up old geometries
        geometry1.dispose();
        geometry2.dispose();
        wireframeGeometry1.dispose();
        wireframeGeometry2.dispose();

        // Apply heights to new geometries
        applyTerrainHeights(newGeometry1);
        applyTerrainHeights(newGeometry2);

        // ADDED:  Need to update the position attribute after modifying the geometry
        newGeometry1.attributes.position.needsUpdate = true;
        newGeometry2.attributes.position.needsUpdate = true;


        // Create new wireframe geometries
        const newWireframeGeometry1 = new THREE.WireframeGeometry(newGeometry1);
        const newWireframeGeometry2 = new THREE.WireframeGeometry(newGeometry2);

        // Update wireframes with new geometries
        wireframe1 = new THREE.LineSegments(newWireframeGeometry1, material1);
        wireframe2 = new THREE.LineSegments(newWireframeGeometry2, material2);

        // Restore terrain positions
        wireframe1.position.z = terrain1Z;
        wireframe2.position.z = terrain2Z;

        // Add updated wireframes back to scene
        scene.add(wireframe1);
        scene.add(wireframe2);
    }, 250); // 250ms debounce
});

// Handle page visibility changes to pause animation when tab is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, mark the time
        lastTime = 0; // Reset timing to prevent jumps when returning
    }
});
