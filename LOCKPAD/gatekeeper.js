// LOCKPAD/gatekeeper.js
document.addEventListener('DOMContentLoaded', () => {
    const hasInitialHideClass = document.body.classList.contains('gatekeeper-hide-initial');

    function forceHideContentIfNeeded() {
        if (!hasInitialHideClass) {
            const elementsToHideSelectors = [
                '#page-content-wrapper', 'body > header', 'body > nav.navbar',
                'body > canvas', 'body > #loading-screen', 'body > .matrix-rain',
                'body > .space-background-container', '#page-content-wrapper .button-container'
            ];
            elementsToHideSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el) {
                        el.style.visibility = 'hidden';
                        el.style.opacity = '0';
                        el.style.pointerEvents = 'none';
                    }
                });
            });
            document.body.classList.add('content-hidden-by-default');
        }
    }
    forceHideContentIfNeeded();

    if (document.body.classList.contains('gatekeeper-processed')) {
         return;
     }
    document.body.classList.add('gatekeeper-processed');

    let config = null;
    let lockpadUIManager = null;
    let lockpadOverlayElement = null;

    let currentPagePath = window.location.pathname;
    // Adjust currentPagePath to consistently include /Expulsed/ if needed
    if (!currentPagePath.startsWith('/Expulsed/')) {
        if (currentPagePath === '/' || currentPagePath === '') {
             currentPagePath = '/Expulsed/index.html';
        } else {
             // Handle cases where /Expulsed/ might be missing but it's not root
             // This part might need refinement depending on edge cases, but let's start simple
             if (currentPagePath.startsWith('/')) {
                 currentPagePath = '/Expulsed' + currentPagePath;
             } else {
                 currentPagePath = '/Expulsed/' + currentPagePath;
             }
        }
    }
    // Ensure it ends with .html if it looks like a directory within Expulsed
    if (currentPagePath.startsWith('/Expulsed/') && !currentPagePath.endsWith('.html') && currentPagePath.lastIndexOf('/') > 0) {
         if (!currentPagePath.endsWith('/')) currentPagePath += '/';
         currentPagePath += 'index.html'; // Assuming index.html for subdirs
    }
    // Standardize index.html mapping from root /Expulsed/
    if (currentPagePath === '/Expulsed/' || currentPagePath === '/Expulsed') {
        currentPagePath = '/Expulsed/index.html';
    }


    async function fetchConfig() {
        try {
            // ***** CORRECTED PATH *****
            const response = await fetch('/Expulsed/LOCKPAD/gateconfig.json?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) { console.error("Gatekeeper: Failed to fetch config:", error); return null; }
    }

    async function fetchLockpadHtml() {
         try {
            // ***** CORRECTED PATH *****
            const response = await fetch('/Expulsed/LOCKPAD/lockpad.html?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.text();
        } catch (error) { console.error("Gatekeeper: Failed to fetch lockpad HTML:", error); return null; }
    }

    function revealPageContent() {
        if (hasInitialHideClass) {
            document.body.classList.remove('gatekeeper-hide-initial');
        }

        const elementsToRevealSelectors = [
             '#page-content-wrapper', 'body > header', 'body > nav.navbar',
             'body > canvas', 'body > #loading-screen', 'body > .matrix-rain',
             'body > .space-background-container',
             '#page-content-wrapper .button-container'
        ];

        elementsToRevealSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el) return;

                let needsStyleRemoval = false;
                if (!hasInitialHideClass && (el.style.visibility === 'hidden' || el.style.opacity === '0')) {
                    needsStyleRemoval = true;
                } else if (hasInitialHideClass) {
                    needsStyleRemoval = true;
                }

                if (el.id === 'page-content-wrapper') {
                    el.style.removeProperty('visibility');
                    el.style.removeProperty('pointer-events');
                    el.style.removeProperty('opacity');

                    try {
                        const savedBrightness = localStorage.getItem('brightnessLevel');
                        const brightnessSliderElement = document.getElementById('brightnessSlider');
                        let valueToUse = brightnessSliderElement ? brightnessSliderElement.value : '100';
                        if (savedBrightness) {
                            valueToUse = savedBrightness;
                        }
                        const minInput = 50;
                        const maxInput = 200;
                        const minOutputOpacity = 0.55;
                        const maxOutputOpacity = 2.0;
                        const numericValueToApply = parseFloat(valueToUse);
                        const clampedInput = Math.max(minInput, Math.min(numericValueToApply, maxInput));
                        const normalizedInput = (clampedInput - minInput) / (maxInput - minInput);
                        const targetOpacity = minOutputOpacity + normalizedInput * (maxOutputOpacity - minOutputOpacity);
                        const finalOpacity = Math.max(minOutputOpacity, Math.min(targetOpacity, maxOutputOpacity));
                        el.style.opacity = finalOpacity;
                    } catch (e) {
                        console.error("Gatekeeper: Error re-applying opacity:", e);
                        el.style.opacity = 1; // Failsafe
                    }
                } else {
                    if (needsStyleRemoval) {
                        el.style.removeProperty('visibility');
                        el.style.removeProperty('pointer-events');
                        el.style.removeProperty('opacity');
                    }
                }
            });
        });

        document.body.classList.remove('content-hidden-by-default');

        if (typeof window.setPageReady === 'function') {
            window.setPageReady();
        } else {
             const loadingScreen = document.getElementById('loading-screen');
             if(loadingScreen) {
                 loadingScreen.style.removeProperty('visibility');
                 loadingScreen.style.removeProperty('opacity');
                 loadingScreen.style.removeProperty('pointer-events');
             }
        }
    }

    function showLockpad(htmlFragment, pinToUse, allowPageBg) {
        if (!pinToUse || typeof pinToUse !== 'string' || pinToUse.trim() === '') {
             console.error("Gatekeeper: Invalid or missing PIN provided to showLockpad. Cannot initialize lockpad.");
             revealPageContent();
             return;
         }

        lockpadOverlayElement = document.createElement('div');
        lockpadOverlayElement.classList.add('lockpad-overlay');
        if (allowPageBg) { lockpadOverlayElement.classList.add('allow-bg'); }
        else { lockpadOverlayElement.classList.add('opaque'); }
        document.body.prepend(lockpadOverlayElement);
        lockpadOverlayElement.innerHTML = htmlFragment;
        document.body.classList.add('lockpad-active');

        // ***** CORRECTED PATH *****
        fetch('/Expulsed/LOCKPAD/lockpad-ui.js?t=' + Date.now())
            .then(response => response.ok ? response.text() : Promise.reject(`UI script fetch error ${response.status}`))
            .then(scriptText => {
                try {
                    new Function(scriptText)();
                    if (typeof window.initializeLockpadUI === 'function') {
                        lockpadUIManager = window.initializeLockpadUI((pinAttempt) => handlePinAttempt(pinAttempt, pinToUse));
                        if (!lockpadUIManager) throw new Error("initializeLockpadUI failed.");
                    } else { throw new Error("initializeLockpadUI not defined."); }
                } catch (initError) { console.error("Gatekeeper: UI init error:", initError); removeLockpad(); }
            })
            .catch(fetchError => { console.error("Gatekeeper: UI script fetch error:", fetchError); removeLockpad(); });
    }

    function removeLockpad() {
        lockpadOverlayElement?.parentNode?.removeChild(lockpadOverlayElement);
        lockpadOverlayElement = null;
        lockpadUIManager = null;
        document.body.classList.remove('lockpad-active');
        revealPageContent();
    }

    function handlePinAttempt(enteredPin, correctPinToUse) {
        if (!lockpadUIManager) return;
        if (enteredPin === correctPinToUse) {
            lockpadUIManager.showStatus("ACCESS GRANTED", "granted");
            setTimeout(removeLockpad, 600);
        } else {
            lockpadUIManager.showStatus("ACCESS DENIED", "denied");
            lockpadUIManager.clearInput();
            lockpadOverlayElement?.querySelector('.lockpad-panel')?.classList.add('shake');
            setTimeout(() => { lockpadOverlayElement?.querySelector('.lockpad-panel')?.classList.remove('shake'); }, 500);
        }
     }

     async function runGatekeeper() {
         config = await fetchConfig();
         if (!config) { console.warn("Gatekeeper: No config found. Revealing page."); revealPageContent(); return; }

         // Use the adjusted currentPagePath for lookup
         const adjustedPathForLookup = currentPagePath; // Using the path adjusted at the beginning
         const pageConfig = config.pages[adjustedPathForLookup];
         const globalPin = config.globalPin;

         console.log(`Gatekeeper: Checking protection for adjusted path: ${adjustedPathForLookup}`); // Debug Log

         if (pageConfig && pageConfig.protected) {
             let pinForThisPage = globalPin;
             if (pageConfig.pin && typeof pageConfig.pin === 'string' && pageConfig.pin.trim() !== "") {
                 pinForThisPage = pageConfig.pin.trim();
             } else if (globalPin && typeof globalPin === 'string' && globalPin.trim() !== "") {
                  // pinForThisPage is already set to globalPin
             } else {
                  pinForThisPage = null;
             }

             if (!pinForThisPage) {
                 console.error(`Gatekeeper: Page ${adjustedPathForLookup} protected, but NO valid PIN found (page-specific or global)! Revealing page.`);
                 revealPageContent();
                 return;
             }

             const lockpadHtml = await fetchLockpadHtml();
             if (lockpadHtml) {
                 const allowBg = pageConfig.showPageBackground === true;
                 showLockpad(lockpadHtml, pinForThisPage, allowBg);
             } else {
                 console.error("Gatekeeper: Cannot show lockpad, HTML failed. Revealing page.");
                 revealPageContent();
             }
         } else {
             console.log(`Gatekeeper: Page ${adjustedPathForLookup} not configured as protected or config missing. Revealing page.`); // Debug Log
             document.body.classList.remove('lockpad-active');
             revealPageContent();
         }
     }


    runGatekeeper();

}); // End DOMContentLoaded