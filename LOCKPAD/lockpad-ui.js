// LOCKPAD/lockpad-ui.js

// Assign the main function to the window object so gatekeeper can find it
window.initializeLockpadUI = function(onPinAttempt) {
    // Find elements *after* lockpad HTML is added to DOM
    const lockpadContainer = document.querySelector('.lockpad-container');
    if (!lockpadContainer) {
         console.error("Lockpad UI Error: .lockpad-container not found in DOM!");
         return null; // Indicate failure
    }

    const pinDisplaySpans = lockpadContainer.querySelectorAll('#pin-input-display span:not(.cursor)');
    const statusText = lockpadContainer.querySelector('#status-text');
    const keypadButtons = lockpadContainer.querySelectorAll('.keypad-btn');
    const cursor = lockpadContainer.querySelector('#cursor');

    if (!pinDisplaySpans.length || !statusText || !keypadButtons.length || !cursor) {
        console.error("Lockpad UI Error: One or more essential elements not found inside .lockpad-container.");
        return null; // Indicate failure
    }

    let currentPin = "";
    const pinLength = 4;

    // --- Private UI Functions ---
    function updateDisplay() {
        pinDisplaySpans.forEach((span, index) => {
            span.textContent = index < currentPin.length ? '●' : '_';
        });
        if (currentPin.length < pinLength) {
            const nextSpan = pinDisplaySpans[currentPin.length];
            // Use offsetLeft relative to its parent for positioning
            cursor.style.left = `${nextSpan.offsetLeft + nextSpan.offsetWidth / 2}px`;
            cursor.style.display = 'inline-block';
        } else {
            cursor.style.display = 'none';
        }
    }

    function handleKeyPress(value) {
        if (currentPin.length < pinLength) {
            currentPin += value;
            updateDisplay();
        }
    }

    function handleClear() {
        currentPin = "";
        statusText.textContent = "AWAITING INPUT";
        statusText.classList.remove('denied', 'granted');
        updateDisplay();
    }

    function handleEnter() {
        if (typeof onPinAttempt === 'function') {
            onPinAttempt(currentPin); // Pass attempt to gatekeeper
        } else {
            console.error("Lockpad UI: onPinAttempt callback missing!");
        }
    }

    // --- Public methods returned for gatekeeper ---
    function showStatus(message, type) {
        statusText.textContent = message;
        statusText.classList.remove('denied', 'granted');
        if (type === 'denied') statusText.classList.add('denied');
        else if (type === 'granted') statusText.classList.add('granted');
    }

    function clearInput() {
        currentPin = "";
        updateDisplay(); // Update visual display only
    }

    // --- Event Listeners ---
    keypadButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.dataset.value;
            const action = button.dataset.action;
            if (value) handleKeyPress(value);
            else if (action === 'clear') handleClear();
            else if (action === 'enter') handleEnter();
        });
    });

    // --- Initialization ---
    updateDisplay(); // Set initial display state
    createFloatingParticles(); // Create particles if container exists

    console.log("Lockpad UI Initialized successfully.");
    // Return the interface for the gatekeeper
    return { showStatus, clearInput };

}; // --- END of window.initializeLockpadUI assignment ---


// Floating Particles Creation (ensure it can find the container)
function createFloatingParticles() {
    const floatingParticlesContainer = document.getElementById('floatingParticles'); // Assumes ID exists
    if (!floatingParticlesContainer) {
         console.warn("Lockpad UI: floatingParticles container not found.");
         return;
    }
    // Prevent adding particles multiple times if script runs again somehow
    if (floatingParticlesContainer.hasChildNodes()) return;

    const particleCount = 30;
    console.log("Creating floating particles...");
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle'); // Ensure .particle class exists in lockpad.css
        // ... (rest of particle style setup from previous versions) ...
         const size = Math.random() * 4 + 1;
         const posX = Math.random() * 100;
         const duration = Math.random() * 15 + 10;
         const delay = Math.random() * 10;
         particle.style.width = `${size}px`;
         particle.style.height = `${size}px`;
         particle.style.left = `${posX}%`;
         particle.style.animationDuration = `${duration}s`;
         particle.style.animationDelay = `${delay}s`;
         // position/bottom should be handled by CSS
        floatingParticlesContainer.appendChild(particle);
    }
}