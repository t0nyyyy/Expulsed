let scene, camera, renderer, labelRenderer, planetMeshes = [];
let previewScene, previewCamera, previewRenderer;
let clock; // Add a THREE.Clock instance

async function init() {
    // Initialize the clock
    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('mapCanvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);

    const previewContainer = document.querySelector('.preview-container');
    const previewWidth = previewContainer.clientWidth;
    const previewHeight = previewContainer.clientHeight;
    previewRenderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('previewCanvas') });
    previewRenderer.setSize(previewWidth, previewHeight);
    previewScene = new THREE.Scene();
    previewCamera = new THREE.PerspectiveCamera(75, previewWidth / previewHeight, 0.1, 1000);
    previewCamera.position.set(0, 5, 10);
    previewCamera.lookAt(0, 0, 0);

    const previewLight = new THREE.DirectionalLight(0xffffff, 1);
    previewLight.position.set(5, 5, 5);
    previewScene.add(previewLight);
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    previewScene.add(ambientLight);

    await window.setupScene();
    await window.setupPlanets();
    await window.setupMoons();
    await window.setupStations();
    await window.setupOutposts();
    await window.setupBackground();
    await window.setupUI();
    animate();
}

document.addEventListener('DOMContentLoaded', () => {
    init();
});