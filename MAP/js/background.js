window.setupBackground = async function() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const opacities = []; // Array to store opacity values for twinkling
    const twinkleSpeeds = []; // Array to store twinkling speed for each star
    const minDistance = 500 * 0.75;
    const maxDistance = 1500 * 0.75;

    // Generate star positions, colors, opacities, and twinkle speeds
    for (let i = 0; i < 3000; i++) {
        let x = (Math.random() - 0.5);
        let y = (Math.random() - 0.5);
        let z = (Math.random() - 0.5);
        const length = Math.sqrt(x*x + y*y + z*z);
        x /= length; y /= length; z /= length;
        const distance = minDistance + Math.random() * (maxDistance - minDistance);
        x *= distance; y *= distance; z *= distance;
        vertices.push(x, y, z);
        const greenIntensity = 0.7 + Math.random() * 0.3;
        colors.push(Math.random() > 0.8 ? 0 : Math.random() > 0.8 ? 0.2 : 0, greenIntensity, Math.random() > 0.8 ? 0.2 : 0);
        opacities.push(0.8); // Initial opacity
        twinkleSpeeds.push(0.5 + Math.random() * 1.5); // Random speed between 0.5 and 2
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('opacity', new THREE.Float32BufferAttribute(opacities, 1)); // Custom opacity attribute

    // Create a custom shader material for twinkling
    const starsMaterial = new THREE.ShaderMaterial({
        uniforms: {
            size: { value: 0.7 * 0.75 },
            globalOpacity: { value: 0.8 }
        },
        vertexShader: `
            attribute vec3 color;
            attribute float opacity;
            varying vec3 vColor;
            varying float vOpacity;
            uniform float size;
            void main() {
                vColor = color;
                vOpacity = opacity;
                gl_PointSize = size;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            varying float vOpacity;
            uniform float globalOpacity;
            void main() {
                gl_FragColor = vec4(vColor, vOpacity * globalOpacity);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(geometry, starsMaterial);
    scene.add(stars);
    window.stars = stars;

    // Add twinkling animation data to the stars object
    stars.userData = {
        opacities: opacities,
        twinkleSpeeds: twinkleSpeeds,
        time: 0,
        animate: (delta) => {
            stars.userData.time += delta;
            const opacityAttribute = stars.geometry.getAttribute('opacity');
            for (let i = 0; i < opacities.length; i++) {
                // Use a sine wave to animate opacity between 0.4 and 0.8
                opacities[i] = 0.4 + 0.4 * Math.sin(stars.userData.time * twinkleSpeeds[i]);
                opacityAttribute.array[i] = opacities[i];
            }
            opacityAttribute.needsUpdate = true;
        }
    };

    const backgroundSphereGeometry = new THREE.SphereGeometry(1000 * 0.75, 32, 32);
    const backgroundSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x002200, side: THREE.BackSide, transparent: true, opacity: 0.05 });
    const backgroundSphere = new THREE.Mesh(backgroundSphereGeometry, backgroundSphereMaterial);
    scene.add(backgroundSphere);
    window.backgroundSphere = backgroundSphere;
};