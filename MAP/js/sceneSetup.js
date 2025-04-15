window.setupScene = async function() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    // Create solarSystemCenter here so we can add the Sun to it
    window.solarSystemCenter = new THREE.Object3D();
    scene.add(window.solarSystemCenter);

    // Sun
    const sunGeometry = new THREE.SphereGeometry(5 * 0.75, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
    window.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    window.solarSystemCenter.add(window.sun); // Add Sun to solarSystemCenter instead of scene

    const sunGlowGeometry = new THREE.SphereGeometry(5.5 * 0.75, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.2 });
    window.sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    window.sun.add(window.sunGlow);

    window.flares = [];
    for (let i = 0; i < 3; i++) {
        const flareGeometry = new THREE.PlaneGeometry(10 * 0.75, 0.5 * 0.75);
        const flareMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const flare = new THREE.Mesh(flareGeometry, flareMaterial);
        flare.position.set(0, 0, 0);
        flare.rotation.z = (i * 2 * Math.PI) / 3;
        window.sun.add(flare);
        window.flares.push({ mesh: flare, speed: 0.01, initialRotation: flare.rotation.z });
    }
};