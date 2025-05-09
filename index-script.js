document.addEventListener('DOMContentLoaded', () => {
    function loadSvgArt() {
        fetch('logo.svg')
            .then(response => response.text())
            .then(svgText => {
                const asciiArtContainer = document.getElementById('ascii-art-container');
                if (asciiArtContainer) {
                    asciiArtContainer.innerHTML = svgText;
                } else {
                    console.error("Could not find #ascii-art-container for SVG.");
                }
            })
            .catch(error => console.error('Error loading SVG art:', error));
    }
    loadSvgArt();

    let keywordHoverListeners = [];
    function activateKeywordPulse() {
        keywordHoverListeners.forEach(item => item.element.removeEventListener(item.type, item.listener)); 
        keywordHoverListeners = [];
        
        const container = document.getElementById('series-blurb-text') || document; 
        const allKeywords = container.querySelectorAll('.keyword');

        allKeywords.forEach(kw => {
            const mouseoverListener = () => kw.classList.add('active-pulse');
            const mouseoutListener = () => kw.classList.remove('active-pulse');
            kw.addEventListener('mouseover', mouseoverListener); 
            kw.addEventListener('mouseout', mouseoutListener);
            keywordHoverListeners.push({element: kw, type: 'mouseover', listener: mouseoverListener});
            keywordHoverListeners.push({element: kw, type: 'mouseout', listener: mouseoutListener});
        });
    }

    let typeTimeoutBlurb;
    function typeOutBlurb(element, fullHtmlContent, speed = 40, addCursor = true) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            
            element.dataset.fullHtml = fullHtmlContent; // Store the full HTML
            const originalHtml = element.dataset.fullHtml;

            element.innerHTML = ''; 
            element.style.visibility = 'visible';

            let i = 0;
            let currentText = '';
            let cursorSpan = null;

            if (addCursor) {
                cursorSpan = document.createElement('span');
                cursorSpan.className = 'typing-cursor';
            }

            function typeCharacter() {
                if (i < originalHtml.length) {
                    if (originalHtml[i] === '<') {
                        let tagEnd = originalHtml.indexOf('>', i);
                        if (tagEnd !== -1) {
                            currentText += originalHtml.substring(i, tagEnd + 1);
                            i = tagEnd; 
                        } else { // Should not happen in well-formed HTML
                            currentText += originalHtml[i];
                        }
                    } else {
                        currentText += originalHtml[i];
                    }
                    
                    element.innerHTML = currentText + (addCursor && cursorSpan ? cursorSpan.outerHTML : '');
                    
                    i++;
                    typeTimeoutBlurb = setTimeout(typeCharacter, speed);
                } else {
                    if (addCursor && cursorSpan && element.lastChild === cursorSpan) {
                         // It might have been removed if innerHTML was set without it
                    }
                    element.innerHTML = originalHtml; // Ensure final state is perfect
                    resolve();
                }
            }
            typeCharacter();
        });
    }

    async function initBlurbTypewriter() {
        const blurbP1 = document.getElementById('blurb-p1');
        const blurbP2 = document.getElementById('blurb-p2');

        let fullHtmlP1 = '';
        let fullHtmlP2 = '';

        if (blurbP1) fullHtmlP1 = blurbP1.innerHTML;
        if (blurbP2) fullHtmlP2 = blurbP2.innerHTML;
        
        if (blurbP1) {
            blurbP1.innerHTML = ''; // Clear for typing
            await typeOutBlurb(blurbP1, fullHtmlP1, 5); // Adjust speed (ms per char)
        }
        if (blurbP2) {
            blurbP2.innerHTML = ''; // Clear for typing
            await typeOutBlurb(blurbP2, fullHtmlP2, 10); 
        }
        
        activateKeywordPulse(); 
    }
    
    const body = document.body;
    if (body.classList.contains('gatekeeper-hide-initial')) {
        const observer = new MutationObserver((mutationsList, observerInstance) => {
            for(const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!body.classList.contains('gatekeeper-hide-initial')) {
                        setTimeout(initBlurbTypewriter, 200); 
                        observerInstance.disconnect(); 
                        return;
                    }
                }
            }
        });
        observer.observe(body, { attributes: true });
    } else {
        setTimeout(initBlurbTypewriter, 500); 
    }
});