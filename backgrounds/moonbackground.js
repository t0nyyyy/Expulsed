document.addEventListener('DOMContentLoaded', () => {
    // SVG filters
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.innerHTML = `
        <defs>
            <filter id="jagged" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="terrain-wave" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="50" xChannelSelector="R" yChannelSelector="G" />
            </filter>
            <filter id="grid-distort" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="30" xChannelSelector="R" yChannelSelector="G" />
            </filter>
        </defs>
    `;
    document.body.appendChild(svg);

    // Create container and terrain elements
    const container = document.createElement('div');
    container.className = 'container';
    const terrain = document.createElement('div');
    terrain.className = 'terrain';
    terrain.id = 'terrain';
    const canvas = document.createElement('canvas');
    canvas.className = 'grid-canvas';
    terrain.appendChild(canvas);
    container.appendChild(terrain);
    document.body.appendChild(container);

    // Constants and globals
    const ctx = canvas.getContext('2d');
    const maxFeatures = 25;
    const scrollSpeed = 1;
    const patternHeight = 1000;
    let verticalOffsets = [];
    let horizontalOffsets = [];
    let scrollPosition = 0;
    let animationFrameId = null;
    let uiIntervalId = null;
    let spawnCounter = 0; // For steady respawn

    // Canvas setup
    function resizeCanvas() {
        canvas.width = window.innerWidth * 2;
        canvas.height = window.innerHeight;
        generateGridOffsets();
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // UI overlay
    const uiOverlay = document.createElement('div');
    uiOverlay.className = 'ui-overlay';
    const uiTexts = [
        'SURFACE SCAN INITIATED',
        'TERRAIN MAPPING: ACTIVE',
        'ANOMALY DETECTION: ENABLED',
        'SYSTEM STATUS: OPERATIONAL',
        '',
        ''
    ].map(text => {
        const div = document.createElement('div');
        div.className = 'ui-text';
        div.textContent = text;
        uiOverlay.appendChild(div);
        return div;
    });
    document.body.appendChild(uiOverlay);

    // Feature pool
    const featurePool = [];

    // Create a single feature
    function createFeature(initial = false) {
        const viewportWidth = window.innerWidth;
        const type = Math.random() > 0.5 ? 'crater' : 'elevation';
        const feature = document.createElement('div');
        if (type === 'crater') {
            feature.className = 'jagged-crater';
            const size = Math.random() * 100 + 30;
            feature.style.width = `${size}px`;
            feature.style.height = `${size}px`;
            feature.style.opacity = Math.random() * 0.5 + 0.5;
        } else {
            feature.className = 'terrain-elevation';
            const size = Math.random() * 500 + 300;
            feature.style.width = `${size}px`;
            feature.style.height = `${size}px`;
            feature.style.opacity = Math.random() * 0.7 + 0.3;
        }
        feature.style.left = `${Math.random() * (viewportWidth - 500) + 250}px`;
        // Initial spread: -300px to canvas.height; Recycle: -0 to -300px
        const spawnY = initial 
            ? -300 + (Math.random() * (canvas.height + 300)) 
            : -Math.random() * 300;
        feature.style.transform = `translateY(${spawnY}px)`;
        terrain.appendChild(feature);
        featurePool.push(feature);
    }

    // Pre-create initial features with spread
    function createFeaturePool() {
        for (let i = 0; i < maxFeatures; i++) {
            createFeature(true); // Spread initial batch
        }
    }

    // Pre-generate grid offsets
    function generateGridOffsets() {
        verticalOffsets = [];
        horizontalOffsets = [];
        const segmentSize = 50;
        const maxOffset = 15;

        for (let x = 0; x < canvas.width; x += 150) {
            const offsets = [];
            for (let y = 0; y <= canvas.height; y += segmentSize) {
                const wave = Math.sin(y * 0.01 + x * 0.005) * 10;
                const noise = (Math.random() - 0.5) * 5;
                offsets.push(wave + noise);
            }
            verticalOffsets.push(offsets);
        }

        for (let y = 0; y < canvas.height + patternHeight; y += 150) {
            const offsets = [];
            for (let x = 0; x <= canvas.width; x += segmentSize) {
                const wave = Math.sin(x * 0.01 + y * 0.005) * 10;
                const noise = (Math.random() - 0.5) * 5;
                offsets.push(wave + noise);
            }
            horizontalOffsets.push(offsets);
        }
    }
    generateGridOffsets();

    // Animation loop
    function animate() {
        scrollPosition -= scrollSpeed; // Downward
        if (scrollPosition <= -(canvas.height + patternHeight)) {
            scrollPosition += canvas.height + patternHeight; // Wrap to top
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let i = 0, x = 0; x < canvas.width; x += 150, i++) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            const offsets = verticalOffsets[i] || [];
            for (let y = 0, j = 0; y <= canvas.height; y += 50, j++) {
                const offset = offsets[j] || 0;
                ctx.lineTo(x + offset, y);
            }
            ctx.stroke();
        }

        // Horizontal lines (pushed back)
        for (let i = 0, y = (-scrollPosition - patternHeight) % 150; y < canvas.height + 150; y += 150, i++) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            const offsetIndex = Math.floor((scrollPosition + patternHeight + y) / 150);
            const offsets = horizontalOffsets[offsetIndex >= 0 ? offsetIndex : 0] || [];
            for (let x = 0, j = 0; x <= canvas.width; x += 50, j++) {
                const offset = offsets[j] || 0;
                ctx.lineTo(x, y + offset);
            }
            ctx.stroke();
        }

        // Update and spawn features
        featurePool.forEach(feature => {
            let y = parseFloat(feature.style.transform.match(/translateY\((.*?)\)/)?.[1]) || 0;
            y += scrollSpeed; // Move down
            if (y > canvas.height) { // Recycle at bottom
                feature.style.transform = `translateY(-${Math.random() * 300}px)`;
            } else {
                feature.style.transform = `translateY(${y}px)`;
            }
        });

        // Steady respawn: 1 every ~0.5s (30 frames at 60 FPS)
        spawnCounter++;
        if (featurePool.length < maxFeatures && spawnCounter >= 30) {
            createFeature();
            spawnCounter = 0; // Reset counter
        }

        animationFrameId = requestAnimationFrame(animate);
    }

    // UI updates
    let isScanningActive = false;
    let currentScanElement = null;
    function startScan() {
        if (isScanningActive || !uiTexts[4]) return;
        isScanningActive = true;
        const sector = Math.floor(Math.random() * 999);
        let progress = 1;
        const scanText = uiTexts[4];
        scanText.textContent = `SECTOR ${sector}: ${progress}% COMPLETE`;
        scanText.classList.add('scan-active');
        currentScanElement = scanText;

        const scanInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress >= 100) {
                scanText.textContent = `SECTOR ${sector}: 100% COMPLETE`;
                clearInterval(scanInterval);
                setTimeout(() => {
                    scanText.textContent = `SECTOR ${sector} SCAN COMPLETE`;
                    setTimeout(() => {
                        scanText.classList.remove('scan-active');
                        scanText.textContent = '';
                        isScanningActive = false;
                        currentScanElement = null;
                    }, 2000);
                }, 1000);
            } else {
                scanText.textContent = `SECTOR ${sector}: ${progress}% COMPLETE`;
            }
        }, 50);
    }

    function startUIUpdates() {
        uiIntervalId = setInterval(() => {
            if (!isScanningActive && Math.random() > 0.5) {
                startScan();
            } else if (!isScanningActive && uiTexts[5]) {
                const texts = [
                    `ELEVATION DETECTED: ${(Math.random() * 5).toFixed(1)}KM`,
                    'TERRAIN IRREGULARITY FOUND',
                    `ANOMALY IN SECTOR ${Math.floor(Math.random() * 999)}`
                ];
                const newText = uiTexts[5];
                newText.textContent = texts[Math.floor(Math.random() * texts.length)];
                newText.className = 'ui-text anomaly-active';
                setTimeout(() => {
                    newText.className = 'ui-text';
                    newText.textContent = '';
                }, 3000);
            }
        }, 2000);
    }

    // Visibility handling
    function handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            if (uiIntervalId) {
                clearInterval(uiIntervalId);
                uiIntervalId = null;
            }
        } else {
            if (!animationFrameId) {
                animate();
            }
            if (!uiIntervalId) {
                startUIUpdates();
            }
        }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start everything
    createFeaturePool();
    animate();
    startUIUpdates();
});