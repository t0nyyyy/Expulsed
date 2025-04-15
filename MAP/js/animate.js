// animate.js

// Flag to prevent repeated logging for the same preview object
let lastLoggedPreviewObject = null;

function animate() {
    requestAnimationFrame(animate);

    // Calculate delta time
    const delta = clock.getDelta();

    // Animate twinkling stars
    if (window.stars && window.stars.userData.animate) {
        window.stars.userData.animate(delta);
    }

    planetMeshes.forEach(planet => {
        planet.pivot.rotation.y += planet.speed;
        planet.mesh.rotation.y += planet.rotationSpeed;
        const pulse = Math.sin(Date.now() * 0.001 * planet.intensity) * 0.1 + 0.9;
        planet.mesh.children[0].scale.set(pulse, pulse, pulse);

        if (planet.mesh.userData.moons) {
            planet.mesh.userData.moons.forEach(moon => {
                moon.pivot.rotation.y += moon.speed;

                // Animate bobbing, wobble, and pulsing opacity for markers in the main scene
                moon.mesh.children.forEach(child => {
                    if (child.userData.initialY) { // Check if this is a marker
                        // Bobbing animation
                        const amplitude = moon.mesh.geometry.parameters.radius * 0.1;
                        child.position.y = child.userData.initialY + Math.sin(Date.now() * child.userData.speed) * amplitude;

                        // Wobble effect (scale X and Y differently)
                        const wobbleX = 1 + Math.sin(Date.now() * 0.003) * 0.1;
                        const wobbleY = 1 + Math.cos(Date.now() * 0.003) * 0.1;
                        child.scale.set(wobbleX * moon.mesh.geometry.parameters.radius * 0.3, wobbleY * moon.mesh.geometry.parameters.radius * 0.3, 1);

                        // Pulsing opacity for holographic look
                        const opacity = 0.5 + Math.sin(Date.now() * 0.002) * 0.4; // Pulse between 0.5 and 0.9
                        child.material.opacity = opacity;
                        child.material.needsUpdate = true;

                        // Update the connecting line's end point
                        const line = moon.mesh.children.find(c => c.isLine && c.position.equals(child.position));
                        if (line) {
                            const positions = line.geometry.attributes.position.array;
                            positions[3] = child.position.x;
                            positions[4] = child.position.y;
                            positions[5] = child.position.z;
                            line.geometry.attributes.position.needsUpdate = true;
                        }
                    }
                });
            });
        }

        if (planet.mesh.userData.stations) {
            planet.mesh.userData.stations.forEach(station => {
                station.pivot.rotation.y += station.speed;
                if (station.pivot.userData.gyrate) {
                    station.pivot.rotation.x += 0.01;
                    station.pivot.rotation.z += 0.01;
                }
            });
        }
    });

    window.flares.forEach(flare => {
        flare.mesh.rotation.y += flare.speed;
        flare.mesh.scale.y = 1 + Math.sin(Date.now() * 0.001 + flare.initialRotation) * 0.5;
    });

    window.sun.rotation.y += 0.001;
    window.sunGlow.rotation.y -= 0.001;
    const sunPulse = Math.sin(Date.now() * 0.001) * 0.1 + 1.1;
    window.sunGlow.scale.set(sunPulse, sunPulse, sunPulse);

    if (window.highlightedStation && window.highlightedStation.userData.type === "Outpost") {
        const flash = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
        const color = new THREE.Color().lerpColors(new THREE.Color(0xffff00), new THREE.Color(0x00ffff), flash);
        if (window.highlightedStation.isGroup) {
            window.highlightedStation.children.forEach(child => {
                if (child.material) child.material.color.set(color);
            });
        } else if (window.highlightedStation.material) {
            window.highlightedStation.material.color.set(color);
        }
    }

    if (previewScene.children.length > 0) {
        const previewPivot = previewScene.children[0];
        if (previewPivot.userData.original) {
            const originalPivot = previewPivot.userData.original;
            const originalPlanetMesh = originalPivot.children[0];
            const previewPlanetMesh = previewPivot.children[0].children[0];

            // Define selectedType early to avoid TDZ issues
            const selectedType = previewPivot.userData.selectedType || "Station";

            // Determine the planet name for adjusting orbiting speed
            let planetName = "Unknown";
            if (selectedType === "Station" || selectedType === "Outpost") {
                planetName = originalPlanetMesh.userData.planet?.name || 
                            originalPlanetMesh.userData.planet?.planetName || 
                            originalPlanetMesh.userData.name || 
                            originalPlanetMesh.name || 
                            originalPivot.userData.name || 
                            originalPivot.name || 
                            originalPivot.parent?.userData?.name || 
                            originalPivot.parent?.name || 
                            originalPivot.parent?.parent?.userData?.name || 
                            originalPivot.parent?.parent?.name || 
                            "Unknown";
            } else if (selectedType === "Moon Outpost") {
                const originalMoonMesh = originalPlanetMesh;
                const parentPlanetPivot = originalMoonMesh.parent?.parent;
                const parentPlanetMesh = parentPlanetPivot?.children[0];
                planetName = parentPlanetMesh?.userData?.planet?.name || 
                            parentPlanetMesh?.userData?.planet?.planetName || 
                            parentPlanetMesh?.userData?.name || 
                            parentPlanetMesh?.name || 
                            parentPlanetPivot?.userData?.name || 
                            parentPlanetPivot?.name || 
                            parentPlanetPivot?.parent?.userData?.name || 
                            parentPlanetPivot?.parent?.name || 
                            originalMoonMesh.userData.name || 
                            originalMoonMesh.name || 
                            "Unknown";
            }

            // Debug logging (log only if the preview object has changed)
            if (lastLoggedPreviewObject !== previewPivot) {
                const isMercury = planetName.toLowerCase() === "mercury";
                lastLoggedPreviewObject = previewPivot;
            }

            // Synchronize rotations with the original planet
            previewPivot.rotation.y = originalPivot.rotation.y;
            previewPlanetMesh.rotation.y = originalPlanetMesh.rotation.y;

            // Synchronize station rotations
            const originalStations = originalPlanetMesh.userData.stations || [];
            originalStations.forEach(originalStation => {
                const originalStationPivot = originalStation.pivot;
                const stationName = originalStationPivot?.children[0]?.userData?.name;

                let previewStationPivot = null;
                previewPlanetMesh.traverse(node => {
                    if (node.userData && node.userData.name === stationName && node.userData.type === "Station") {
                        previewStationPivot = node.parent;
                    }
                });

                if (previewStationPivot && originalStationPivot) {
                    previewStationPivot.rotation.x = originalStationPivot.rotation.x;
                    previewStationPivot.rotation.y = originalStationPivot.rotation.y;
                    previewStationPivot.rotation.z = originalStationPivot.rotation.z;
                }
            });

            // Synchronize outpost positions and rotations
            previewPlanetMesh.traverse(grandchild => {
                if (grandchild.userData && (grandchild.userData.type === "Outpost" || grandchild.userData.type === "Moon Outpost")) {
                    const originalOutpost = originalPlanetMesh.children.find(c => 
                        c.userData && 
                        c.userData.name === grandchild.userData.name && 
                        (c.userData.type === "Outpost" || c.userData.type === "Moon Outpost")
                    );
                    if (originalOutpost) {
                        grandchild.position.copy(originalOutpost.position);
                        grandchild.quaternion.copy(originalOutpost.quaternion);
                    }
                }
            });

            // Animate moons in the preview scene
            previewPlanetMesh.traverse(child => {
                if (child.userData && child.userData.isMoon) {
                    // Apply slower rotation and orbit for the moon
                    child.rotation.y += 0.005; // Reduced from 0.01
                    if (child.parent && child.parent !== previewScene) {
                        child.parent.rotation.y += (child.userData.speed || 0.02) * 0.5; // Reduced speed by 50%
                    }

                    // Animate moon markers (bobbing, wobble, pulsing opacity)
                    child.children.forEach(grandchild => {
                        if (grandchild.userData.initialY) { // Check if this is a marker
                            // Initialize currentY if not set (first frame)
                            if (grandchild.userData.currentY === undefined) {
                                grandchild.userData.currentY = grandchild.userData.initialY;
                            }

                            // Bobbing animation with damping and reduced amplitude
                            const amplitude = Math.max(child.geometry.parameters.radius * 0.02, 0.005);
                            const targetY = grandchild.userData.initialY + Math.sin(Date.now() * (grandchild.userData.speed * 0.5)) * amplitude;
                            grandchild.userData.currentY = THREE.MathUtils.lerp(grandchild.userData.currentY, targetY, 0.15);
                            grandchild.position.y = grandchild.userData.currentY;

                            // Wobble effect
                            const wobbleX = 1 + Math.sin(Date.now() * 0.001) * 0.1; // Reduced frequency
                            const wobbleY = 1 + Math.cos(Date.now() * 0.001) * 0.1; // Reduced frequency
                            grandchild.scale.set(wobbleX * child.geometry.parameters.radius * 0.3, wobbleY * child.geometry.parameters.radius * 0.3, 1);

                            // Pulsing opacity
                            const opacity = 0.5 + Math.sin(Date.now() * 0.0005) * 0.4; // Reduced frequency
                            grandchild.material.opacity = opacity;
                            child.material.needsUpdate = true;

                            // Update the connecting line's end point
                            const line = child.children.find(c => c.isLine && c.position.equals(grandchild.position));
                            if (line) {
                                const positions = line.geometry.attributes.position.array;
                                positions[3] = grandchild.position.x;
                                positions[4] = grandchild.position.y;
                                positions[5] = grandchild.position.z;
                                line.geometry.attributes.position.needsUpdate = true;
                            }
                        }
                    });
                }
            });

            // Calculate bounding box and center (includes children for zoom distance calculation)
            const planetBox = new THREE.Box3().setFromObject(previewPlanetMesh);
            const planetCenter = planetBox.getCenter(new THREE.Vector3());
            const planetSize = planetBox.getSize(new THREE.Vector3());
            const maxDim = Math.max(planetSize.x, planetSize.y, planetSize.z);

            // Calculate the true moon center (excluding children) for Moon Outposts
            let moonCenter = planetCenter; // Default to planetCenter in case of failure
            if (selectedType === "Moon Outpost") {
                try {
                    if (previewPlanetMesh && previewPlanetMesh.geometry) {
                        previewPlanetMesh.geometry.computeBoundingBox();
                        if (previewPlanetMesh.geometry.boundingBox) {
                            const moonBox = previewPlanetMesh.geometry.boundingBox.clone();
                            moonBox.applyMatrix4(previewPlanetMesh.matrixWorld);
                            moonCenter = moonBox.getCenter(new THREE.Vector3());
                        } else {
                            console.warn("Moon geometry bounding box is null, falling back to planetCenter");
                        }
                    } else {
                        console.warn("previewPlanetMesh or its geometry is undefined, falling back to planetCenter");
                    }
                } catch (error) {
                    console.error("Error calculating moonCenter:", error);
                    moonCenter = planetCenter; // Fallback to planetCenter to prevent breaking
                }
            }

            // Determine type-specific base distance
            let baseDistance;
            if (selectedType === "Outpost") {
                baseDistance = 3; // Fixed distance for outposts
            } else if (selectedType === "Moon Outpost") {
                baseDistance = 2; // Fixed distance for moon outposts
            } else {
                baseDistance = 4; // Fixed distance for stations
            }

            // Apply zoom factor (correct direction and range for all types)
            let zoomFactor = window.previewZoom || 1.0;
            if (selectedType === "Station") {
                // For stations: map previewZoom (0.3 to 2.2) to (0.25 to 1.0)
                zoomFactor = 0.25 + (window.previewZoom - 0.3) * (1.0 - 0.25) / (2.2 - 0.3);
            } else if (selectedType === "Outpost") {
                // For planet outposts: map previewZoom (0.3 to 2.2) to (0.5 to 1.0)
                zoomFactor = 0.5 + (window.previewZoom - 0.3) * (1.0 - 0.5) / (2.2 - 0.3);
            } else if (selectedType === "Moon Outpost") {
                // For moon outposts: map previewZoom (0.3 to 2.2) to (0.5 to 1.5)
                zoomFactor = 0.5 + (window.previewZoom - 0.3) * (1.5 - 0.5) / (2.2 - 0.3);
            }

            const distance = baseDistance * maxDim * zoomFactor;
            // Clamp the distance to prevent clipping
            const minDistance = maxDim * 0.5; // Minimum distance to avoid clipping
            const clampedDistance = Math.max(minDistance, distance);

            // Determine the look-at target
            let lookAtTarget = planetCenter; // Default to the planet/moon center (includes children)
            if (selectedType === "Moon Outpost") {
                lookAtTarget = moonCenter; // Use the true moon center (or fallback to planetCenter)
            }

            // Set camera position (use a fixed 45-degree angle for consistency, adjust orbiting speed for Mercury)
            const angle = Math.PI / 4; // 45 degrees in radians
            if (selectedType === "Moon Outpost") {
                // Fixed position for Moon Outposts to prevent wobble
                previewCamera.position.set(
                    lookAtTarget.x + clampedDistance * Math.sin(angle),
                    lookAtTarget.y + clampedDistance * Math.cos(angle),
                    lookAtTarget.z
                );
            } else {
                // Orbiting camera for Planets and Stations
                // Adjust orbiting speed based on the planet (slower for Mercury)
                const isMercury = planetName.toLowerCase() === "mercury";
                const speedMultiplier = isMercury ? 0.0001 : 0.0005; // Slower for Mercury, default for others
                const time = Date.now() * speedMultiplier;
                previewCamera.position.set(
                    lookAtTarget.x + Math.sin(time) * clampedDistance,
                    lookAtTarget.y + clampedDistance * Math.cos(angle),
                    lookAtTarget.z + Math.cos(time) * clampedDistance
                );
            }

            previewCamera.lookAt(lookAtTarget);
            previewCamera.updateMatrixWorld(true);
            previewCamera.updateProjectionMatrix();
        }
    }

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
    previewRenderer.render(previewScene, previewCamera);
}