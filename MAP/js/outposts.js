const outpostMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true }); // Yellow for planet outposts

// Function to create a diamond-shaped texture
function createDiamondTexture() {
    const size = 64; // Texture size (64x64 pixels)
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    // Draw a diamond shape
    context.beginPath();
    context.moveTo(size / 2, 0); // Top point
    context.lineTo(size, size / 2); // Right point
    context.lineTo(size / 2, size); // Bottom point
    context.lineTo(0, size / 2); // Left point
    context.closePath();

    // Fill with white (color will be applied via material)
    context.fillStyle = '#ffffff';
    context.fill();

    // Add a wireframe outline
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.stroke();

    return canvas;
}

window.setupOutposts = async function() {
    window.allOutposts = {};

    const response = await fetch('js/data/outposts.json');
    const outpostsData = await response.json();

    // Wait for moons to be set up
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure setupMoons completes

    planetMeshes.forEach(planet => {
        const planetName = planet.mesh.userData.planet.name;
        window.allOutposts[planetName] = [];

        // Planet outposts
        if (outpostsData[planetName]) {
            outpostsData[planetName].forEach(outpostData => {
                const outpostGeo = new THREE.SphereGeometry(0.1, 4, 4);
                const outpost = new THREE.Mesh(outpostGeo, outpostMaterial.clone());
                const r = planet.mesh.geometry.parameters.radius;
                const theta = outpostData.position.theta;
                const phi = outpostData.position.phi;
                outpost.position.set(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
                planet.mesh.add(outpost);
                outpost.userData = {
                    name: outpostData.name,
                    type: outpostData.type,
                    desc: outpostData.desc,
                    callsign: outpostData.callsign // Add callsign
                };
                window.allOutposts[planetName].push({ mesh: outpost });
            });
        }

        if (planet.mesh.userData.moons) {
            planet.mesh.userData.moons.forEach(moon => {
                const moonMesh = moon.mesh;
                const moonName = moonMesh.userData.name;
                window.allOutposts[moonName] = [];

                if (outpostsData.Moons && outpostsData.Moons[moonName]) {
                    const outpostCount = Math.min(outpostsData.Moons[moonName].length, 5);
                    moonMesh.userData.outpostCount = outpostCount;
                    moonMesh.userData.outpostData = outpostsData.Moons[moonName].slice(0, outpostCount);

                    for (let i = 0; i < outpostCount; i++) {
                        const outpostData = outpostsData.Moons[moonName][i];
                        const theta = outpostData.position.theta;
                        const phi = outpostData.position.phi;
                        const moonRadius = moonMesh.geometry.parameters.radius;

                        // Calculate the surface position
                        const surfacePos = new THREE.Vector3(
                            moonRadius * Math.sin(phi) * Math.cos(theta),
                            moonRadius * Math.sin(phi) * Math.sin(theta),
                            moonRadius * Math.cos(phi)
                        );

                        // Calculate the marker position (floating above the surface)
                        const markerOffset = moonRadius * 0.5; // Float 50% above the surface
                        const markerPos = surfacePos.clone().normalize().multiplyScalar(moonRadius + markerOffset);

                        // Create the marker (2D sprite with diamond texture)
                        const texture = new THREE.CanvasTexture(createDiamondTexture());
                        const markerMat = new THREE.SpriteMaterial({
                            map: texture,
                            color: 0xffffff, // White
                            transparent: true,
                            opacity: 0.7     // Initial opacity
                        });
                        const marker = new THREE.Sprite(markerMat);
                        marker.position.copy(markerPos);
                        marker.scale.set(moonRadius * 0.3, moonRadius * 0.3, 1); // Larger size for visibility
                        marker.userData = {
                            initialY: markerPos.y,
                            speed: 0.002 + Math.random() * 0.002 // Random bobbing speed
                        };
                        moonMesh.add(marker);

                        // Create the connecting line
                        const lineGeo = new THREE.BufferGeometry().setFromPoints([
                            surfacePos,
                            markerPos
                        ]);
                        const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff }); // White
                        const line = new THREE.Line(lineGeo, lineMat);
                        moonMesh.add(line);

                        window.allOutposts[moonName].push({
                            mesh: moonMesh,
                            marker: marker, // Store marker for highlighting
                            line: line,     // Store line for highlighting
                            outpostIndex: i,
                            userData: {
                                name: outpostData.name,
                                type: "Moon Outpost",
                                desc: outpostData.desc
                            }
                        });
                    }
                }
            });
        }
    });
};