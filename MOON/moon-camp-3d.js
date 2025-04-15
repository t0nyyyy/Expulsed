// --- START OF FILE moon-camp-3d.js ---

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

// --- Basic Scene Setup ---
let scene, camera, renderer;
let labelRenderer;
let webglContainer, labelContainer;
export let stationGroup; // Exported
let controls;

// --- Constants ---
const matrixGreen = 0x00ff00; // Original bright green (kept for potential details/highlights)
const baseStationColor = 0x008800; // Darker green base color
const baseStationOpacity = 0.85; // Base opacity

const commonHeight = 10;
const scaleFactor = 0.3;
const svgCenterX = 400;
const svgCenterY = 400;

// Main material using the new base color and opacity
const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: baseStationColor,
    wireframe: true,
    transparent: true,
    opacity: baseStationOpacity,
    side: THREE.DoubleSide
});

// Detail materials - kept separate in case needed elsewhere, but NOT used for LSS main parts now
const detailMaterialWireframe = new THREE.MeshBasicMaterial({ color: matrixGreen, wireframe: true, side: THREE.DoubleSide });
const detailMaterial2Wireframe = new THREE.MeshBasicMaterial({ color: matrixGreen, wireframe: true, side: THREE.DoubleSide });

const tubeRadius = 1.5;
const defaultOffsetStart = 0 * scaleFactor;
const defaultOffsetEnd = 0 * scaleFactor;
const labelOffsetFactor = 1.5;
const tubeYPosition = tubeRadius;
const harvestHubLifeSupport_Tube_X_Nudge = 10 * scaleFactor;
const panelBaseScale = 20;
const panelParams = { panelWidthRel: 1.8 * panelBaseScale, panelHeightRel: 1.2 * panelBaseScale, panelDepthRel: 0.1 * panelBaseScale, elementRadiusRel: 0.08 * panelBaseScale, elementSpacingRel: 0.3 * panelBaseScale, supportHeightRel: 1.2 * panelBaseScale, supportRadiusRel: 0.1 * panelBaseScale, panelTiltX: -Math.PI / 12 };
const pillboxReferenceSize = 1.0; const pillboxScaleMultiplier = 75; const pillboxSides = 8;
const pillboxRadiusRelative = pillboxReferenceSize * 0.8; const pillboxHeightRelative = pillboxReferenceSize * 0.4;
const pillboxFinalOffsetX = 0.00; const pillboxFinalOffsetY = -0.65; const pillboxFinalOffsetZ = 0.38;
const pillboxCentralSupportRadiusRel = pillboxReferenceSize * 0.12; const pillboxCentralSupportHeightRel = pillboxReferenceSize * 0.25;
const pillboxCentralBoxMountSizeRel = pillboxCentralSupportRadiusRel * 2.0; const pillboxCentralDishRadiusRel = pillboxReferenceSize * 0.5;
const pillboxCentralDishDepth = Math.PI / 5; const pillboxDefaultTubeTargetRelative = new THREE.Vector3(0, 0.2, -0.15);
const pillboxCornerAntennaHeightRel = pillboxReferenceSize * 1.0; const pillboxCornerAntennaBaseRadiusRel = pillboxReferenceSize * 0.03;
const pillboxCornerSupportRadiusRel = pillboxReferenceSize * 0.05; const pillboxCornerSupportHeightRel = pillboxReferenceSize * 0.1;
const pillboxCornerOffsetRel = pillboxRadiusRelative * 0.9; const pillboxCornerBoxMountSizeRel = pillboxCornerSupportRadiusRel * 2.5;
const pillboxRampHeightRel = pillboxHeightRelative * 0.4; const pillboxRampLengthRel = pillboxReferenceSize * 0.9;
const pillboxRampAttachWidthRel = pillboxRadiusRelative * 0.45; const pillboxRampBaseWidthRel = pillboxRampAttachWidthRel * 1.3;
const pillboxFinalRampOffsetRel = -0.5;
const storageHeight = commonHeight * 4;

// --- Data Definitions ---
const sectorData = [ { name: 'storage', type: 'RibbedCylinder', sizeParams: [50 * scaleFactor, storageHeight], cx: 250, cy: 250, rotY: 0, specificHeight: storageHeight, extentXZ: (50 * scaleFactor) * 1.15 }, { name: 'life-support-systems', type: 'CustomLSS_YagiDomes', sizeParams: [100 * scaleFactor, commonHeight, 60 * scaleFactor], cx: 500, cy: 280, rotY: 0, extentXZ: Math.max(100 * scaleFactor / 2, 60 * scaleFactor / 2), specificHeight: null }, { name: 'bunkhouse', type: 'Box', sizeParams: [150 * scaleFactor, commonHeight, 100 * scaleFactor], cx: 395, cy: 500, rotY: 0, extentXZ: Math.max(150 * scaleFactor / 2, 100 * scaleFactor / 2) }, { name: 'sickbay', type: 'LowPolySphereRing', sizeParams: [50 * scaleFactor], cx: 550, cy: 500, rotY: 0, extentXZ: (50 * scaleFactor) * 1.1, }, { name: 'harvest-hub', type: 'Pillbox', cx: 260, cy: 535, rotY: 0, extentXZ: (pillboxRadiusRelative * pillboxScaleMultiplier) * scaleFactor, rampFace: 3 }, { name: 'canteen', type: 'DomedCylinder', sizeParams: [50 * scaleFactor, commonHeight * 0.6], cx: 350, cy: 550, rotY: 0, extentXZ: 50 * scaleFactor }, { name: 'gravity-generator', type: 'Cylinder', sizeParams: [50 * scaleFactor, 50 * scaleFactor, commonHeight, 32], cx: 550, cy: 350, rotY: 0, extentXZ: 50 * scaleFactor }, ];
const connections = [ { start: 'storage', end: 'harvest-hub', offsetStart: -13 * scaleFactor, offsetEnd: -6 * scaleFactor }, { start: 'bunkhouse', end: 'sickbay', offsetStart: -4.5 * scaleFactor, offsetEnd: -5 * scaleFactor }, { start: 'bunkhouse', end: 'life-support-systems', offsetStart: -5 * scaleFactor, offsetEnd: -24 * scaleFactor, isStraightZTube: true }, ];
const commArrayLocations = [ { name: 'comm_array_1', cx: 300, cy: 350, rotationY: Math.PI / 0.5 }, { name: 'comm_array_2', cx: 350, cy: 350, rotationY: -Math.PI / 0.5 }, { name: 'comm_array_3', cx: 400, cy: 350, rotationY: Math.PI / 0.5 }, ];

// --- Initialization ---
export function init() {
    console.log("Attempting Three.js Init...");
    webglContainer = document.getElementById('three-canvas-container');
    labelContainer = document.getElementById('label-container');
    if (!webglContainer || !labelContainer) {
        console.error("3D container elements (#three-canvas-container or #label-container) not found!");
        return;
    }
    if (webglContainer.clientWidth === 0 || webglContainer.clientHeight === 0) {
        console.warn("3D container has zero size. Ensure CSS is loaded and element is visible.");
    }

    try {
        scene = new THREE.Scene();
        // scene.background = new THREE.Color(0x050505); // REMOVED for alpha

        const aspect = webglContainer.clientWidth / webglContainer.clientHeight;
        if (!aspect || aspect === Infinity || isNaN(aspect)) {
             console.warn("Calculated aspect ratio is invalid. Using default 1.");
        }
        camera = new THREE.PerspectiveCamera(75, aspect || 1, 0.1, 1000);
        camera.position.set(0, 110, 130);
        camera.lookAt(0, 0, 0);

        renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true // For transparent background
        });

        const renderWidth = webglContainer.clientWidth > 0 ? webglContainer.clientWidth : 300;
        const renderHeight = webglContainer.clientHeight > 0 ? webglContainer.clientHeight : 300;
        renderer.setSize(renderWidth, renderHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0); // Set clear alpha to 0

        webglContainer.appendChild(renderer.domElement);

        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(renderWidth, renderHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelContainer.appendChild(labelRenderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xcccccc, 1.0);
        scene.add(ambientLight);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 30;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI / 1.8;

        stationGroup = new THREE.Group();
        scene.add(stationGroup);

        createStationLayout(stationGroup);
        createConnectingTubes(stationGroup);
        createCommArrays(stationGroup);

        window.addEventListener('resize', onWindowResize);
        console.log("Three.js Init successful.");
    } catch (error) {
        console.error("Error during Three.js Initialization:", error);
    }
}

// --- Geometry/Mesh Creation Functions ---
// Functions clone the materials passed to them internally.

function createDomedCylinderGroup(radius, cylHeight, segments, material) {
    const group = new THREE.Group();
    const cylGeom = new THREE.CylinderGeometry(radius, radius, cylHeight, segments);
    const domeGeom = new THREE.SphereGeometry(radius, segments, Math.max(8, segments / 2), 0, Math.PI * 2, 0, Math.PI / 2);
    const cylMesh = new THREE.Mesh(cylGeom, material.clone());
    cylMesh.position.y = cylHeight / 2;
    const domeMesh = new THREE.Mesh(domeGeom, material.clone());
    domeMesh.position.y = cylHeight;
    group.add(cylMesh); group.add(domeMesh);
    group.userData = { totalHeight: cylHeight + radius, baseOffset: 0 };
    return group;
}

function createRibbedCylinderGroup(radius, height, segments, ribCount, material) {
    const group = new THREE.Group();
    const cylGeom = new THREE.CylinderGeometry(radius, radius, height, segments);
    const cylMesh = new THREE.Mesh(cylGeom, material.clone());
    cylMesh.position.y = height / 2;
    group.add(cylMesh);
    const ribWidth = radius * 0.1; const ribDepth = radius * 0.15;
    const outerRadius = radius + ribDepth / 2;
    for (let i = 0; i < ribCount; i++) {
        const angle = (Math.PI * 2 / ribCount) * i;
        const ribGeom = new THREE.BoxGeometry(ribWidth, height, ribDepth);
        const rib = new THREE.Mesh(ribGeom, material.clone()); // Clone for each rib
        rib.position.x = Math.cos(angle) * outerRadius;
        rib.position.z = Math.sin(angle) * outerRadius;
        rib.position.y = height / 2;
        rib.lookAt(0, height / 2, 0);
        group.add(rib);
    }
    group.userData = { totalHeight: height, baseOffset: 0 };
    return group;
}

function createLowPolySphereModule(sphereRadius, material) {
    const group = new THREE.Group();
    const lowPolySegments = 8; const ringSegments = 24;
    const sphereGeom = new THREE.SphereGeometry(sphereRadius, lowPolySegments, Math.max(4, lowPolySegments / 2), 0, Math.PI * 2, 0, Math.PI / 2);
    const sphereMesh = new THREE.Mesh(sphereGeom, material.clone());
    group.add(sphereMesh);
    const ringRadius = sphereRadius * 1.1; const ringTube = sphereRadius * 0.1;
    const ringGeom = new THREE.TorusGeometry(ringRadius, ringTube, 8, ringSegments);
    const ringMesh = new THREE.Mesh(ringGeom, material.clone());
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);
    group.userData = { totalHeight: sphereRadius, baseOffset: 0 };
    return group;
}

function createDishGeometry(r, s, d) { s=Math.max(3,s); const hS=Math.max(2,Math.floor(s/2)); return new THREE.SphereGeometry(r,s,hS,0,Math.PI*2,0,d); }
function createAntennaGeometry(h, r, s=6) { s=Math.max(3,s); return new THREE.CylinderGeometry(r*0.9,r,h,s); }
function createBoxMountGeometry(s) { const sf=Math.max(0.01,s); return new THREE.BoxGeometry(sf,sf*0.5,sf); }
function createTubeFromCurve(c, tS=16, r=0.03, rS=6) { tS=Math.max(1,tS); rS=Math.max(3,rS); return new THREE.TubeGeometry(c,tS,r,rS,false); }
function createWedgeRampGeometry(l, h, aW, bW) { const p=[]; p.push(new THREE.Vector3(0,h/2,-aW/2)); p.push(new THREE.Vector3(0,h/2,aW/2)); p.push(new THREE.Vector3(l,-h/2,-bW/2)); p.push(new THREE.Vector3(l,-h/2,bW/2)); p.push(new THREE.Vector3(0,-h/2,-aW/2)); p.push(new THREE.Vector3(0,-h/2,aW/2)); return new ConvexGeometry(p); }
function positionAndRotateRamp(o, sI, pR, rH, oO) { const a=(sI+0.5)*(Math.PI*2/pillboxSides); const tX=pR*Math.cos(a); const tY=rH/2; const tZ=pR*Math.sin(a); const ofX=oO*Math.cos(a); const ofZ=oO*Math.sin(a); o.position.set(tX+ofX,tY,tZ+ofZ); o.rotation.y=-a; }
function createSupportGeometry(height, radius, segments = 8) { segments = Math.max(3, segments); return new THREE.CylinderGeometry(radius, radius, height, segments); }

function createArrayPanel(w, h, d, eR, eS) {
    const pG=new THREE.Group();
    const pM=new THREE.Mesh(new THREE.BoxGeometry(w,h,d)); // Base mesh
    pM.position.y=h/2; pG.add(pM);
    const sX=-w/2+eS/2; const sY=h-eS/2; const sZ=d/2+eR;
    let cX=sX; let cY=sY;
    const eG=new THREE.SphereGeometry(eR,4,2); // Element geometry
    while(cY>=eS/2){
        while(cX<=w/2-eS/2){
            const eM=new THREE.Mesh(eG); // Element mesh
            eM.position.set(cX,cY,sZ); pG.add(eM); cX+=eS;
        } cX=sX; cY-=eS;
    }
    return pG; // Materials assigned in createPhasedArrayPanel
}

function createBox(w, h, d, material) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, material.clone());
    m.position.y = h / 2;
    return m;
}

function createCylinder(rT, rB, h, s, material) {
    const g = new THREE.CylinderGeometry(rT, rB, h, s);
    const m = new THREE.Mesh(g, material.clone());
    m.position.y = h / 2;
    return m;
}

function createDome(r, s, material) {
    const g = new THREE.SphereGeometry(r, s, Math.max(4, s / 2), 0, Math.PI * 2, 0, Math.PI / 2);
    const m = new THREE.Mesh(g, material.clone()); // Clone material passed in
    return m;
}

function createYagiAntenna(localMaterial, localScale) {
    // Clones the localMaterial passed in for each part
    const boomLength = 2.5 * localScale; const boomRadius = 0.05 * localScale;
    const elementLength = 0.8 * localScale; const elementRadius = 0.03 * localScale;
    const numElements = 5; const reflectorLength = 0.9 * localScale;
    const yagiGroup = new THREE.Group();
    const boomMesh = new THREE.Mesh(new THREE.CylinderGeometry(boomRadius, boomRadius, boomLength, 8), localMaterial.clone());
    boomMesh.rotation.x = Math.PI / 2; yagiGroup.add(boomMesh);
    const elementSpacing = boomLength / (numElements + 1);
    const elementGeom = new THREE.CylinderGeometry(elementRadius, elementRadius, elementLength, 6);
    const reflectorMesh = new THREE.Mesh(new THREE.CylinderGeometry(elementRadius, elementRadius, reflectorLength, 6), localMaterial.clone());
    reflectorMesh.rotation.z = Math.PI / 2; reflectorMesh.position.x = -boomLength / 2; yagiGroup.add(reflectorMesh);
    for (let i = 0; i < numElements; i++) {
        const elementMesh = new THREE.Mesh(elementGeom, localMaterial.clone());
        elementMesh.rotation.z = Math.PI / 2; elementMesh.position.x = -boomLength / 2 + elementSpacing * (i + 1); yagiGroup.add(elementMesh);
    }
    const supportHeight = boomLength * 0.6; const supportRadius = boomRadius * 1.2;
    const supportGeom = createSupportGeometry(supportHeight, supportRadius);
    const supportMesh = new THREE.Mesh(supportGeom, localMaterial.clone());
    supportMesh.position.y = -(supportHeight / 2) - boomRadius*2; yagiGroup.add(supportMesh);
    const box = new THREE.Box3().setFromObject(yagiGroup); let baseOffsetY = 0;
    if (!box.isEmpty()) { baseOffsetY = -box.min.y; yagiGroup.userData = { baseOffset: baseOffsetY }; } else { yagiGroup.userData = { baseOffset: 0}; }
    return yagiGroup;
}

function createPillboxModuleGroup(material, globalScaleFactor, rampFaceIndex) {
    // Clones the main material internally
    const moduleGroup = new THREE.Group(); moduleGroup.name = "PillboxModuleScaled";
    const finalScale = pillboxScaleMultiplier * globalScaleFactor;
    const pRad = pillboxRadiusRelative * finalScale; const pHgt = pillboxHeightRelative * finalScale;
    const csRad = pillboxCentralSupportRadiusRel * finalScale; const csHgt = pillboxCentralSupportHeightRel * finalScale;
    const cmbSize = pillboxCentralBoxMountSizeRel * finalScale; const cdRad = pillboxCentralDishRadiusRel * finalScale;
    const caHgt = pillboxCornerAntennaHeightRel * finalScale; const cabRad = pillboxCornerAntennaBaseRadiusRel * finalScale;
    const corSupRad = pillboxCornerSupportRadiusRel * finalScale; const corSupHgt = pillboxCornerSupportHeightRel * finalScale;
    const corOff = pillboxCornerOffsetRel * finalScale; const corBmSize = pillboxCornerBoxMountSizeRel * finalScale;
    const rHgt = pillboxRampHeightRel * finalScale; const rLen = pillboxRampLengthRel * finalScale;
    const rAttW = pillboxRampAttachWidthRel * finalScale; const rBasW = pillboxRampBaseWidthRel * finalScale;
    const rOff = pillboxFinalRampOffsetRel * finalScale; const dishOffX = pillboxFinalOffsetX * finalScale;
    const dishOffY = pillboxFinalOffsetY * finalScale; const dishOffZ = pillboxFinalOffsetZ * finalScale;
    const tubeTgt = pillboxDefaultTubeTargetRelative.clone().multiplyScalar(finalScale);

    const pillboxGeom = new THREE.CylinderGeometry(pRad, pRad, pHgt, pillboxSides);
    const pillboxMesh = new THREE.Mesh(pillboxGeom, material.clone());
    pillboxMesh.position.y = pHgt / 2; moduleGroup.add(pillboxMesh);
    const cornerBoxMountGeom = createBoxMountGeometry(corBmSize);
    const cornerBoxMountHeight = cornerBoxMountGeom.parameters.height;
    for (let i = 0; i < 2; i++) {
        const angle = Math.PI / 4 + i * Math.PI; const x = Math.cos(angle) * corOff; const z = Math.sin(angle) * corOff;
        const supG = createSupportGeometry(corSupHgt, corSupRad); const supM = new THREE.Mesh(supG, material.clone());
        supM.position.set(x, pHgt + corSupHgt / 2, z); moduleGroup.add(supM);
        const connM = new THREE.Mesh(cornerBoxMountGeom, material.clone());
        connM.position.set(x, pHgt + corSupHgt + cornerBoxMountHeight / 2, z); moduleGroup.add(connM);
        const antG = createAntennaGeometry(caHgt, cabRad); const antM = new THREE.Mesh(antG, material.clone());
        const antennaBaseY = pHgt + corSupHgt + cornerBoxMountHeight; antM.position.set(x, antennaBaseY + caHgt / 2, z); moduleGroup.add(antM);
    }
    const centralSupG = createSupportGeometry(csHgt, csRad); const centralSupM = new THREE.Mesh(centralSupG, material.clone());
    centralSupM.position.y = pHgt + csHgt / 2; moduleGroup.add(centralSupM);
    const centralBoxMountGeom = createBoxMountGeometry(cmbSize); const centralBoxMountHeight = centralBoxMountGeom.parameters.height;
    const centralBoxMountMesh = new THREE.Mesh(centralBoxMountGeom, material.clone());
    const boxMountBaseY = pHgt + csHgt; centralBoxMountMesh.position.y = boxMountBaseY + centralBoxMountHeight / 2; moduleGroup.add(centralBoxMountMesh);
    const mountTopCenter = new THREE.Vector3(0, boxMountBaseY + centralBoxMountHeight, 0);
    const fixedTubeEndPoint = mountTopCenter.clone().add(tubeTgt);
    const fixedMidPoint = mountTopCenter.clone().lerp(fixedTubeEndPoint, 0.5).add(new THREE.Vector3(0, 0.15 * finalScale, -0.1 * finalScale));
    const fixedCurve = new THREE.CatmullRomCurve3([mountTopCenter.clone(), fixedMidPoint, fixedTubeEndPoint.clone()]);
    const fixedTubeGeom = createTubeFromCurve(fixedCurve, 16, 0.03 * finalScale, 6);
    const fixedTubeMesh = new THREE.Mesh(fixedTubeGeom, material.clone());
    moduleGroup.add(fixedTubeMesh);
    const finalDishPosition = fixedTubeEndPoint.clone().add(new THREE.Vector3(dishOffX, dishOffY, dishOffZ));
    const dishGeom = createDishGeometry(cdRad, 12, pillboxCentralDishDepth);
    const centralDishMesh = new THREE.Mesh(dishGeom, material.clone());
    const dishPivotOffsetY = cdRad * Math.cos(pillboxCentralDishDepth); centralDishMesh.position.copy(finalDishPosition); centralDishMesh.position.y += dishPivotOffsetY; centralDishMesh.rotation.x = -Math.PI / 2 + pillboxCentralDishDepth; moduleGroup.add(centralDishMesh);
    const rampGeom = createWedgeRampGeometry(rLen, rHgt, rAttW, rBasW);
    const rampMesh = new THREE.Mesh(rampGeom, material.clone());
    rampMesh.name = "RampMeshGeometry"; const rampPivotGroup = new THREE.Group(); rampPivotGroup.name = "RampPivotPoint"; rampPivotGroup.add(rampMesh); rampMesh.position.x = rLen / 2;
    positionAndRotateRamp(rampPivotGroup, rampFaceIndex, pRad, rHgt, rOff); moduleGroup.add(rampPivotGroup);
    const box = new THREE.Box3().setFromObject(moduleGroup);
    if (!box.isEmpty()) { moduleGroup.position.y -= box.min.y; moduleGroup.userData = { totalHeight: box.max.y - box.min.y, baseOffset: -box.min.y }; } else { console.warn("Pillbox bounding box empty."); moduleGroup.userData = { totalHeight: pHgt * 1.5, baseOffset: 0 }; }
    return moduleGroup;
}

function createPhasedArrayPanel(material, globalScaleFactor) {
    // Clones the main material internally
    const group = new THREE.Group(); const scale = globalScaleFactor;
    const pWidth = panelParams.panelWidthRel * scale; const pHeight = panelParams.panelHeightRel * scale; const pDepth = panelParams.panelDepthRel * scale;
    const elRadius = panelParams.elementRadiusRel * scale; const elSpacing = panelParams.elementSpacingRel * scale;
    const sHeight = panelParams.supportHeightRel * scale; const sRadius = panelParams.supportRadiusRel * scale;
    const support = new THREE.Mesh(createSupportGeometry(sHeight, sRadius), material.clone());
    support.position.y = sHeight / 2; group.add(support);
    const panel = createArrayPanel(pWidth, pHeight, pDepth, elRadius, elSpacing);
    panel.traverse((child) => { if (child.isMesh) { child.material = material.clone(); } }); // Clone for panel parts
    panel.position.y = sHeight; panel.rotation.x = panelParams.panelTiltX; group.add(panel);
    group.updateMatrixWorld(); const finalBBox = new THREE.Box3().setFromObject(group);
    if (!finalBBox.isEmpty()) { group.userData = { totalHeight: finalBBox.max.y - finalBBox.min.y, baseOffset: -finalBBox.min.y }; } else { group.userData = { totalHeight: sHeight + pHeight, baseOffset: 0 }; console.warn("Phased Array Panel bounding box empty."); }
    return group;
}

// *** CORRECTED createLifeSupportModule_YagiSideDomes ***
function createLifeSupportModule_YagiSideDomes(baseWidth, baseHeight, baseDepth, material) {
    // Receives main wireframeMaterial (baseStationColor/Opacity)
    const group = new THREE.Group();
    const baseBox = createBox(baseWidth, baseHeight, baseDepth, material.clone()); // Clone base material
    group.add(baseBox);

    const yagiScaleModified = (baseHeight * 0.4) * 2;
    // Pass the main 'material' to createYagiAntenna (it will clone internally)
    const yagi = createYagiAntenna(material, yagiScaleModified); // **** FIX HERE ****
    yagi.position.set(-baseWidth * 0.3, baseHeight + (yagi.userData.baseOffset || 0), 0);
    yagi.rotation.y = Math.PI / 2;
    group.add(yagi);

    const domeRadius = baseHeight * 0.2;
    const domeY = baseHeight;
    // Pass the main 'material' to createDome (it will clone internally)
    const dome1 = createDome(domeRadius, 8, material); // **** FIX HERE ****
    dome1.position.set(baseWidth*0.1, domeY, -baseDepth*0.3); group.add(dome1);
    const dome2 = createDome(domeRadius, 8, material); // **** FIX HERE ****
    dome2.position.set(baseWidth*0.1, domeY, 0); group.add(dome2);
    const dome3 = createDome(domeRadius, 8, material); // **** FIX HERE ****
    dome3.position.set(baseWidth*0.1, domeY, baseDepth*0.3); group.add(dome3);

    group.updateMatrixWorld(); const box = new THREE.Box3().setFromObject(group);
    if (!box.isEmpty()) { group.userData = { totalHeight: box.max.y - box.min.y, baseOffset: -box.min.y }; } else { console.warn("LSS Module bounding box empty."); group.userData = { totalHeight: baseHeight * 2, baseOffset: 0 }; }
    return group;
}
// *** END OF CORRECTION ***

function createStationLayout(group) {
    // Uses the global 'wireframeMaterial' (baseStationColor/Opacity)
    sectorData.forEach(data => {
        let meshOrGroup; let moduleHeight;
        if (data.name === 'life-support-systems') {
            const [lssWidth, lssHeight, lssDepth] = data.sizeParams;
            meshOrGroup = createLifeSupportModule_YagiSideDomes(lssWidth, lssHeight, lssDepth, wireframeMaterial); // Passes main material
            moduleHeight = meshOrGroup.userData?.totalHeight || lssHeight * 2; data.specificHeight = moduleHeight;
        } else if (data.name === 'canteen') {
            const [radius, cylHeight] = data.sizeParams;
            meshOrGroup = createDomedCylinderGroup(radius, cylHeight, 16, wireframeMaterial);
            moduleHeight = meshOrGroup.userData.totalHeight;
        } else if (data.name === 'storage') {
            const [radius, height] = data.sizeParams;
            meshOrGroup = createRibbedCylinderGroup(radius, height, 16, 8, wireframeMaterial);
            moduleHeight = meshOrGroup.userData.totalHeight;
        } else if (data.name === 'sickbay') {
            const [radius] = data.sizeParams;
            meshOrGroup = createLowPolySphereModule(radius, wireframeMaterial);
            moduleHeight = meshOrGroup.userData.totalHeight;
        } else if (data.type === 'Pillbox') {
            meshOrGroup = createPillboxModuleGroup(wireframeMaterial, scaleFactor, data.rampFace);
            moduleHeight = meshOrGroup.userData.totalHeight;
        } else if (data.type === 'Box') {
            const [width, height, depth] = data.sizeParams;
            meshOrGroup = createBox(width, height, depth, wireframeMaterial);
            moduleHeight = height;
        } else if (data.type === 'Cylinder') {
             const [radiusTop, radiusBottom, height, radialSegments] = data.sizeParams;
             meshOrGroup = createCylinder(radiusTop, radiusBottom, height, radialSegments || 32, wireframeMaterial);
             moduleHeight = height;
        } else { console.warn(`Unknown module type: ${data.name} (${data.type})`); return; }

        if (meshOrGroup) {
            meshOrGroup.position.x = (data.cx - svgCenterX) * scaleFactor;
            meshOrGroup.position.z = (data.cy - svgCenterY) * scaleFactor;
            meshOrGroup.rotation.y = data.rotY; meshOrGroup.name = data.name;
            if (!meshOrGroup.userData) meshOrGroup.userData = {};
            meshOrGroup.userData.sector = data.name; meshOrGroup.userData.totalHeight = moduleHeight;
            group.add(meshOrGroup);
        }
    });
}

function createConnectingTubes(group) {
    // Uses base color/opacity material, cloned internally
    const tubeMaterial = new THREE.MeshBasicMaterial({ color: baseStationColor, wireframe: true, transparent: true, opacity: baseStationOpacity });
    const getSectorData = (n) => sectorData.find(data => data.name === n) || console.error(`!!! Sector data not found: ${n}`);

    connections.forEach(conn => {
        const dS = getSectorData(conn.start); const dE = getSectorData(conn.end);
        if (dS && dE) {
            const cS = new THREE.Vector3((dS.cx - svgCenterX) * scaleFactor, tubeYPosition, (dS.cy - svgCenterY) * scaleFactor);
            const cE = new THREE.Vector3((dE.cx - svgCenterX) * scaleFactor, tubeYPosition, (dE.cy - svgCenterY) * scaleFactor);
            const eS = dS.extentXZ; const eE = dE.extentXZ;
            const oS = conn.offsetStart !== undefined ? conn.offsetStart : defaultOffsetStart;
            const oE = conn.offsetEnd !== undefined ? conn.offsetEnd : defaultOffsetEnd;
            let fS3D, fE3D;
            if (conn.isStraightZTube === true) {
                let sD, eD;
                if (dS.type === 'Box') sD = dS.sizeParams[2]; else if (dS.type === 'Pillbox') sD = (pillboxRadiusRelative * 2 * pillboxScaleMultiplier) * scaleFactor; else sD = dS.extentXZ * 2;
                if (dE.type === 'Box') eD = dE.sizeParams[2]; else if (dE.type === 'Pillbox') eD = (pillboxRadiusRelative * 2 * pillboxScaleMultiplier) * scaleFactor; else eD = dE.extentXZ * 2;
                if (sD && eD) {
                    const mX = (cS.x + cE.x) / 2; const fTX = mX + harvestHubLifeSupport_Tube_X_Nudge;
                    const sZOff = (cS.z < cE.z) ? (sD / 2) + tubeRadius : -(sD / 2) - tubeRadius; const eZOff = (cE.z < cS.z) ? (eD / 2) + tubeRadius : -(eD / 2) - tubeRadius;
                    const bSS = new THREE.Vector3(fTX, tubeYPosition, cS.z + sZOff); const bSE = new THREE.Vector3(fTX, tubeYPosition, cE.z + eZOff);
                    const sDir = new THREE.Vector3().subVectors(bSE, bSS).normalize();
                    fS3D = bSS.clone().addScaledVector(sDir, oS); fE3D = bSE.clone().addScaledVector(sDir, -oE);
                } else { console.error(`Missing dims for straight tube: ${conn.start}<->${conn.end}`); fS3D = null; fE3D = null; }
            } else {
                const dXZ = new THREE.Vector2(cE.x - cS.x, cE.z - cS.z).normalize(); if (dXZ.lengthSq() < 1e-4) { dXZ.set(1, 0); }
                const bOS = eS + tubeRadius; const bOE = eE + tubeRadius;
                const bCSX = cS.x + dXZ.x * bOS; const bCSZ = cS.z + dXZ.y * bOS;
                const bCEX = cE.x - dXZ.x * bOE; const bCEZ = cE.z - dXZ.y * bOE;
                const bCS3D = new THREE.Vector3(bCSX, tubeYPosition, bCSZ); const bCE3D = new THREE.Vector3(bCEX, tubeYPosition, bCEZ);
                const tDir = new THREE.Vector3().subVectors(bCE3D, bCS3D).normalize(); if (tDir.lengthSq() < 1e-4) { tDir.set(0, 0, 1); }
                fS3D = bCS3D.clone().addScaledVector(tDir, oS); fE3D = bCE3D.clone().addScaledVector(tDir, -oE);
            }
            if (fS3D && fE3D) {
                const tubeMesh = createTubeMesh(fS3D, fE3D, tubeRadius, tubeMaterial);
                if (tubeMesh) { tubeMesh.name = `tube_${conn.start}_${conn.end}`; group.add(tubeMesh); }
            } else { console.warn(`Could not calc points for tube ${conn.start}<->${conn.end}`); }
        }
    });
}

function createTubeMesh(p1, p2, r, m) {
    const v = new THREE.Vector3().subVectors(p2, p1); const l = v.length();
    if (l <= 0.1) { console.warn(`Tube points too close`); return null; }
    const g = new THREE.CylinderGeometry(r, r, l, 12, 1, false);
    const mesh = new THREE.Mesh(g, m.clone()); // Clone tube material
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5); mesh.position.copy(mid);
    const yAxis = new THREE.Vector3(0, 1, 0); v.normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, v); mesh.quaternion.copy(quaternion);
    return mesh;
}

function createCommArrays(group) {
    // Uses base color/opacity material, cloned internally
    const commMaterial = new THREE.MeshBasicMaterial({ color: baseStationColor, wireframe: true, transparent: true, opacity: baseStationOpacity });
    commArrayLocations.forEach((loc, index) => {
        const panelGroup = createPhasedArrayPanel(commMaterial, scaleFactor);
        panelGroup.position.x = (loc.cx - svgCenterX) * scaleFactor;
        panelGroup.position.z = (loc.cy - svgCenterY) * scaleFactor;
        panelGroup.rotation.y = loc.rotationY || 0;
        panelGroup.name = loc.name || `comm_array_${index + 1}`;
        group.add(panelGroup);
    });
}

// --- Resize Handling ---
function onWindowResize() {
    if (!webglContainer || !labelContainer || !camera || !renderer || !labelRenderer) return;
    const width = webglContainer.clientWidth; const height = webglContainer.clientHeight;
    if (width === 0 || height === 0) { console.warn("Resize zero size."); return; }
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.setSize(width, height); labelRenderer.setSize(width, height);
}

// --- Animation Loop ---
export function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
    if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
}

// --- Function for Rotation ---
export function setStationRotation(angleDegrees) {
    if (stationGroup) {
        stationGroup.rotation.y = THREE.MathUtils.degToRad(angleDegrees);
    }
}

// +++ Highlight Functions (Handles Base Opacity/Transparency) +++
const originalMaterials = new Map();
const highlightedSectors = new Set();

function changeMeshMaterialColor(mesh, highlightColor, isHighlighting) {
    if (!mesh || !mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    materials.forEach((material, index) => {
        if (!material.color || typeof material.color.setHex !== 'function' || typeof material.color.getHex !== 'function') return;
        const materialKey = `${mesh.uuid}-${index}`;

        if (isHighlighting && highlightColor) {
            if (!originalMaterials.has(materialKey)) {
                try {
                    originalMaterials.set(materialKey, {
                        colorHex: material.color.getHex(),
                        opacity: material.opacity,
                        transparent: material.transparent
                    });
                } catch (e) { console.error("Error getting original props:", e, material); return; }
            }
            try {
                material.color.set(highlightColor);
                material.transparent = false; // Highlights are opaque
                material.opacity = 1.0;
            } catch (e) { console.error("Error setting highlight props:", e, material, highlightColor); }
        } else { // Restore original
            if (originalMaterials.has(materialKey)) {
                const originalProps = originalMaterials.get(materialKey);
                try {
                    material.color.setHex(originalProps.colorHex);
                    material.transparent = originalProps.transparent; // Restore transparency flag
                    material.opacity = originalProps.opacity; // Restore opacity value
                } catch (e) {
                    console.error("Error restoring original props:", e, material, originalProps);
                    try { // Fallback
                        material.color.setHex(baseStationColor);
                        material.transparent = true;
                        material.opacity = baseStationOpacity;
                    } catch (e2) {}
                } finally {
                    originalMaterials.delete(materialKey);
                }
            } else { // Fallback if original not found
                try {
                    material.color.setHex(baseStationColor);
                    material.transparent = true;
                    material.opacity = baseStationOpacity;
                } catch (e) { console.error("Error setting fallback props:", e, material); }
            }
        }
        material.needsUpdate = true;
    });
}

export function highlightSector(sectorName, hexColorString) {
    if (!stationGroup || !hexColorString) return;
    const sectorObject = stationGroup.getObjectByName(sectorName);
    if (!sectorObject) { console.warn(`Highlight: Sector object not found: ${sectorName}`); return; }
    if (highlightedSectors.has(sectorName)) return;
    console.log(`Highlighting ${sectorName} with ${hexColorString}`);
    let highlightColor;
    try { highlightColor = new THREE.Color(hexColorString); } catch (e) { console.error(`Invalid color: ${hexColorString}`, e); return; }
    sectorObject.traverse((node) => { if (node.isMesh) { changeMeshMaterialColor(node, highlightColor, true); } });
    highlightedSectors.add(sectorName);
}

export function unhighlightSector(sectorName) {
    if (!stationGroup || !highlightedSectors.has(sectorName)) return;
    const sectorObject = stationGroup.getObjectByName(sectorName);
    console.log(`Unhighlighting ${sectorName}`);
    if (!sectorObject) { console.warn(`Unhighlight: Sector object not found: ${sectorName}.`); highlightedSectors.delete(sectorName); return; }
    sectorObject.traverse((node) => { if (node.isMesh) { changeMeshMaterialColor(node, null, false); } });
    highlightedSectors.delete(sectorName);
}

export function unhighlightAllSectors() {
    const sectorsToUnhighlight = [...highlightedSectors];
    sectorsToUnhighlight.forEach(sectorName => { unhighlightSector(sectorName); });
    if (highlightedSectors.size > 0) { console.warn("highlightedSectors not empty after clear."); highlightedSectors.clear(); }
}

// --- END OF FILE moon-camp-3d.js ---