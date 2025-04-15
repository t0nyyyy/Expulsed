// stationHighlight.js

// Import the typewriter effect
import { typeText } from './typewriterEffect.js';

export function highlightStation(mesh, marker, line, outpostIndex) {
    const currentTypingAnimation = window.currentTypingAnimation;
    if (currentTypingAnimation) {
        currentTypingAnimation();
        window.currentTypingAnimation = null;
    }

    for (const planet in window.allStations) {
        window.allStations[planet].forEach(station => resetStation(station?.mesh));
    }
    for (const planet in planetMeshes) {
        const moons = planetMeshes[planet].mesh.userData.moons || [];
        moons.forEach(moon => {
            if (moon.mesh.material) {
                moon.mesh.material.color.set(0x00ff44);
                moon.mesh.material.needsUpdate = true;
            }
        });
    }
    for (const location in window.allOutposts) {
        window.allOutposts[location].forEach(outpost => resetStation(outpost?.mesh, outpost?.marker, outpost?.line));
    }

    if (mesh) {
        if (mesh.userData.isMoon) {
            mesh.material.color.set(0x800080);
            mesh.material.needsUpdate = true;
        }

        if (marker && line) {
            marker.material.color.set(0xff69b4);
            marker.material.needsUpdate = true;
            line.material.color.set(0xff69b4);
            line.material.needsUpdate = true;
        } else if (mesh.isGroup) {
            mesh.children.forEach(child => {
                if (child.material) {
                    child.material.color.set(mesh.userData.type === "Outpost" ? 0x00ffff : 0x800080);
                    child.material.needsUpdate = true;
                }
            });
        } else if (mesh.material) {
            mesh.material.color.set(mesh.userData.type === "Outpost" ? 0x00ffff : 0x800080);
            mesh.material.needsUpdate = true;
        }
        
        window.highlightedStation = mesh;

        if (marker && line) {
            window.highlightedStation.userData.selectedMarker = marker;
            window.highlightedStation.userData.selectedLine = line;
            window.highlightedStation.userData.selectedOutpostIndex = outpostIndex;
            const moonName = mesh.userData.name;
            const outpostData = mesh.userData.outpostData[outpostIndex];
            
            const textContainer = document.getElementById('text-container');
            const text = '<span class="name-line">NAME: <span class="name-value moon-outpost-name">' + outpostData.name + '</span></span><br>' +
                        '<span class="type-line">Type: Moon Outpost</span><br>' +
                        '<span class="callsign-line">Callsign: <span class="callsign-value">' + (outpostData.callsign || "N/A") + '</span></span><br>' +
                        '<span class="desc-line">Desc: ' + (outpostData.desc || "No description available") + '</span>';
            window.currentTypingAnimation = typeText(textContainer, text);
        } else {
            const textContainer = document.getElementById('text-container');
            const nameClass = mesh.userData.type === "Outpost" ? "planet-outpost-name" : "station-name";
            const text = '<span class="name-line">NAME: <span class="name-value ' + nameClass + '">' + mesh.userData.name + '</span></span><br>' +
                        '<span class="type-line">Type: ' + (mesh.userData.type || "Station") + '</span><br>' +
                        '<span class="callsign-line">Callsign: <span class="callsign-value">' + (mesh.userData.callsign || "N/A") + '</span></span><br>' +
                        '<span class="desc-line">Desc: ' + (mesh.userData.desc || "No description available") + '</span>';
            window.currentTypingAnimation = typeText(textContainer, text);
        }

        previewScene.clear();
        let parentMesh;
        if (mesh.userData.type === "Moon Outpost" || mesh.userData.isMoon) {
            parentMesh = mesh.userData.isMoon ? mesh : mesh.parent;
        } else {
            parentMesh = mesh.userData.type === "Outpost" ? mesh.parent : mesh.parent.parent;
        }
        const planetPivot = parentMesh.parent;
        const previewGroup = new THREE.Group();
        const clonedPlanetMesh = parentMesh.clone(true);
        previewGroup.add(clonedPlanetMesh);
        clonedPlanetMesh.userData = { ...parentMesh.userData };

        // Reset the rotation of the cloned mesh to align with the world
        clonedPlanetMesh.rotation.set(0, 0, 0);

        if (clonedPlanetMesh.userData.isMoon) {
            clonedPlanetMesh.material = clonedPlanetMesh.material.clone();
            clonedPlanetMesh.material.color.set(0x800080);
            clonedPlanetMesh.material.needsUpdate = true;
        }

        if (marker && line) {
            const clonedMarker = marker.clone();
            const clonedLine = line.clone();
            clonedMarker.material = clonedMarker.material.clone();
            clonedLine.material = clonedLine.material.clone();
            clonedMarker.material.color.set(0xff69b4);
            clonedLine.material.color.set(0xff69b4);
            clonedPlanetMesh.add(clonedMarker);
            clonedPlanetMesh.add(clonedLine);
        }

        if (parentMesh.userData.planet && (parentMesh.userData.planet.name === "Earth" || parentMesh.userData.planet.name === "Mars")) {
            const planetName = parentMesh.userData.planet.name;
            const lagrangeOffset = 2.625;

            if (window.allStations[planetName]) {
                window.allStations[planetName].forEach((station, index) => {
                    if (station && station.mesh) {
                        const ghostStation = station.mesh.clone(true);
                        ghostStation.userData = { ...station.mesh.userData };

                        const isFirstStation = index === 0;
                        ghostStation.position.set(
                            isFirstStation ? -lagrangeOffset : lagrangeOffset,
                            0,
                            0
                        );

                        if (planetName === "Mars") {
                            ghostStation.rotation.y = isFirstStation ? Math.PI / 2 : -Math.PI / 2;
                        }

                        clonedPlanetMesh.add(ghostStation);
                    }
                });
            }
        }

        const previewContainer = document.querySelector('.preview-container');
        const previewPivot = new THREE.Group();
        previewPivot.add(previewGroup);
        previewPivot.userData.original = planetPivot;
        
        if (outpostIndex !== undefined) {
            const outpostData = mesh.userData.outpostData[outpostIndex];
            previewPivot.userData.selectedName = outpostData.name;
            previewPivot.userData.selectedType = "Moon Outpost";
        } else {
            previewPivot.userData.selectedName = mesh.userData.name;
            previewPivot.userData.selectedType = mesh.userData.type || "Station";
        }
        
        previewScene.add(previewPivot);

        if (!marker) {
            function findAndHighlightMesh(parent, targetName, targetType, color) {
                parent.traverse(child => {
                    if (child.userData && child.userData.name === targetName &&
                    (child.userData.type === targetType || (!child.userData.type && targetType === "Station"))) {
                        if (child.isGroup) {
                            child.children.forEach(grandchild => {
                                if (grandchild.material) {
                                    grandchild.material = grandchild.material.clone();
                                    grandchild.material.color.set(color);
                                }
                            });
                        } else if (child.material) {
                            child.material = child.material.clone();
                            child.material.color.set(color);
                        }
                    }
                });
            }

            const highlightColor = mesh.userData.type === "Outpost" ? 0x00ffff : 0x800080;
            findAndHighlightMesh(previewPivot, mesh.userData.name, mesh.userData.type || "Station", highlightColor);
        }

        previewPivot.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.side = THREE.DoubleSide;
            }
        });

        if (previewContainer) {
            const previewWidth = previewContainer.clientWidth;
            const previewHeight = previewContainer.clientHeight;
            if (previewWidth > 0 && previewHeight > 0) {
                previewRenderer.setSize(previewWidth, previewHeight);
                previewCamera.aspect = previewWidth / previewHeight;

                const planetBox = new THREE.Box3().setFromObject(clonedPlanetMesh);
                const planetCenter = planetBox.getCenter(new THREE.Vector3());
                const planetSize = planetBox.getSize(new THREE.Vector3());
                const maxDim = Math.max(planetSize.x, planetSize.y, planetSize.z);

                // Position the camera for a slightly angled view (45 degrees)
                const distance = maxDim * 2; // Distance from the center
                const angle = Math.PI / 4; // 45 degrees in radians
                previewCamera.position.set(
                    planetCenter.x + distance * Math.sin(angle), // x-coordinate for angle
                    planetCenter.y + distance * Math.cos(angle), // y-coordinate for angle
                    planetCenter.z // Center z for consistency
                );
                previewCamera.lookAt(planetCenter);
                previewCamera.fov = 45;
                previewCamera.updateProjectionMatrix();
            }
        }
    }
}

export function resetStation(mesh, marker, line) {
    if (mesh) {
        if (marker && line) {
            marker.material.color.set(0xffffff);
            marker.material.opacity = 0.7;
            marker.material.needsUpdate = true;
            line.material.color.set(0xffffff);
            line.material.needsUpdate = true;
        } else if (mesh.isGroup) {
            mesh.children.forEach(child => {
                if (child.material) {
                    child.material.color.set(mesh.userData.type === "Outpost" ? 0xffff00 : 0x006600);
                    child.material.needsUpdate = true;
                }
            });
        } else if (mesh.material) {
            mesh.material.color.set(mesh.userData.type === "Outpost" ? 0xffff00 : 0x006600);
            mesh.material.needsUpdate = true;
        }
    }
}