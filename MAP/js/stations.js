const stationMaterial = new THREE.MeshBasicMaterial({ color: 0x006600, wireframe: true });

function createStation1() {
    const group = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 32), stationMaterial.clone());
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 4, 32), stationMaterial.clone());
    group.add(outerRing);
    group.add(innerRing);
    for (let i = 0; i < 8; i++) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.35, 0.025), stationMaterial.clone());
        const angle = (i / 8) * Math.PI * 2;
        pillar.position.set(Math.cos(angle) * 0.325, Math.sin(angle) * 0.325, 0);
        pillar.rotation.z = angle;
        group.add(pillar);
    }
    return group;
}

function createStation2() {
    const group = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 32), stationMaterial.clone());
    group.add(outerRing);
    for (let i = 0; i < 6; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 6) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
        arm.rotation.z = angle;
        group.add(arm);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.25, 0.025), stationMaterial.clone());
        beam.position.set(Math.cos(angle) * 0.375, Math.sin(angle) * 0.375, 0);
        beam.rotation.z = angle;
        group.add(beam);
    }
    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2), stationMaterial.clone());
    group.add(core);
    return group;
}

function createStation3() {
    const group = new THREE.Group();
    const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), stationMaterial.clone());
    const verticalBar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), stationMaterial.clone());
    verticalBar.rotation.z = Math.PI / 2;
    group.add(horizontalBar);
    group.add(verticalBar);
    return group;
}

function createStation4() {
    const group = new THREE.Group();
    for (let i = 0; i < 5; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 5) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
        arm.rotation.z = angle;
        group.add(arm);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), stationMaterial.clone());
    group.add(core);
    return group;
}

function createStation5() {
    const group = new THREE.Group();
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.6, 8), stationMaterial.clone());
    spire.position.y = 0.3;
    group.add(spire);
    for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.05, 0.02, 4, 16), stationMaterial.clone());
        ring.position.y = i * 0.2;
        group.add(ring);
    }
    return group;
}

function createStation6() {
    const group = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 32), stationMaterial.clone());
    group.add(outerRing);
    for (let i = 0; i < 5; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 5) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
        arm.rotation.z = angle;
        group.add(arm);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.25, 0.025), stationMaterial.clone());
        beam.position.set(Math.cos(angle) * 0.375, Math.sin(angle) * 0.375, 0);
        beam.rotation.z = angle;
        group.add(beam);
    }
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), stationMaterial.clone());
    group.add(core);
    return group;
}

function createStation7() {
    return new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 4, 6), stationMaterial.clone());
}

function createStation8() {
    const group = new THREE.Group();
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 4, 32), stationMaterial.clone());
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 4, 32), stationMaterial.clone());
    ring2.rotation.x = Math.PI / 2;
    group.add(ring1);
    group.add(ring2);
    return group;
}

function createStation9() {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), stationMaterial.clone());
    for (let i = 0; i < 4; i++) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 4), stationMaterial.clone());
        const angle = (i / 4) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.3, 0, Math.sin(angle) * 0.3);
        arm.rotation.x = Math.PI / 2;
        group.add(arm);
    }
    group.add(core);
    return group;
}

function createStation10() {
    const group = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), stationMaterial.clone());
    group.add(hub);
    for (let i = 0; i < 4; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 4) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.4, Math.sin(angle) * 0.4, 0);
        arm.rotation.z = angle;
        group.add(arm);
    }
    return group;
}

function createStation11() {
    return new THREE.Mesh(new THREE.OctahedronGeometry(0.35), stationMaterial.clone());
}

function createStation12() {
    const group = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 32), stationMaterial.clone());
    group.add(outerRing);
    for (let i = 0; i < 5; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 5) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
        arm.rotation.z = angle;
        group.add(arm);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.25, 0.025), stationMaterial.clone());
        beam.position.set(Math.cos(angle) * 0.375, Math.sin(angle) * 0.375, 0);
        beam.rotation.z = angle;
        group.add(beam);
    }
    const core = new THREE.Mesh(new THREE.TetrahedronGeometry(0.2), stationMaterial.clone());
    group.add(core);
    return group;
}

function createStation13() {
    const group = new THREE.Group();
    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 4, 32), stationMaterial.clone());
    group.add(outerRing);
    for (let i = 0; i < 7; i++) {
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), stationMaterial.clone());
        const angle = (i / 7) * Math.PI * 2;
        arm.position.set(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0);
        arm.rotation.z = angle;
        group.add(arm);
    }
    const core = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.025, 4, 32), stationMaterial.clone());
    group.add(core);
    return group;
}

const stationCreators = [
    createStation1, createStation2, createStation3, createStation4, createStation5,
    createStation6, createStation7, createStation8, createStation9, createStation10,
    createStation11, createStation12, createStation13
];

window.setupStations = async function() {
    const response = await fetch('js/data/stations.json');
    const stationsData = await response.json();

    window.allStations = {};

    planetMeshes.forEach(planet => {
        const stations = [];
        const planetName = planet.mesh.userData.planet?.name;
        const baseDistanceMultiplier = (planetName === 'Saturn' || planetName === 'Mercury') ? 3 : 2;
        const baseDistance = planet.mesh.geometry.parameters.radius * baseDistanceMultiplier;

        if (planetName === 'Mars') {
            const lagrangeOffset = 2.625;
            window.allStations[planetName] = [];

            const station10 = createStation10();
            const station10Pivot = new THREE.Object3D();
            station10Pivot.add(station10);
            station10.position.x = -lagrangeOffset;
            station10.rotation.y = Math.PI / 2;
            station10Pivot.position.x = planet.distance;
            planet.pivot.add(station10Pivot);
            station10.userData = { ...stationsData[planetName][0], name: "Mars Station 10" };
            stations.push({ pivot: station10Pivot, speed: 0 });
            window.allStations[planetName].push({ mesh: station10 });

            const station1 = createStation13();
            const station1Pivot = new THREE.Object3D();
            station1Pivot.add(station1);
            station1.position.x = lagrangeOffset;
            station1.rotation.y = -Math.PI / 2;
            station1Pivot.position.x = planet.distance;
            planet.pivot.add(station1Pivot);
            station1.userData = { ...stationsData[planetName][1], name: "Mars Station 1" };
            stations.push({ pivot: station1Pivot, speed: 0 });
            window.allStations[planetName].push({ mesh: station1 });
        } else if (planetName === 'Earth') {
            const lagrangeOffset = 2.625;
            window.allStations[planetName] = [];

            const station4 = createStation4();
            const station4Pivot = new THREE.Object3D();
            station4Pivot.add(station4);
            station4.position.x = -lagrangeOffset;
            station4Pivot.position.x = planet.distance;
            planet.pivot.add(station4Pivot);
            station4.userData = { ...stationsData[planetName][0], name: "Earth Station 4" };
            stations.push({ pivot: station4Pivot, speed: 0 });
            window.allStations[planetName].push({ mesh: station4 });

            const station9 = createStation9();
            const station9Pivot = new THREE.Object3D();
            station9Pivot.add(station9);
            station9.position.x = lagrangeOffset;
            station9Pivot.position.x = planet.distance;
            planet.pivot.add(station9Pivot);
            station9.userData = { ...stationsData[planetName][1], name: "Earth Station 9" };
            stations.push({ pivot: station9Pivot, speed: 0 });
            window.allStations[planetName].push({ mesh: station9 });
        } else {
            const assignedStations = {
                'Mercury': [2, 5], 'Venus': [3, 7], 'Jupiter': [6, 11], 'Saturn': [8, 12], 'Uranus': [2, 4], 'Neptune': [5, 9]
            }[planetName] || [];
            if (assignedStations.length) {
                window.allStations[planetName] = [];
                assignedStations.forEach((stationIdx, i) => {
                    const station = stationCreators[stationIdx - 1]();
                    const stationPivot = new THREE.Object3D();
                    stationPivot.add(station);
                    // Adjust distance for Saturn Station 2 (i === 1)
                    let distance = baseDistance + i * 0.5;
                    if (planetName === 'Saturn' && i === 1) {
                        distance = baseDistance + 1.0; // Increase offset for Saturn Station 2
                    }
                    station.position.x = distance;
                    stationPivot.rotation.y = (i * Math.PI) / assignedStations.length;
                    // Apply gyration to Venus (stationIdx 3 and 7) and Saturn (stationIdx 8 and 12)
                    if (stationIdx === 3 || stationIdx === 7 || stationIdx === 8 || stationIdx === 12) {
                        stationPivot.userData.gyrate = true;
                    }
                    // Scale down Mercury stations to half size
                    if (planetName === 'Mercury') {
                        station.scale.set(0.5, 0.5, 0.5);
                    }
                    // Lower Uranus Station 2 (first station, i = 0) to avoid moon collision
                    if (planetName === 'Uranus' && i === 0) {
                        station.position.y = -0.5; // Lower the station by 0.5 units
                    }
                    planet.mesh.add(stationPivot);
                    station.userData = { 
                        name: stationsData[planetName][i].name,
                        type: stationsData[planetName][i].type,
                        position: stationsData[planetName][i].position,
                        desc: stationsData[planetName][i].desc,
                        callsign: stationsData[planetName][i].callsign // Add callsign
                    };
                    stations.push({ pivot: stationPivot, speed: 0.015 });
                    window.allStations[planetName].push({ mesh: station });
                });
            }
        }
        planet.mesh.userData.stations = stations;
    });
};