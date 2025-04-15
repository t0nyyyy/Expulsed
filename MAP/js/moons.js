window.setupMoons = async function() {
    const moonNames = {
        "Earth": ["Earth's Moon"],
        "Mars": ["Phobos", "Deimos"],
        "Jupiter": ["Io", "Europa", "Ganymede", "Callisto"],
        "Saturn": ["Mimas", "Enceladus", "Titan", "Rhea"],
    };

    planetMeshes.forEach(planet => {
        const moons = [];
        const planetName = planet.mesh.userData.planet.name;
        const availableMoonNames = moonNames[planetName] || [];
        const planetData = planet.mesh.userData.planet || { moonCount: 0 };
        for (let i = 0; i < planetData.moonCount; i++) {
            const moonSize = (0.15 + Math.random() * 0.15) * 0.75;
            const moonDistance = planet.mesh.geometry.parameters.radius * 2 + i * 0.5 * 0.75;
            const moonGeometry = new THREE.SphereGeometry(moonSize, 8, 8);
            
            // Simple wireframe material (no shader needed for outposts)
            const moonMaterial = new THREE.MeshBasicMaterial({
                color: 0x00ff44, // Green
                wireframe: true
            });
            
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.userData = {
                isMoon: true,
                name: availableMoonNames[i] || `Moon_${planetName}_${i + 1}`,
                outpostCount: 0,
                outpostData: []
            };
            const moonPivot = new THREE.Object3D();
            planet.mesh.add(moonPivot);
            moon.position.x = moonDistance;
            moonPivot.add(moon);
            moonPivot.rotation.y = Math.random() * Math.PI * 2;
            moonPivot.rotation.z = Math.random() * 0.5;
            moons.push({ pivot: moonPivot, mesh: moon, speed: 0.02 + Math.random() * 0.02 });
        }
        planet.mesh.userData.moons = moons;
    });
};