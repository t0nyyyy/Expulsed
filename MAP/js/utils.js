window.createMatrixGradient = function(intensity) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 256);
    gradient.addColorStop(0, `rgba(0, ${128 + intensity * 64}, 0, 1)`);
    gradient.addColorStop(0.5, `rgba(0, ${192 + intensity * 32}, 0, 1)`);
    gradient.addColorStop(1, `rgba(${intensity * 50}, 255, ${intensity * 50}, 1)`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(canvas);
};