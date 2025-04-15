// --- State Variables ---
let canvas = null; // Visible canvas element
let ctx = null;    // Visible canvas context
let renderCanvas = null; // Offscreen canvas element
let renderCtx = null;   // Offscreen canvas context

let meteors = [];
let comets = [];
let particles = [];
let satellites = [];
let frameCount = 0;
let animationFrameId = null; // To control the animation loop

// --- Configuration (Copied from original) ---
const METEOR_RATE = 0.003;   const MAX_METEORS = 3;
const COMET_RATE = 0.0008;   const MAX_COMETS = 2;
const SATELLITE_RATE = 0.0015; const MAX_SATELLITES = 1;
const BASE_PARTICLE_LIFESPAN = 50; const PARTICLE_LIFESPAN_SCALE_FACTOR = 0.75;
const MAX_PARTICLES = 400;
const METEOR_COLOR_MIN_G = 80; const METEOR_COLOR_MAX_G = 150; const METEOR_OPACITY_MIN = 0.3; const METEOR_OPACITY_MAX = 0.6;
const COMET_COLOR_MIN_G = 60; const COMET_COLOR_MAX_G = 120; const COMET_OPACITY_MIN = 0.5; const COMET_OPACITY_MAX = 0.8;
const PARTICLE_COLOR_MIN_G = 70; const PARTICLE_COLOR_MAX_G = 130; const PARTICLE_OPACITY_MIN = 0.2; const PARTICLE_OPACITY_MAX = 0.5;
const bodyGreenDark = '#005030'; const panelGreen = '#006644'; const antennaGreenLight = '#338866';
const highlightGreen = '#00FF88'; const highlightGreenDark = '#009955';
const GROWER_CHANCE = 0.25; const GROWTH_FACTOR = 2.5; const GROWTH_OPACITY_TARGET = 0.85; // Meteors
const COMET_GROWER_CHANCE = 0.4; const COMET_GROWTH_FACTOR = 10.0; const COMET_GROWTH_OPACITY_TARGET = 0.95; // Comets
const SAT_GROWER_CHANCE = 0.3; const SAT_GROWTH_FACTOR = 4.0; const SAT_GROWTH_OPACITY_TARGET = 0.9; // Satellites
const ENTRY_EXIT_MARGIN = 100;
// Set fade alpha - might need tweaking depending on desired trail length
const RENDER_FADE_COLOR = 'rgba(5, 5, 5, 0.15)'; // Trail intensity
// --- End Configuration ---

// --- Exported Initialization Function ---
export function initBackgroundEffect(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Background Effect Error: Canvas with ID "${canvasId}" not found.`);
        return;
    }
    // Request alpha channel
    ctx = canvas.getContext('2d', { alpha: true });

    // Create the single OFFSCREEN canvas for rendering
    renderCanvas = document.createElement('canvas');
    // Request alpha channel
    renderCtx = renderCanvas.getContext('2d', { alpha: true });

    if (!ctx || !renderCtx) {
         console.error(`Background Effect Error: Failed to get 2D context.`);
         canvas = null; // Prevent further errors
         return;
    }

    // Initial resize
    resizeBackgroundEffect();

    console.log("Background Effect Initialized.");
}

// --- Exported Resize Function ---
export function resizeBackgroundEffect() {
    if (!canvas || !renderCanvas) return; // Check if initialized

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    renderCanvas.width = canvas.width;
    renderCanvas.height = canvas.height;

    // Clear offscreen canvas on resize to prevent artifacts if size changes drastically
    if (renderCtx) {
        renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
        // Set default composite mode on resize clear
        renderCtx.globalCompositeOperation = 'source-over';
    }
}


// --- Particle Class (Uses renderCtx directly) ---
class Particle {
     constructor(x, y, parentVelocity, cometSizeRatio = 1.0){
         this.x=x; this.y=y; this.vx = -parentVelocity.x*0.1+(Math.random()-.5)*.5; this.vy = -parentVelocity.y*0.1+(Math.random()-.5)*.5; const scaledLifespan = BASE_PARTICLE_LIFESPAN * (1 + (cometSizeRatio - 1) * PARTICLE_LIFESPAN_SCALE_FACTOR); this.initialLife = Math.max(10, scaledLifespan); this.life = this.initialLife; this.baseRadius = Math.random() * 1.2 + 0.6; this.radius = this.baseRadius; const green=Math.floor(Math.random()*(PARTICLE_COLOR_MAX_G-PARTICLE_COLOR_MIN_G)+PARTICLE_COLOR_MIN_G); const opacity=Math.random()*(PARTICLE_OPACITY_MAX-PARTICLE_OPACITY_MIN)+PARTICLE_OPACITY_MIN; this.colorBase=`0, ${green}, 0`; this.opacityBase=opacity;
     }
     update(){
         this.life--; this.x+=this.vx; this.y+=this.vy; const lifeRatio = Math.max(0, this.life / this.initialLife); this.radius = this.baseRadius * Math.sqrt(lifeRatio);
     }
     // Draws directly to the offscreen context
     draw(){
         if(this.life<=0||this.radius<=.1 || !renderCtx)return;
         const lifeRatio = this.life / this.initialLife;
         const currentOpacity = lifeRatio * this.opacityBase;
         renderCtx.fillStyle=`rgba(${this.colorBase}, ${currentOpacity})`;
         renderCtx.beginPath();
         renderCtx.arc(this.x,this.y,this.radius,0,Math.PI*2);
         renderCtx.fill();
     }
 }

// --- Meteor Class (Uses renderCtx directly) ---
class Meteor {
    constructor(){this.reset();}
    reset(){
        if (!canvas) return; // Need canvas dimensions
        this.x=Math.random()*(canvas.width*1.2)-(canvas.width*.1); this.y=Math.random()*-canvas.height*.5; const angle=(Math.random()*40+70)*(Math.PI/180); this.vx=Math.cos(angle); this.vy=Math.sin(angle); this.speed=Math.random()*3+2; this.isGrower=Math.random()<GROWER_CHANCE; this.initialLength=Math.random()*60+40; this.initialThickness=Math.random()*1.0+.3; this.initialGreen=Math.floor(Math.random()*(METEOR_COLOR_MAX_G-METEOR_COLOR_MIN_G)+METEOR_COLOR_MIN_G); this.initialOpacity=Math.random()*(METEOR_OPACITY_MAX-METEOR_OPACITY_MIN)+METEOR_OPACITY_MIN; this.length=this.initialLength; this.thickness=this.initialThickness; this.color=`rgba(0, ${this.initialGreen}, 0, ${this.initialOpacity})`;
    }
    update(){
        if (!canvas) return false;
        this.x+=this.vx*this.speed; this.y+=this.vy*this.speed; if(this.isGrower){ const progress=Math.max(0,Math.min(1,this.y/(canvas.height*.9))); const sizeMultiplier=1+(GROWTH_FACTOR-1)*progress; this.length=this.initialLength*sizeMultiplier; this.thickness=this.initialThickness*sizeMultiplier; const targetOpacity=this.initialOpacity+(GROWTH_OPACITY_TARGET-this.initialOpacity)*progress; const currentOpacity=Math.min(GROWTH_OPACITY_TARGET,Math.max(this.initialOpacity,targetOpacity)); this.color=`rgba(0, ${this.initialGreen}, 0, ${currentOpacity})`; } if(this.y>canvas.height+this.initialLength*GROWTH_FACTOR){ return this.handleOffscreen(); } return false;
    }
    // Draws directly to the offscreen context
    draw(){
        if (!renderCtx) return;
        renderCtx.beginPath();
        renderCtx.moveTo(this.x,this.y);
        const tailX=this.x-this.vx*this.length;
        const tailY=this.y-this.vy*this.length;
        renderCtx.lineTo(tailX,tailY);
        renderCtx.strokeStyle=this.color;
        renderCtx.lineWidth=this.thickness;
        renderCtx.stroke();
    }
    handleOffscreen(){
        const index=meteors.indexOf(this); if(index>-1){meteors.splice(index,1); return true;} return false;
    }
 }

// --- Comet Class (Uses renderCtx directly) ---
class Comet {
     constructor(){this.reset();}
     reset(){
         if (!canvas) return;
         this.direction=Math.random()<.5?1:-1;
         this.startX=this.direction===1?-ENTRY_EXIT_MARGIN:canvas.width+ENTRY_EXIT_MARGIN;
         this.endX=this.direction===1?canvas.width+ENTRY_EXIT_MARGIN:-ENTRY_EXIT_MARGIN;
         this.x=this.startX;
         this.y=Math.random()*canvas.height*.7;
         this.vx=this.direction*(Math.random()*1.5+1.0);
         this.vy=Math.random()*.8-.4;
         this.particleTimer=0;
         this.particleInterval=2;
         this.isGrower=Math.random()<COMET_GROWER_CHANCE;
         this.initialRadius = Math.random() * 2.5 + 5.5;
         this.initialGreen=Math.floor(Math.random()*(COMET_COLOR_MAX_G-COMET_COLOR_MIN_G)+COMET_COLOR_MIN_G);
         this.initialOpacity=Math.random()*(COMET_OPACITY_MAX-COMET_OPACITY_MIN)+COMET_OPACITY_MIN;
         this.radius=this.initialRadius;
         this.color=`rgba(0, ${this.initialGreen}, 0, ${this.initialOpacity})`;
         this.shapeType=Math.floor(Math.random()*3);
         this.rotation=Math.random()*Math.PI*2;
     }
     update(){
          if (!canvas) return false;
         this.x+=this.vx;
         this.y+=this.vy;
         let currentSizeRatio=1.0;
         if(this.isGrower){
             const totalDist=Math.abs(this.endX-this.startX);
             let progress=Math.abs(this.x-this.startX)/totalDist;
             progress=Math.max(0,Math.min(1,progress));
             const growthCurveValue=-4*progress*(progress-1);
             const sizeMultiplier=1+(COMET_GROWTH_FACTOR-1)*growthCurveValue;
             this.radius=this.initialRadius*sizeMultiplier;
             currentSizeRatio=sizeMultiplier;
             const targetOpacity=this.initialOpacity+(COMET_GROWTH_OPACITY_TARGET-this.initialOpacity)*growthCurveValue;
             const currentOpacity=Math.min(COMET_GROWTH_OPACITY_TARGET,Math.max(this.initialOpacity,targetOpacity));
             this.color=`rgba(0, ${this.initialGreen}, 0, ${currentOpacity})`;
         } else {
             this.radius = this.initialRadius;
             currentSizeRatio = 1.0;
         }
         this.particleTimer++;
         if(this.particleTimer>=this.particleInterval&&particles.length<MAX_PARTICLES){
             particles.push(new Particle(this.x,this.y,{vx:this.vx,vy:this.vy},currentSizeRatio));
             this.particleTimer=0;
         }
         if((this.direction===1&&this.x>this.endX)||(this.direction===-1&&this.x<this.endX)){
             return this.handleOffscreen();
         }
         return false;
     }
     // Draws directly to the offscreen context
     draw(){
         if (!renderCtx) return;
         renderCtx.save();
         renderCtx.translate(this.x,this.y);
         renderCtx.rotate(this.rotation);
         // Pass offscreen context down to shape drawing functions
         switch(this.shapeType){
             case 0:drawCometShape0(renderCtx,this.radius,this.color);break;
             case 1:drawCometShape1(renderCtx,this.radius,this.color);break;
             case 2:drawCometShape2(renderCtx,this.radius,this.color);break;
             default:renderCtx.beginPath();renderCtx.arc(0,0,this.radius,0,Math.PI*2);renderCtx.fillStyle=this.color;renderCtx.fill();
         }
         renderCtx.restore();
     }
     handleOffscreen(){
         const index=comets.indexOf(this); if(index>-1){comets.splice(index,1);return true;}return false;
     }
 }
// --- Comet Shape Drawing Functions (Accept context) ---
function drawCometShape0(c,size,color){ const r=size/2;const p=7;const ir=0.3;c.fillStyle=color;const bP=[];for(let i=0;i<p;i++){const a=(Math.PI*2/p)*i;const rad=r*(1+(Math.random()-.5)*2*ir);bP.push({x:0+rad*Math.cos(a),y:0+rad*Math.sin(a)});}c.beginPath();c.moveTo(bP[0].x,bP[0].y);for(let i=0;i<p;i++){const p1=bP[i];const p2=bP[(i+1)%p];const cpX=(p1.x+p2.x)/2+(Math.random()-.5)*r*.4;const cpY=(p1.y+p2.y)/2+(Math.random()-.5)*r*.4;c.quadraticCurveTo(cpX,cpY,p2.x,p2.y);}c.closePath();c.fill();}
function drawCometShape1(c,size,color){ const r=size/2;const p=10;const ir=0.2;c.fillStyle=color;const bP=[];for(let i=0;i<p;i++){const a=(Math.PI*2/p)*i;const rad=r*(1+(Math.random()-.5)*2*ir);bP.push({x:0+rad*Math.cos(a),y:0+rad*Math.sin(a)});}c.beginPath();c.moveTo(bP[0].x,bP[0].y);for(let i=0;i<p;i++){const p1=bP[i];const p2=bP[(i+1)%p];const cpX=(p1.x+p2.x)/2+(Math.random()-.5)*r*.2;const cpY=(p1.y+p2.y)/2+(Math.random()-.5)*r*.2;c.quadraticCurveTo(cpX,cpY,p2.x,p2.y);}c.closePath();c.fill();}
function drawCometShape2(c,size,color){ const rX=size/1.5;const rY=size/2.5;const p=8;const ir=0.25;c.fillStyle=color;const bP=[];for(let i=0;i<p;i++){const a=(Math.PI*2/p)*i;const radX=rX*(1+(Math.random()-.5)*2*ir);const radY=rY*(1+(Math.random()-.5)*2*ir);bP.push({x:0+radX*Math.cos(a),y:0+radY*Math.sin(a)});}c.beginPath();c.moveTo(bP[0].x,bP[0].y);for(let i=0;i<p;i++){const p1=bP[i];const p2=bP[(i+1)%p];const cpX=(p1.x+p2.x)/2+(Math.random()-.5)*rX*.3;const cpY=(p1.y+p2.y)/2+(Math.random()-.5)*rY*.3;c.quadraticCurveTo(cpX,cpY,p2.x,p2.y);}c.closePath();c.fill();}

// --- Satellite Shape Drawing Functions (Accept context) ---
function drawSatelliteShape0(c,size){const bW=size*.5;const bH=size*.4;const pW=size*.6;const pH=size*.2;const aL=size*.4;c.fillStyle=panelGreen;c.fillRect(-bW/2-pW,-pH/2,pW,pH);c.fillRect(bW/2,-pH/2,pW,pH);c.fillStyle=bodyGreenDark;c.fillRect(-bW/2,-bH/2,bW,bH);c.strokeStyle=highlightGreenDark;c.lineWidth=1;c.strokeRect(-bW/2,-bH/2,bW,bH);c.strokeStyle=antennaGreenLight;c.lineWidth=1.5;c.beginPath();c.moveTo(0,-bH/2);c.lineTo(0,-bH/2-aL);c.stroke();c.fillStyle=highlightGreen;c.beginPath();c.arc(0,-bH/2-aL,size*.05,0,Math.PI*2);c.fill();}
function drawSatelliteShape1(c,size){const rL=size*.9;const rW=size*.1;const pW=size*.3;const pH=size*.7;c.fillStyle=antennaGreenLight;c.fillRect(-rL/2,-rW/2,rL,rW);c.fillStyle=panelGreen;c.fillRect(-pW/2,-pH/2,pW,pH);c.strokeStyle=highlightGreenDark;c.lineWidth=.5;for(let i=1;i<4;i++){c.beginPath();c.moveTo(-pW/2,-pH/2+(pH/4)*i);c.lineTo(pW/2,-pH/2+(pH/4)*i);c.stroke();}}
function drawSatelliteShape2(c,size){const bW=size*.4;const bH=size*.3;const dR=size*.4;const dOY=size*.1;c.fillStyle=bodyGreenDark;c.fillRect(-bW/2,-bH/2+dOY,bW,bH);c.strokeStyle=highlightGreenDark;c.lineWidth=1;c.strokeRect(-bW/2,-bH/2+dOY,bW,bH);c.fillStyle=panelGreen;c.strokeStyle=highlightGreenDark;c.beginPath();c.ellipse(0,-dOY*.5,dR,dR*.4,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle=bodyGreenDark;c.beginPath();c.arc(0,-dOY*.5,dR*.15,0,Math.PI*2);c.fill();}

// --- Satellite Class (Uses renderCtx directly) ---
class Satellite {
    constructor() { this.reset(); }
    reset() {
        if (!canvas) return;
        this.direction = Math.random() < 0.5 ? 1 : -1; this.startX = this.direction === 1 ? -ENTRY_EXIT_MARGIN : canvas.width + ENTRY_EXIT_MARGIN; this.endX = this.direction === 1 ? canvas.width + ENTRY_EXIT_MARGIN : -ENTRY_EXIT_MARGIN; this.x = this.startX; this.y = Math.random() * canvas.height * 0.8 + canvas.height * 0.1; this.vx = this.direction * (Math.random() * 1.0 + 0.5); this.vy = Math.random() * 0.5 - 0.25; this.shapeType = Math.floor(Math.random() * 3); this.baseSize = Math.random() * 12.5 + 22.5; this.isGrower = Math.random() < SAT_GROWER_CHANCE; this.currentSize = this.baseSize;
    }
    update() {
         if (!canvas) return false;
        this.x += this.vx; this.y += this.vy; if(this.isGrower){ const totalDist=Math.abs(this.endX-this.startX); let progress=Math.abs(this.x-this.startX)/totalDist; progress=Math.max(0,Math.min(1,progress)); const growthCurveValue=-4*progress*(progress-1); const sizeMultiplier=1+(SAT_GROWTH_FACTOR-1)*growthCurveValue; this.currentSize=this.baseSize*sizeMultiplier; } else { this.currentSize=this.baseSize; } if((this.direction === 1 && this.x > this.endX) || (this.direction === -1 && this.x < this.endX)){ return this.handleOffscreen(); } return false;
    }
    // Draws directly to the offscreen context
    draw() {
        if (!renderCtx) return;
        renderCtx.save();
        renderCtx.translate(this.x, this.y);
        renderCtx.rotate(Math.PI);
        // Pass offscreen context down
        switch(this.shapeType){
            case 0: drawSatelliteShape0(renderCtx, this.currentSize); break;
            case 1: drawSatelliteShape1(renderCtx, this.currentSize); break;
            case 2: drawSatelliteShape2(renderCtx, this.currentSize); break;
        }
        renderCtx.restore();
    }
     handleOffscreen() {
         const index = satellites.indexOf(this); if (index > -1) { satellites.splice(index, 1); return true; } return false;
    }
}

// --- Animation Loop Function ---
function animate() {
    // Ensure contexts are available
    if (!ctx || !renderCtx || !canvas || !renderCanvas) {
        console.error("Background Effect Error: Canvas or context not initialized before animate call.");
        animationFrameId = null; // Stop the loop if something is wrong
        return;
    }

    frameCount++;
    // Optional performance logging
    // if (frameCount % 300 === 0) { console.log(`--- Frame: ${frameCount} --- M: ${meteors.length}, C: ${comets.length}, P: ${particles.length}, S: ${satellites.length}`); }

    // --- Step 1: Render trails/fading onto OFFSCREEN canvas ---
    // REMOVED: renderCtx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);

    // Set composite mode to erase/fade existing content
    renderCtx.globalCompositeOperation = 'destination-out';
    renderCtx.fillStyle = RENDER_FADE_COLOR; // Color determines fade amount
    renderCtx.fillRect(0, 0, renderCanvas.width, renderCanvas.height);

    // IMPORTANT: Reset composite mode to default for drawing new objects
    renderCtx.globalCompositeOperation = 'source-over';

    // Draw current frame objects onto offscreen canvas
    for(let i=particles.length-1;i>=0;i--){if(particles[i].life>0){particles[i].draw();}}
    for(let i=meteors.length-1;i>=0;i--){if(meteors[i]){meteors[i].draw();}}
    for(let i=comets.length-1;i>=0;i--){if(comets[i]){comets[i].draw();}}
    for(let i=satellites.length-1;i>=0;i--){if(satellites[i]){satellites[i].draw();}}


    // --- Step 2: Update the VISIBLE canvas ---
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear visible canvas first
    ctx.drawImage(renderCanvas, 0, 0);                // Draw the offscreen result (with trails)

    // --- Step 3: Update Object States and Handle Spawning/Despawning ---
    if (Math.random() < METEOR_RATE && meteors.length < MAX_METEORS) { meteors.push(new Meteor()); }
    if (Math.random() < COMET_RATE && comets.length < MAX_COMETS) { comets.push(new Comet()); }
    if (Math.random() < SATELLITE_RATE && satellites.length < MAX_SATELLITES) { satellites.push(new Satellite()); }
    // Update and despawn particles
    for(let i=particles.length-1;i>=0;i--){particles[i].update();if(particles[i].life<=0){particles.splice(i,1);}}
    // Update meteors
    for(let i=meteors.length-1;i>=0;i--){if(meteors[i]){ meteors[i].update(); }}
    // Update comets
    for(let i=comets.length-1;i>=0;i--){if(comets[i]){ comets[i].update(); }}
    // Update satellites
    for(let i=satellites.length-1;i>=0;i--){if(satellites[i]){ satellites[i].update(); }}

    // Loop
    animationFrameId = requestAnimationFrame(animate); // Store the ID
}

// --- Exported Control Functions ---
export function startBackgroundEffect() {
    if (animationFrameId === null) { // Only start if not already running
        console.log("Starting Background Effect Animation Loop...");
        animate(); // Initial call to start the loop
    } else {
        console.log("Background Effect Animation Loop already running.");
    }
}

export function stopBackgroundEffect() {
    if (animationFrameId !== null) { // Only stop if running
        console.log("Stopping Background Effect Animation Loop...");
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
        // meteors = [];
        // comets = [];
        // particles = [];
        // satellites = [];
    } else {
         console.log("Background Effect Animation Loop already stopped.");
    }
}