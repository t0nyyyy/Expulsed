// --- START OF FILE bogdan-background.js ---

// --- State Variables ---
let canvas = null; // Visible canvas element
let ctx = null;    // Visible canvas context
let renderCanvas = null; // Offscreen canvas element
let renderCtx = null;   // Offscreen canvas context

// Arrays for elements
let satellites = [];   // Green Spaceships (Designs 2-8)
let nebulaClouds = []; // GREEN Nebula Elements (Designs 0, 2, 4, 7)
let debrisClouds = []; // GREEN Debris Clouds (Designs 1, 2)
let particles = [];    // Spawned by Nebula Clouds (GREEN Particles)
let frameCount = 0;
let animationFrameId = null; // To control the animation loop

// --- Configuration (Copied from original HTML) ---
// ** Green Palette (Used for ALL elements) **
const bodyGreenDark = '#00331a'; const panelGreen = '#004d26';
const structureGreen = '#006633'; const detailGreen = '#1a804d';
const antennaGreenLight = '#339966'; const highlightGreen = '#33cc77';
const glowGreen = '#55ff99'; const cargoPodGreen = '#0b4d3c';

// Rates & Maximums
const SATELLITE_RATE = 0.0015; const MAX_SATELLITES = 3;
const NEBULA_CLOUD_RATE = 0.001; const MAX_NEBULA_CLOUDS = 2;
const DEBRIS_CLOUD_RATE = 0.0025; const MAX_DEBRIS_CLOUDS = 5;

// Particle settings
const BASE_PARTICLE_LIFESPAN = 60; const PARTICLE_LIFESPAN_SCALE_FACTOR = 0.6;
const MAX_PARTICLES = 150;
const PARTICLE_OPACITY_MIN = 0.15; const PARTICLE_OPACITY_MAX = 0.5;

// Satellite (Spaceship) Growth
const SAT_GROWER_CHANCE = 0.3; const SAT_GROWTH_FACTOR = 2.5;
const SAT_GROWTH_OPACITY_TARGET = 0.9;

// Nebula Cloud Growth
const NEBULA_GROWER_CHANCE = 0.4; const NEBULA_GROWTH_FACTOR = 4.0;
const NEBULA_GROWTH_OPACITY_TARGET = 0.75;

// Debris Cloud Settings
const DEBRIS_BASE_SPEED_MIN = 0.8; const DEBRIS_BASE_SPEED_MAX = 2.0;
const DEBRIS_SIZE_MIN = 15; const DEBRIS_SIZE_MAX = 35;

const ENTRY_EXIT_MARGIN = 200;
// Use an rgba color with alpha controlling the fade speed/intensity
const RENDER_FADE_COLOR = 'rgba(2, 10, 5, 0.1)'; // Low alpha = slower fade/longer trails
// --- End Configuration ---


// --- Exported Initialization Function ---
export function initBackgroundEffect(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Bogdan Background Error: Canvas with ID "${canvasId}" not found.`);
        return;
    }
    // Request alpha channel for the visible canvas
    ctx = canvas.getContext('2d', { alpha: true });

    // Create the single OFFSCREEN canvas for rendering
    renderCanvas = document.createElement('canvas');
    // Request alpha channel for the offscreen canvas
    renderCtx = renderCanvas.getContext('2d', { alpha: true });

    if (!ctx || !renderCtx) {
         console.error(`Bogdan Background Error: Failed to get 2D context.`);
         canvas = null; // Prevent further errors
         return;
    }

    // Initial resize
    resizeBackgroundEffect();

    console.log("Bogdan Background Effect Initialized.");
}

// --- Exported Resize Function ---
export function resizeBackgroundEffect() {
    if (!canvas || !renderCanvas || !ctx || !renderCtx) return; // Check if initialized

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderCanvas.width = canvas.width;
    renderCanvas.height = canvas.height;

    // Clear *both* canvases on resize to prevent artifacts
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    // Ensure composite mode is reset on the render context
    renderCtx.globalCompositeOperation = 'source-over';
}

// --- Helper to get random green color ---
const greenPaletteForDebris = [bodyGreenDark, panelGreen, structureGreen, detailGreen];
function getRandomGreen(palette = greenPaletteForDebris) {
     return palette[Math.floor(Math.random() * palette.length)];
}
// --- Helper hex->rgba ---
function hexToRgba(hex, alpha = 1.0) {
    const r = parseInt(hex.slice(1, 3), 16); const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16); return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// --- Particle Class (Draws to renderCtx) ---
class Particle {
     constructor(x, y, parentVelocity, sizeRatio = 1.0){
         this.x=x; this.y=y;
         this.vx = -parentVelocity.x*0.05+(Math.random()-.5)*.2;
         this.vy = -parentVelocity.y*0.05+(Math.random()-.5)*.2;
         const scaledLifespan = BASE_PARTICLE_LIFESPAN * (1 + (sizeRatio - 1) * PARTICLE_LIFESPAN_SCALE_FACTOR);
         this.initialLife = Math.max(20, scaledLifespan);
         this.life = this.initialLife;
         const randColor = Math.random();
         if (randColor < 0.33) { this.hexColor = highlightGreen; }
         else if (randColor < 0.66) { this.hexColor = antennaGreenLight; }
         else { this.hexColor = glowGreen; }
         this.opacityBase = Math.random()*(PARTICLE_OPACITY_MAX - PARTICLE_OPACITY_MIN) + PARTICLE_OPACITY_MIN;
         this.baseRadius = Math.random() * 0.8 + 0.4;
         this.radius = this.baseRadius;
     }
     update(){
         this.life--; this.x+=this.vx; this.y+=this.vy;
         const lifeRatio = Math.max(0, this.life / this.initialLife);
         this.radius = this.baseRadius * lifeRatio;
     }
     // Draws directly to the offscreen context (renderCtx)
     draw(){
         if(this.life<=0||this.radius<=.1 || !renderCtx) return;
         const lifeRatio = Math.max(0, this.life / this.initialLife);
         const currentOpacity = lifeRatio * this.opacityBase;
         const r = parseInt(this.hexColor.slice(1, 3), 16);
         const g = parseInt(this.hexColor.slice(3, 5), 16);
         const b = parseInt(this.hexColor.slice(5, 7), 16);
         renderCtx.fillStyle=`rgba(${r}, ${g}, ${b}, ${currentOpacity})`;
         // Use fillRect for tiny squares instead of arc for potential perf gain
         renderCtx.fillRect(this.x - this.radius*0.5, this.y-this.radius*0.5, this.radius, this.radius);
         // renderCtx.beginPath();
         // renderCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
         // renderCtx.fill();
     }
}

// --- GREEN DEBRIS DRAWING FUNCTIONS (Draw to passed context) ---
function drawGreenDebris1(context, size, x, y) { // Accepts context
    context.save(); context.translate(x, y); const numRocks = 15 + Math.floor(Math.random() * 10);
    const clusterRadius = size * 0.6; const colors = [bodyGreenDark, panelGreen, structureGreen];
    for (let i = 0; i < numRocks; i++) { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * Math.random() * clusterRadius;
        const rockX = Math.cos(angle) * radius; const rockY = Math.sin(angle) * radius; const rockSize = size * (0.05 + Math.random() * 0.08);
        const points = 4 + Math.floor(Math.random() * 3); const irregularity = 0.35; context.fillStyle = getRandomGreen(colors);
        context.beginPath(); const startAngle = Math.random() * Math.PI * 2; let px = rockX + Math.cos(startAngle) * rockSize; let py = rockY + Math.sin(startAngle) * rockSize; context.moveTo(px, py);
        for (let j = 1; j <= points; j++) { const pointAngle = startAngle + (j / points) * Math.PI * 2; const r = rockSize * (1 + (Math.random() - 0.5) * 2 * irregularity); px = rockX + Math.cos(pointAngle) * r; py = rockY + Math.sin(pointAngle) * r; context.lineTo(px, py); } context.closePath(); context.fill();
    } context.restore();
}
function drawGreenDebris2(context, size, x, y) { // Accepts context
    context.save(); context.translate(x, y); const numDust = 60; const dustRadius = size * 0.7; const dustColors = [panelGreen, structureGreen];
    for (let i = 0; i < numDust; i++) { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * dustRadius; const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius; const pSize = Math.random() * 1.2 + 0.3; const alpha = 0.1 + Math.random() * 0.25; context.fillStyle = hexToRgba(getRandomGreen(dustColors), alpha); context.beginPath(); context.arc(px, py, pSize, 0, Math.PI * 2); context.fill(); }
    const numRocks = 10 + Math.floor(Math.random() * 8); const rockRadius = size * 0.5; const rockColors = [bodyGreenDark, panelGreen];
     for (let i = 0; i < numRocks; i++) { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * rockRadius; const rockX = Math.cos(angle) * radius; const rockY = Math.sin(angle) * radius; const rockSize = size * (0.06 + Math.random() * 0.09); const points = 4 + Math.floor(Math.random() * 3); const irregularity = 0.4; context.fillStyle = getRandomGreen(rockColors); context.beginPath(); const startAngle = Math.random() * Math.PI * 2; let px = rockX + Math.cos(startAngle) * rockSize; let py = rockY + Math.sin(startAngle) * rockSize; context.moveTo(px, py); for (let j = 1; j <= points; j++) { const pointAngle = startAngle + (j / points) * Math.PI * 2; const r = rockSize * (1 + (Math.random() - 0.5) * 2 * irregularity); px = rockX + Math.cos(pointAngle) * r; py = rockY + Math.sin(pointAngle) * r; context.lineTo(px, py); } context.closePath(); context.fill(); }
    context.restore();
}

// --- GREEN NEBULA ELEMENT DRAWING FUNCTIONS (Draw to passed context) ---
function drawNebulaElement0(context, size, x, y, currentOpacity = 1.0) { context.save(); context.translate(x, y); const baseRadius = size * 0.5; context.globalAlpha = currentOpacity; let grad1 = context.createRadialGradient(0, 0, baseRadius * 0.1, 0, 0, baseRadius); grad1.addColorStop(0, panelGreen + '66'); grad1.addColorStop(0.7, bodyGreenDark + '33'); grad1.addColorStop(1, bodyGreenDark + '00'); context.fillStyle = grad1; context.beginPath(); context.arc(0, 0, baseRadius, 0, Math.PI * 2); context.fill(); let grad2 = context.createRadialGradient(baseRadius * 0.1, baseRadius*0.1, baseRadius * 0.05, baseRadius * 0.1, baseRadius*0.1, baseRadius * 0.7); grad2.addColorStop(0, structureGreen + '4D'); grad2.addColorStop(0.8, panelGreen + '1A'); grad2.addColorStop(1, panelGreen + '00'); context.fillStyle = grad2; context.beginPath(); context.arc(baseRadius * 0.1, baseRadius*0.1, baseRadius*0.7, 0, Math.PI * 2); context.fill(); context.restore(); }
function drawNebulaElement2(context, size, x, y, currentOpacity = 1.0) { context.save(); context.translate(x, y); const numParticles = 150; const clusterRadius = size * 0.4; context.globalAlpha = currentOpacity * 0.85; for (let i = 0; i < numParticles; i++) { const angle = Math.random() * Math.PI * 2; const radius = Math.random() * Math.random() * clusterRadius; const px = Math.cos(angle) * radius; const py = Math.sin(angle) * radius; const pSize = Math.random() * 1.8 + 0.6; const localAlpha = (0.15 + Math.random() * 0.4).toFixed(2); const color = Math.random() < 0.6 ? bodyGreenDark : panelGreen; const r = parseInt(color.slice(1, 3), 16); const g = parseInt(color.slice(3, 5), 16); const b = parseInt(color.slice(5, 7), 16); context.fillStyle = `rgba(${r}, ${g}, ${b}, ${localAlpha})`; context.beginPath(); context.arc(px, py, pSize, 0, Math.PI * 2); context.fill(); } context.restore(); }
function drawNebulaElement4(context, size, x, y, currentOpacity = 1.0) { context.save(); context.translate(x, y); const radius = size * 0.5; const turns = 2 + Math.random()*2; let grad = context.createLinearGradient(-radius, -radius, radius, radius); grad.addColorStop(0, antennaGreenLight + '80'); grad.addColorStop(0.5, detailGreen + '66'); grad.addColorStop(1, structureGreen + '80'); context.strokeStyle = grad; context.lineWidth = size * 0.1 + Math.random() * size * 0.1; context.globalAlpha = currentOpacity * (0.7 + Math.random()*0.3); context.beginPath(); context.moveTo(0,0); for (let i=0; i < turns * 10; i++) { const angle = (i / (turns*10)) * Math.PI * 2 * turns; const r = (i / (turns*10)) * radius; const px = Math.cos(angle) * r; const py = Math.sin(angle) * r; context.lineTo(px, py); } context.stroke(); context.restore(); }
function drawNebulaElement7(context, size, x, y, currentOpacity = 1.0) { context.save(); context.translate(x, y); const coreSize = size * 0.1; const envelopeSize = size * 0.5; context.globalAlpha = currentOpacity; let envGrad = context.createRadialGradient(0,0, coreSize*1.5, 0,0, envelopeSize); envGrad.addColorStop(0, detailGreen + '80'); envGrad.addColorStop(0.6, structureGreen + '33'); envGrad.addColorStop(1, panelGreen + '00'); context.fillStyle = envGrad; context.beginPath(); context.arc(0, 0, envelopeSize, 0, Math.PI*2); context.fill(); let coreGrad = context.createRadialGradient(0,0, coreSize*0.1, 0,0, coreSize); coreGrad.addColorStop(0, glowGreen + 'FF'); coreGrad.addColorStop(0.5, highlightGreen + 'CC'); coreGrad.addColorStop(1, antennaGreenLight + '00'); context.fillStyle = coreGrad; context.beginPath(); context.arc(0, 0, coreSize*1.2, 0, Math.PI*2); context.fill(); context.restore(); }

// --- SATELLITE (Spaceship) DRAWING FUNCTIONS (Draw to passed context) ---
function drawSatelliteShape2(context, size) { const spineL = size * 1.1; const spineW = size * 0.1; const moduleW = size * 0.35; const moduleH = size * 0.3; const moduleSpacing = size * 0.15; const numModules = 3; const bridgeW = size*0.2; const bridgeH = size*0.15; context.fillStyle = structureGreen; context.fillRect(-spineL / 2, -spineW / 2, spineL, spineW); context.fillStyle = detailGreen; context.fillRect(spineL/2, -bridgeH/2, bridgeW, bridgeH); context.fillStyle = highlightGreen; context.fillRect(spineL/2+bridgeW*0.7, -bridgeH*0.3, bridgeW*0.2, bridgeH*0.6); context.fillStyle = cargoPodGreen; const totalModuleSpan = (moduleW + moduleSpacing) * numModules - moduleSpacing; const startX = -totalModuleSpan / 2 + moduleW/2 - size*0.1; for (let i = 0; i < numModules; i++) { const x = startX + i * (moduleW + moduleSpacing); context.fillRect(x - moduleW / 2, spineW/2, moduleW, moduleH); context.fillRect(x - moduleW / 2, -spineW/2 - moduleH, moduleW, moduleH); context.strokeStyle=bodyGreenDark; context.lineWidth=1; context.strokeRect(x - moduleW / 2, spineW/2, moduleW, moduleH); context.strokeRect(x - moduleW / 2, -spineW/2 - moduleH, moduleW, moduleH); } context.fillStyle = panelGreen; context.fillRect(-spineL/2 - bridgeW*0.5, -spineW*1.5, bridgeW*0.5, spineW*3); context.fillStyle = glowGreen; context.beginPath(); context.ellipse(-spineL/2-bridgeW*0.5, 0, bridgeW*0.3, spineW*1.2, 0, Math.PI*0.5, Math.PI*1.5); context.fill(); }
function drawSatelliteShape3(context, size) { const bodyL = size; const bodyW = size * 0.25; const mainWingSpan = size * 0.8; const mainWingChord = size * 0.4; const mainWingSweep = size*0.3; const canardSpan = size * 0.3; const canardChord = size * 0.15; const canardOffset = size * 0.4; context.fillStyle = detailGreen; context.beginPath(); context.ellipse(0, 0, bodyL/2, bodyW/2, 0, 0, Math.PI*2); context.fill(); context.fillStyle = panelGreen; context.beginPath(); context.moveTo(-bodyL*0.1+mainWingSweep, 0); context.lineTo(-bodyL*0.3, mainWingSpan/2); context.lineTo(-bodyL*0.3-mainWingChord, mainWingSpan*0.3); context.lineTo(-bodyL*0.1, 0); context.closePath(); context.fill(); context.beginPath(); context.moveTo(-bodyL*0.1+mainWingSweep, 0); context.lineTo(-bodyL*0.3, -mainWingSpan/2); context.lineTo(-bodyL*0.3-mainWingChord, -mainWingSpan*0.3); context.lineTo(-bodyL*0.1, 0); context.closePath(); context.fill(); context.fillStyle = bodyGreenDark; context.beginPath(); context.moveTo(canardOffset, 0); context.lineTo(canardOffset-canardChord, canardSpan/2); context.lineTo(canardOffset-canardChord*1.2, 0); context.closePath(); context.fill(); context.beginPath(); context.moveTo(canardOffset, 0); context.lineTo(canardOffset-canardChord, -canardSpan/2); context.lineTo(canardOffset-canardChord*1.2, 0); context.closePath(); context.fill(); context.fillStyle = glowGreen; context.beginPath(); context.ellipse(-bodyL/2, 0, bodyW*0.3, bodyW*0.4, 0, 0, Math.PI*2); context.fill(); context.fillStyle = highlightGreen; context.beginPath(); context.ellipse(bodyL*0.35, 0, bodyL*0.1, bodyW*0.2, 0, 0, Math.PI*2); context.fill(); }
function drawSatelliteShape4(context, size) { const frameW = size * 0.8; const frameH = size * 0.2; const strutW = size*0.05; const centralModuleR = size * 0.15; const toolArmL = size*0.5; const toolArmW = size*0.08; const toolHeadR = size*0.1; context.strokeStyle = structureGreen; context.lineWidth=strutW; context.strokeRect(-frameW/2, -frameH/2, frameW, frameH); context.fillStyle = bodyGreenDark; context.beginPath(); context.arc(0, 0, centralModuleR, 0, Math.PI*2); context.fill(); context.fillStyle = highlightGreen; context.beginPath(); context.arc(0, 0, centralModuleR*0.4, 0, Math.PI*2); context.fill(); context.fillStyle = antennaGreenLight; context.fillRect(centralModuleR, -toolArmW/2, toolArmL, toolArmW); context.fillStyle = panelGreen; context.beginPath(); context.arc(centralModuleR + toolArmL, 0, toolHeadR, 0, Math.PI*2); context.fill(); context.fillStyle = glowGreen; context.globalAlpha = 0.7 + Math.random()*0.3; context.beginPath(); context.arc(centralModuleR + toolArmL + toolHeadR*0.8, 0, toolHeadR*0.5, 0, Math.PI*2); context.fill(); context.globalAlpha = 1.0; context.fillStyle = detailGreen; context.fillRect(-frameW*0.55, -frameH*0.2, frameW*0.1, frameH*0.4); context.fillRect(frameW*0.45, -frameH*0.2, frameW*0.1, frameH*0.4); }
function drawSatelliteShape5(context, size) { const mainL = size * 0.9; const mainW = size * 0.3; const enginePodL = size*0.4; const enginePodW = size*0.3; const engineOffset = -mainL*0.3; const weaponPodL = size*0.3; const weaponPodW = size*0.1; const weaponOffsetY = mainW*0.5; context.fillStyle = bodyGreenDark; context.beginPath(); context.moveTo(mainL/2, 0); context.lineTo(engineOffset, -mainW/2); context.lineTo(-mainL/2, -mainW*0.3); context.lineTo(-mainL/2, mainW*0.3); context.lineTo(engineOffset, mainW/2); context.closePath(); context.fill(); context.fillStyle = panelGreen; context.fillRect(engineOffset-enginePodL/2, -mainW/2 - enginePodW/2, enginePodL, enginePodW); context.fillRect(engineOffset-enginePodL/2, mainW/2 - enginePodW/2, enginePodL, enginePodW); context.fillStyle = glowGreen; context.beginPath(); context.ellipse(engineOffset-enginePodL/2, -mainW/2, enginePodW*0.3, enginePodW*0.4, 0, Math.PI*0.5, Math.PI*1.5); context.fill(); context.beginPath(); context.ellipse(engineOffset-enginePodL/2, mainW/2, enginePodW*0.3, enginePodW*0.4, 0, Math.PI*0.5, Math.PI*1.5); context.fill(); context.fillStyle = structureGreen; context.fillRect(mainL*0.1, weaponOffsetY, weaponPodL, weaponPodW); context.fillRect(mainL*0.1, -weaponOffsetY - weaponPodW, weaponPodL, weaponPodW); context.fillStyle = highlightGreen; context.beginPath(); context.ellipse(mainL*0.3, 0, mainL*0.15, mainW*0.2, 0, 0, Math.PI*2); context.fill(); }
function drawSatelliteShape6(context, size) { const mainHullR = size * 0.3; const labModuleW = size*0.4; const labModuleH = size*0.5; const labModuleOffset = mainHullR+labModuleW*0.5; const sensorBoomL = size*0.6; const sensorBoomW = size*0.05; const sensorBoomOffset = -mainHullR; const dishR = size*0.2; context.fillStyle = bodyGreenDark; context.beginPath(); context.arc(0, 0, mainHullR, 0, Math.PI*2); context.fill(); context.strokeStyle = structureGreen; context.lineWidth=1; context.stroke(); context.fillStyle = panelGreen; context.fillRect(mainHullR, -labModuleH/2, labModuleW, labModuleH); context.fillStyle = highlightGreen; context.fillRect(mainHullR+labModuleW*0.1, -labModuleH*0.3, labModuleW*0.8, labModuleH*0.1); context.fillStyle = antennaGreenLight; context.fillRect(sensorBoomOffset-sensorBoomL, -sensorBoomW/2, sensorBoomL, sensorBoomW); context.fillStyle = detailGreen; context.beginPath(); context.arc(sensorBoomOffset-sensorBoomL, 0, dishR, Math.PI*0.5, Math.PI*1.5); context.fill(); context.strokeStyle = highlightGreen; context.lineWidth=1; context.stroke(); context.strokeStyle = antennaGreenLight; context.lineWidth = 1.5; context.beginPath(); context.moveTo(0, -mainHullR); context.lineTo(0, -mainHullR*1.5); context.stroke(); context.beginPath(); context.moveTo(0, mainHullR); context.lineTo(0, mainHullR*1.5); context.stroke(); }
function drawSatelliteShape7(context, size) { const bodyL = size * 1.2; const bodyH = size * 0.3; const wingSweepL = size*0.3; const wingH = size*0.5; const tailH = size*0.3; const tailL = size*0.2; context.fillStyle = panelGreen; context.beginPath(); context.ellipse(0, 0, bodyL/2, bodyH/2, 0, 0, Math.PI*2); context.fill(); context.fillStyle = highlightGreen; context.fillRect(-bodyL*0.4, -bodyH*0.1, bodyL*0.8, bodyH*0.2); context.fillStyle = bodyGreenDark; context.beginPath(); context.moveTo(-bodyL*0.2, 0); context.lineTo(-bodyL*0.2-wingSweepL, wingH/2); context.lineTo(-bodyL*0.3-wingSweepL, wingH*0.3); context.lineTo(-bodyL*0.4, 0); context.closePath(); context.fill(); context.beginPath(); context.moveTo(-bodyL*0.2, 0); context.lineTo(-bodyL*0.2-wingSweepL, -wingH/2); context.lineTo(-bodyL*0.3-wingSweepL, -wingH*0.3); context.lineTo(-bodyL*0.4, 0); context.closePath(); context.fill(); context.beginPath(); context.moveTo(-bodyL*0.4, 0); context.lineTo(-bodyL*0.4-tailL, -tailH/2); context.lineTo(-bodyL*0.4-tailL*0.8, 0); context.closePath(); context.fill(); context.fillStyle = glowGreen; context.globalAlpha = 0.6; context.beginPath(); context.ellipse(-bodyL/2, 0, bodyL*0.05, bodyH*0.3, 0, 0, Math.PI*2); context.fill(); context.globalAlpha = 1.0; }
function drawSatelliteShape8(context, size) { const mainW = size * 0.9; const mainH = size * 0.4; const cockpitW = size*0.3; const cockpitH = size*0.2; const cockpitOffset = mainW*0.35; const engineBlockW = size*0.3; const engineBlockH = size*0.6; const engineBlockOffset = -mainW*0.5; const rampW = mainW*0.5; const rampH = mainH*0.1; context.fillStyle = bodyGreenDark; context.fillRect(-mainW/2, -mainH/2, mainW, mainH); context.strokeStyle = structureGreen; context.lineWidth=1; context.strokeRect(-mainW/2, -mainH/2, mainW, mainH); context.fillStyle = panelGreen; context.fillRect(cockpitOffset, -cockpitH/2, cockpitW, cockpitH); context.fillStyle = highlightGreen; context.fillRect(cockpitOffset+cockpitW*0.7, -cockpitH*0.3, cockpitW*0.2, cockpitH*0.6); context.fillStyle = structureGreen; context.fillRect(engineBlockOffset - engineBlockW, -engineBlockH/2, engineBlockW, engineBlockH); context.fillRect(mainW/2, -engineBlockH/2, engineBlockW, engineBlockH); context.fillStyle = glowGreen; context.beginPath(); context.rect(engineBlockOffset - engineBlockW, -engineBlockH*0.3, engineBlockW*0.5, engineBlockH*0.6); context.fill(); context.beginPath(); context.rect(mainW/2, -engineBlockH*0.3, engineBlockW*0.5, engineBlockH*0.6); context.fill(); context.strokeStyle = detailGreen; context.lineWidth = 2; context.strokeRect(cockpitOffset - rampW/2, mainH/2 - rampH, rampW, rampH); }

// --- Satellite Class (Spaceships - Draws to renderCtx) ---
class Satellite {
    constructor() { this.reset(); }
    reset() {
        if (!canvas) return; // Need canvas dimensions
        this.direction = Math.random() < 0.5 ? 1 : -1;
        this.startX = this.direction === 1 ? -ENTRY_EXIT_MARGIN : canvas.width + ENTRY_EXIT_MARGIN;
        this.endX = this.direction === 1 ? canvas.width + ENTRY_EXIT_MARGIN : -ENTRY_EXIT_MARGIN;
        this.x = this.startX; this.y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1;
        this.vx = this.direction * (Math.random() * 1.0 + 0.5); this.vy = Math.random() * 0.5 - 0.25;
        const allowedShapes = [2, 3, 4, 5, 6, 7, 8];
        this.shapeType = allowedShapes[Math.floor(Math.random() * allowedShapes.length)];
        this.baseSize = Math.random() * 12 + 28; this.isGrower = Math.random() < SAT_GROWER_CHANCE;
        this.currentSize = this.isGrower ? this.baseSize * 0.5 : this.baseSize; this.initialOpacity = 0.7;
        this.rotation = Math.random() * Math.PI * 2; this.rotationSpeed = (Math.random() - 0.5) * 0.0005;
    }
    update() {
        if (!canvas) return false;
        this.x += this.vx; this.y += this.vy; this.rotation += this.rotationSpeed;
        let currentOpacity = this.initialOpacity;
        if(this.isGrower){
            const totalDist=Math.abs(this.endX-this.startX); let progress=Math.abs(this.x-this.startX)/totalDist; progress=Math.max(0,Math.min(1,progress));
            const growthCurveValue = -4 * progress * (progress - 1); const sizeMultiplier = 1 + (SAT_GROWTH_FACTOR - 1) * growthCurveValue;
            this.currentSize=this.baseSize*sizeMultiplier; const targetOpacity = this.initialOpacity+(SAT_GROWTH_OPACITY_TARGET-this.initialOpacity)*growthCurveValue;
            currentOpacity = Math.min(SAT_GROWTH_OPACITY_TARGET, Math.max(this.initialOpacity * 0.5, targetOpacity));
        } else { this.currentSize=this.baseSize; currentOpacity = this.initialOpacity; }
        this.currentOpacity = currentOpacity; // Store opacity for drawing
        if((this.direction === 1 && this.x > this.endX) || (this.direction === -1 && this.x < this.endX)){ return this.handleOffscreen(); }
        return false;
    }
    // Draws directly to the offscreen context (renderCtx)
    draw() {
        if (!renderCtx) return;
        renderCtx.save();
        renderCtx.translate(this.x, this.y);
        renderCtx.rotate(this.rotation);
        renderCtx.globalAlpha = this.currentOpacity; // Use stored opacity
        // Pass offscreen context (renderCtx) to the shape drawing function
        switch(this.shapeType){
            case 2: drawSatelliteShape2(renderCtx, this.currentSize); break;
            case 3: drawSatelliteShape3(renderCtx, this.currentSize); break;
            case 4: drawSatelliteShape4(renderCtx, this.currentSize); break;
            case 5: drawSatelliteShape5(renderCtx, this.currentSize); break;
            case 6: drawSatelliteShape6(renderCtx, this.currentSize); break;
            case 7: drawSatelliteShape7(renderCtx, this.currentSize); break;
            case 8: drawSatelliteShape8(renderCtx, this.currentSize); break;
            default: renderCtx.fillStyle = glowGreen; renderCtx.fillRect(-this.currentSize/4, -this.currentSize/4, this.currentSize/2, this.currentSize/2); break;
        }
        renderCtx.restore();
    }
     handleOffscreen() { const index = satellites.indexOf(this); if (index > -1) { satellites.splice(index, 1); return true; } return false; }
}

// --- NebulaCloud Class (Draws to renderCtx) ---
class NebulaCloud {
     constructor(){ this.reset(); }
     reset(){
         if (!canvas) return;
         this.direction=Math.random()<.5?1:-1; this.startX=this.direction===1?-ENTRY_EXIT_MARGIN:canvas.width+ENTRY_EXIT_MARGIN; this.endX=this.direction===1?canvas.width+ENTRY_EXIT_MARGIN:-ENTRY_EXIT_MARGIN; this.x=this.startX; this.y=canvas.height*0.5 + (Math.random() - 0.5) * canvas.height * 0.7; const baseSpeed = Math.random() * 0.8 + 0.3; this.vx=this.direction * baseSpeed; this.vy=(Math.random()*.2-.1) * 1.0; const allowedShapes = [0, 2, 4, 7]; this.shapeType = allowedShapes[Math.floor(Math.random() * allowedShapes.length)]; this.particleTimer=0; this.particleInterval = 10 + Math.random() * 10; this.isGrower=Math.random()<NEBULA_GROWER_CHANCE; this.baseSize = Math.random() * 40 + 50; this.currentSize = this.isGrower ? this.baseSize * 0.3 : this.baseSize; this.initialOpacity = 0.7 + Math.random() * 0.2; this.rotation = Math.random() * Math.PI * 2; this.rotationSpeed = (Math.random() - 0.5) * 0.0003;
     }
     update(){
         if (!canvas) return false;
         this.x+=this.vx; this.y+=this.vy; this.rotation += this.rotationSpeed;
         let currentSizeRatio=1.0; let currentOpacity = this.initialOpacity;
         if(this.isGrower){
             const totalDist=Math.abs(this.endX-this.startX); let progress=Math.abs(this.x-this.startX)/totalDist; progress=Math.max(0,Math.min(1,progress));
             const growthCurveValue = -4 * progress * (progress - 1); const sizeMultiplier = 1 + (NEBULA_GROWTH_FACTOR - 1) * growthCurveValue;
             this.currentSize = this.baseSize * sizeMultiplier; currentSizeRatio = sizeMultiplier;
             const targetOpacity=this.initialOpacity+(NEBULA_GROWTH_OPACITY_TARGET-this.initialOpacity)*growthCurveValue;
             currentOpacity=Math.min(NEBULA_GROWTH_OPACITY_TARGET, Math.max(this.initialOpacity * 0.2, targetOpacity));
         } else { this.currentSize = this.baseSize; currentSizeRatio = 1.0; currentOpacity = this.initialOpacity; }
         // Apply 75% opacity scaling (from original code)
         this.currentOpacity = currentOpacity * 0.75; // Store final opacity

         this.particleTimer++;
         if(this.particleTimer>=this.particleInterval&&particles.length<MAX_PARTICLES){
             if (Math.random() < 0.6) {
                 particles.push(new Particle( this.x + (Math.random()-0.5)*this.currentSize*0.3, this.y + (Math.random()-0.5)*this.currentSize*0.3, {vx:this.vx, vy:this.vy}, currentSizeRatio ));
             }
             this.particleTimer=0;
         }
         if((this.direction===1&&this.x > this.endX + ENTRY_EXIT_MARGIN) || (this.direction===-1&&this.x < this.endX - ENTRY_EXIT_MARGIN)){ return this.handleOffscreen(); }
         return false;
     }
     // Draws directly to the offscreen context (renderCtx)
     draw(){
         if (!renderCtx) return;
         renderCtx.save();
         renderCtx.translate(this.x, this.y);
         renderCtx.rotate(this.rotation);
         // Pass offscreen context (renderCtx) and stored opacity to drawing function
         switch(this.shapeType){
             case 0: drawNebulaElement0(renderCtx, this.currentSize, 0, 0, this.currentOpacity); break;
             case 2: drawNebulaElement2(renderCtx, this.currentSize, 0, 0, this.currentOpacity); break;
             case 4: drawNebulaElement4(renderCtx, this.currentSize, 0, 0, this.currentOpacity); break;
             case 7: drawNebulaElement7(renderCtx, this.currentSize, 0, 0, this.currentOpacity); break;
             default: renderCtx.fillStyle = highlightGreen; renderCtx.globalAlpha = this.currentOpacity; renderCtx.fillRect(-10, -10, 20, 20); break;
         }
         renderCtx.restore();
     }
     handleOffscreen(){ const index=nebulaClouds.indexOf(this); if(index>-1){ nebulaClouds.splice(index,1); return true; } return false; }
}

// --- DebrisCloud Class (Draws to renderCtx) ---
class DebrisCloud {
    constructor() { this.reset(); }
    reset() {
        if (!canvas) return;
        this.x = Math.random() * (canvas.width * 1.1) - (canvas.width * 0.05); this.y = Math.random() * -canvas.height * 0.3 - 30; const angle = (Math.random() * 40 + 70) * (Math.PI / 180); this.speed = Math.random() * (DEBRIS_BASE_SPEED_MAX - DEBRIS_BASE_SPEED_MIN) + DEBRIS_BASE_SPEED_MIN; this.vx = Math.cos(angle) * this.speed; this.vy = Math.sin(angle) * this.speed; this.size = Math.random() * (DEBRIS_SIZE_MAX - DEBRIS_SIZE_MIN) + DEBRIS_SIZE_MIN; this.shapeType = Math.random() < 0.5 ? 1 : 2; this.rotation = Math.random() * Math.PI * 2; this.rotationSpeed = (Math.random() - 0.5) * 0.002; }
    update() {
        if (!canvas) return false;
        this.x += this.vx; this.y += this.vy; this.rotation += this.rotationSpeed; if (this.y > canvas.height + this.size * 1.5) { return this.handleOffscreen(); } return false;
    }
    // Draws directly to the offscreen context (renderCtx)
    draw() {
        if (!renderCtx) return;
        renderCtx.save();
        renderCtx.translate(this.x, this.y);
        renderCtx.rotate(this.rotation);
        // Pass offscreen context (renderCtx) to drawing function
        switch (this.shapeType) {
            case 1: drawGreenDebris1(renderCtx, this.size, 0, 0); break;
            case 2: drawGreenDebris2(renderCtx, this.size, 0, 0); break;
        }
        renderCtx.restore();
    }
    handleOffscreen() { const index = debrisClouds.indexOf(this); if (index > -1) { debrisClouds.splice(index, 1); return true; } return false; }
}


// --- Animation Loop Function (Applies Transparency Fix) ---
function animate() {
    // Ensure contexts are available
    if (!ctx || !renderCtx || !canvas || !renderCanvas) {
        console.error("Bogdan Background Error: Canvas or context not initialized before animate call.");
        animationFrameId = null; // Stop the loop if something is wrong
        return;
    }

    frameCount++;
    // Optional Debug Log
    // if (frameCount % 300 === 0) { console.log(`Bogdan BG --- Ships: ${satellites.length}, Nebulae: ${nebulaClouds.length}, Debris: ${debrisClouds.length}, Particles: ${particles.length}`); }

    // --- Step 1: Render trails/fading onto OFFSCREEN canvas ---
    // Apply fade using destination-out composite operation
    renderCtx.globalCompositeOperation = 'destination-out';
    renderCtx.fillStyle = RENDER_FADE_COLOR; // Use the configured fade color/alpha
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);

    // IMPORTANT: Reset composite mode to default for drawing new objects
    renderCtx.globalCompositeOperation = 'source-over';

    // Draw current frame objects onto the offscreen canvas
    // Order matters for layering: Particles -> Debris -> Nebulae -> Ships
    for(let i=particles.length-1;i>=0;i--){if(particles[i].life>0){particles[i].draw();}} // Draw Particles
    for(let i=debrisClouds.length-1;i>=0;i--){if(debrisClouds[i]){debrisClouds[i].draw();}} // Draw Debris
    for(let i=nebulaClouds.length-1;i>=0;i--){if(nebulaClouds[i]){nebulaClouds[i].draw();}} // Draw Nebulae
    for(let i=satellites.length-1;i>=0;i--){if(satellites[i]){satellites[i].draw();}} // Draw Ships last

    // --- Step 2: Update the VISIBLE canvas ---
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear visible canvas completely
    ctx.drawImage(renderCanvas, 0, 0);                // Draw the offscreen result (with trails)

    // --- Step 3: Update Object States and Handle Spawning/Despawning ---
    if (Math.random() < SATELLITE_RATE && satellites.length < MAX_SATELLITES) { satellites.push(new Satellite()); }
    if (Math.random() < NEBULA_CLOUD_RATE && nebulaClouds.length < MAX_NEBULA_CLOUDS) { nebulaClouds.push(new NebulaCloud()); }
    if (Math.random() < DEBRIS_CLOUD_RATE && debrisClouds.length < MAX_DEBRIS_CLOUDS) { debrisClouds.push(new DebrisCloud()); } // Spawn Debris

    // Update & Remove particles
    for(let i=particles.length-1;i>=0;i--){particles[i].update();if(particles[i].life<=0){particles.splice(i,1);}}
    // Update & Remove satellites
    for(let i=satellites.length-1;i>=0;i--){if(satellites[i]){ satellites[i].update(); }}
    // Update & Remove nebulae
    for(let i=nebulaClouds.length-1;i>=0;i--){if(nebulaClouds[i]){ nebulaClouds[i].update(); }}
    // Update & Remove debris
    for(let i=debrisClouds.length-1;i>=0;i--){if(debrisClouds[i]){ debrisClouds[i].update(); }}

    // Loop
    animationFrameId = requestAnimationFrame(animate); // Store the ID for cancellation
}

// --- Exported Control Functions ---
export function startBackgroundEffect() {
    if (animationFrameId === null) { // Only start if not already running
        console.log("Starting Bogdan Background Effect Animation Loop...");
        animate(); // Initial call to start the loop
    } else {
        console.log("Bogdan Background Effect Animation Loop already running.");
    }
}

export function stopBackgroundEffect() {
    if (animationFrameId !== null) { // Only stop if running
        console.log("Stopping Bogdan Background Effect Animation Loop...");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;

        // Optional: Clear canvases for a cleaner stop
        if (ctx && canvas) {
             ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        if (renderCtx && renderCanvas) {
             renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
             // Ensure composite mode is reset if stopped uncleanly
             renderCtx.globalCompositeOperation = 'source-over';
        }
        // Optional: Reset object arrays if you want a fresh start next time
        // satellites = []; nebulaClouds = []; debrisClouds = []; particles = [];
    } else {
         console.log("Bogdan Background Effect Animation Loop already stopped.");
    }
}
// --- END OF FILE bogdan-background.js ---