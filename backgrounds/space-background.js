// space-background.js - JavaScript for controlling the animated background

document.addEventListener('DOMContentLoaded', () => {
    // Create background container
    const spaceBackground = document.createElement('div');
    spaceBackground.className = 'space-background';

    // Add a class to the spaceBackground element if it's the book-series page
    if (window.location.pathname.includes('book-series.html')) {
       spaceBackground.classList.add('no-orb');
    }


    // Create grid layer
    const grid = document.createElement('div');
    grid.className = 'grid';
    spaceBackground.appendChild(grid);

    // Create nebula layer
    const nebula = document.createElement('div');
    nebula.className = 'nebula';
    spaceBackground.appendChild(nebula);

    // Create orb layer  --  COMMENTED OUT TO REMOVE ORB
    // const orb = document.createElement('div');
    // orb.className = 'orb';
    // spaceBackground.appendChild(orb);

    // Add the background to the page before any other content
    const body = document.body;
    body.insertBefore(spaceBackground, body.firstChild);

    // Parallax effect on mouse move (subtle)
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;

        // Move layers slightly based on mouse position
        // orb.style.transform = `translate(${x * 20 - 10}px, ${y * 20 - 10}px)`; // Orb transform removed
        nebula.style.transform = `translate(${x * 10 - 5}px, ${y * 10 - 5}px)`;
    });

    // Make the background responsive to the brightness slider
    const brightnessSlider = document.getElementById('brightnessSlider');
    if (brightnessSlider) {
        brightnessSlider.addEventListener('input', () => {
            const brightness = brightnessSlider.value / 100;
            spaceBackground.style.opacity = brightness * 0.8; // Adjust as needed
        });
    }
});