// navbar.js
document.addEventListener('DOMContentLoaded', () => {

    const dropdownItems = document.querySelectorAll('.navbar-item.dropdown');
    const HIDE_DELAY = 1000;

    dropdownItems.forEach(item => {
        const menu = item.querySelector('.dropdown-menu');
        let hideTimeoutId = null;
        if (!menu) { return; }

        const showMenu = () => { clearTimeout(hideTimeoutId); item.classList.add('dropdown-active'); };
        const startHideTimer = () => { clearTimeout(hideTimeoutId); hideTimeoutId = setTimeout(() => { item.classList.remove('dropdown-active'); }, HIDE_DELAY); };

        item.addEventListener('mouseenter', showMenu);
        item.addEventListener('mouseleave', startHideTimer);
        menu.addEventListener('mouseenter', () => clearTimeout(hideTimeoutId));
        menu.addEventListener('mouseleave', startHideTimer);
    });

    const brightnessSlider = document.getElementById('brightnessSlider');
    const pageContentWrapper = document.getElementById('page-content-wrapper');

    const applyOpacity = (opacityValue) => {
        if (pageContentWrapper) {
            const minInput = 50;
            const maxInput = 200;
            const minOutputOpacity = 0.55; // Ensure minimum visibility
            const maxOutputOpacity = 2.0;

            const numericOpacityValue = parseFloat(opacityValue);
            const clampedInput = Math.max(minInput, Math.min(numericOpacityValue, maxInput));
            const normalizedInput = (clampedInput - minInput) / (maxInput - minInput);
            const targetOpacity = minOutputOpacity + normalizedInput * (maxOutputOpacity - minOutputOpacity);
            const finalOpacity = Math.max(minOutputOpacity, Math.min(targetOpacity, maxOutputOpacity));
            pageContentWrapper.style.opacity = finalOpacity;
        } else {
             console.warn('Navbar.js: Element with ID "page-content-wrapper" not found. Cannot apply opacity.');
        }
    };

    if (brightnessSlider) {
        const savedBrightness = localStorage.getItem('brightnessLevel');
        if (savedBrightness) {
            brightnessSlider.value = savedBrightness;
            applyOpacity(savedBrightness);
        } else {
            applyOpacity(brightnessSlider.value); // Apply default if nothing saved
        }

        brightnessSlider.addEventListener('input', () => {
            const currentBrightness = brightnessSlider.value;
            applyOpacity(currentBrightness);
            try {
                localStorage.setItem('brightnessLevel', currentBrightness);
            } catch (e) {
                 console.error("Navbar.js: Error saving to localStorage:", e);
            }
        });

    } else {
        console.warn("Navbar.js: Brightness slider element not found.");
    }

});