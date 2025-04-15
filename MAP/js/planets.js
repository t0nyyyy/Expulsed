window.setupPlanets = async function() {
    const planets = [
        { name: 'Mercury', radius: 0.4 * 0.75, distance: 10 * 0.75, speed: 0.04, intensity: 0.7, wireSegments: 6, moonCount: 0, rotationSpeed: 0.006 },
        { name: 'Venus', radius: 0.9 * 0.75, distance: 15 * 0.75 + 2.5, speed: 0.015, intensity: 0.5, wireSegments: 8, moonCount: 0, rotationSpeed: 0.004 },
        { name: 'Earth', radius: 1 * 0.75, distance: 20 * 0.75 + 5, speed: 0.01, intensity: 0.9, wireSegments: 10, moonCount: 1, rotationSpeed: 0.005 },
        { name: 'Mars', radius: 0.5 * 0.75, distance: 25 * 0.75 + 7.5, speed: 0.008, intensity: 0.6, wireSegments: 6, moonCount: 2, rotationSpeed: 0.005 },
        { name: 'Jupiter', radius: 2.5 * 0.75, distance: 32 * 0.75 + 11.5, speed: 0.002, intensity: 0.3, wireSegments: 12, moonCount: 4, rotationSpeed: 0.007 },
        { name: 'Saturn', radius: 2.2 * 0.75, distance: 40 * 0.75 + 16.5, speed: 0.0009, intensity: 0.4, wireSegments: 12, moonCount: 3, rotationSpeed: 0.006 },
        { name: 'Uranus', radius: 1.8 * 0.75, distance: 47 * 0.75 + 20.5, speed: 0.0004, intensity: 0.2, wireSegments: 10, moonCount: 2, rotationSpeed: 0.004 },
        { name: 'Neptune', radius: 1.7 * 0.75, distance: 55 * 0.75 + 25.5, speed: 0.0001, intensity: 0.8, wireSegments: 10, moonCount: 1, rotationSpeed: 0.005 }
    ];

    // Use the existing solarSystemCenter created in setupScene
    const solarSystemCenter = window.solarSystemCenter;

    planets.forEach((planet, index) => {
        const matrixTexture = window.createMatrixGradient(planet.intensity);
        const planetGeometry = new THREE.SphereGeometry(planet.radius, planet.wireSegments, planet.wireSegments);
        const planetMaterial = new THREE.MeshBasicMaterial({
            map: matrixTexture, 
            wireframe: true, 
            wireframeLinewidth: 1
        });
        const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
        const planetPivot = new THREE.Object3D();
        solarSystemCenter.add(planetPivot);
        planetMesh.position.x = planet.distance;
        planetPivot.add(planetMesh);
        planetPivot.rotation.y = Math.random() * Math.PI * 2;

        const orbitGeometry = new THREE.RingGeometry(planet.distance - 0.05 * 0.75, planet.distance + 0.05 * 0.75, 128);
        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        solarSystemCenter.add(orbit);

        const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.1 });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planetMesh.add(glow);

        if (index === 5) { // Saturn ring
            const saturnRingGeometry = new THREE.TorusGeometry(4 * 0.75, 1 * 0.75, 2, 64);
            const saturnRingMaterial = new THREE.MeshBasicMaterial({ color: 0x33ff33, wireframe: true, transparent: true, opacity: 0.8 });
            const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
            saturnRing.rotation.x = Math.PI / 2;
            planetMesh.add(saturnRing);
        }

        planetMesh.userData.planet = planet;
        planetMeshes.push({
            mesh: planetMesh,
            pivot: planetPivot,
            speed: planet.speed,
            distance: planet.distance,
            intensity: planet.intensity,
            rotationSpeed: planet.rotationSpeed
        });
    });

    // Shift the solar system up by 10 units (~100 pixels)
    solarSystemCenter.position.y = 10; // Now moves the Sun, planets, orbits, glows, Saturn's ring, moons, stations, outposts
};