// zoomBarSetup.js

// Utility function to resize preview renderer and camera
export function resizePreview() {
    const previewContainer = document.querySelector('.preview-container');
    if (previewContainer) {
        const previewWidth = previewContainer.clientWidth;
        const previewHeight = previewContainer.clientHeight;
        if (previewWidth > 0 && previewHeight > 0) {
            previewRenderer.setSize(previewWidth, previewHeight);
            previewCamera.aspect = previewWidth / previewHeight;
            previewCamera.updateProjectionMatrix();

            // Dynamically adjust the zoom bar height based on container height
            const zoomBarContainer = document.querySelector('.zoom-bar-container');
            if (zoomBarContainer) {
                const containerHeight = previewHeight;
                const zoomBarHeight = containerHeight * 0.8; // 80% of the container height
                const sliderContainer = zoomBarContainer.querySelector('.slider-container');
                sliderContainer.style.height = `${zoomBarHeight}px`;
                const zoomBar = sliderContainer.querySelector('.zoom-bar');
                zoomBar.style.width = `${zoomBarHeight}px`; // Match the width to the height (since it's rotated)
            }
        }
    }
}

// Function to set up the zoom bar
export function setupZoomBar() {
    // Initialize previewZoom
    window.previewZoom = 1.0;

    // Create the zoom bar container and position it properly
    const previewContainer = document.querySelector('.preview-container');
    if (!previewContainer) {
        console.error('Preview container not found!');
        return;
    }

    // Clean up any existing zoom bar to avoid duplicates
    const existingZoomBar = document.querySelector('.zoom-bar-container');
    if (existingZoomBar) {
        existingZoomBar.remove();
    }

    // Add the zoom bar to the preview container
    const zoomBarContainer = document.createElement('div');
    zoomBarContainer.className = 'zoom-bar-container';

    // Create the zoom bar element
    const zoomBar = document.createElement('input');
    zoomBar.type = 'range';
    zoomBar.className = 'zoom-bar';
    zoomBar.id = 'zoom-slider';
    zoomBar.min = '0.3'; // Adjusted for more zoom-in range
    zoomBar.max = '2.2'; // Adjusted for more zoom-out range
    zoomBar.value = '1.0';
    zoomBar.step = '0.1';

    // Create a container for the zoom bar
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    // Assemble the zoom bar components
    sliderContainer.appendChild(zoomBar);
    zoomBarContainer.appendChild(sliderContainer);

    // Add the zoom bar container to the preview container
    previewContainer.appendChild(zoomBarContainer);

    // Style the zoom bar with a better approach
    const style = document.createElement('style');
    style.textContent = `
        .zoom-bar-container {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            border: 1px solid #00ff00;
            padding: 10px 5px; /* Added padding to avoid touching top/bottom */
            border-radius: 10px;
            z-index: 1001;
            display: flex;
            flex-direction: column;
            align-items: center;
            pointer-events: all !important;
            width: 30px;
        }

        .slider-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            /* Height will be set dynamically via JavaScript */
        }

        /* Vertical range input styling */
        .zoom-bar {
            -webkit-appearance: none;
            height: 10px;
            margin: 0;
            background: transparent;
            transform: rotate(270deg);
            transform-origin: center;
            cursor: pointer;
            pointer-events: all !important;
        }

        /* Track styling for webkit browsers */
        .zoom-bar::-webkit-slider-runnable-track {
            width: 100%;
            height: 10px;
            background: #006600;
            border-radius: 5px;
        }

        /* Thumb styling for webkit browsers */
        .zoom-bar::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            background: #00ff00;
            border-radius: 50%;
            cursor: pointer;
            margin-top: -5px;
        }

        /* Track styling for Mozilla browsers */
        .zoom-bar::-moz-range-track {
            width: 100%;
            height: 10px;
            background: #006600;
            border-radius: 5px;
        }

        /* Thumb styling for Mozilla browsers */
        .zoom-bar::-moz-range-thumb {
            width: 20px;
            height: 20px;
            background: #00ff00;
            border-radius: 50%;
            cursor: pointer;
        }

        /* Ensure the preview canvas doesn't block interaction */
        #previewCanvas {
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);

    // Make sure the previewCanvas has pointer-events set to none
    const previewCanvas = document.getElementById('previewCanvas');
    if (previewCanvas) {
        previewCanvas.style.pointerEvents = 'none';
    } else {
        console.warn('Preview canvas element not found!');
    }

    // Add event listeners for the zoom bar with value inversion
    zoomBar.addEventListener('input', function(event) {
        window.previewZoom = 2.5 - parseFloat(event.target.value); // Adjusted for new range (0.3 to 2.2)
    });

    zoomBar.addEventListener('change', function(event) {
        window.previewZoom = 2.5 - parseFloat(event.target.value); // Adjusted for new range
    });

    // Add extra event listeners for debugging
    zoomBar.addEventListener('mousedown', function(event) {
        event.stopPropagation();
    });

    zoomBar.addEventListener('touchstart', function(event) {
        event.stopPropagation();
    });

    zoomBar.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    // Initial resize to set the zoom bar height
    resizePreview();
}