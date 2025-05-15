// index-script.js
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
        allKeywords.forEach((kw) => {
            const mouseoverListener = () => kw.classList.add('active-pulse');
            const mouseoutListener = () => kw.classList.remove('active-pulse');
            kw.addEventListener('mouseover', mouseoverListener);
            kw.addEventListener('mouseout', mouseoutListener);
            keywordHoverListeners.push({element: kw, type: 'mouseover', listener: mouseoverListener});
            keywordHoverListeners.push({element: kw, type: 'mouseout', listener: mouseoutListener});
        });
    }

    let activeTimers = [];

    const FOCUS_BLUR_TRANSITION_DURATION = 400;
    const FOCUS_BLUR_WORD_STAGGER = 30;
    const FOCUS_BLUR_INITIAL_DELAY = 150;

    function clearActiveTimers() {
        activeTimers.forEach(timerId => clearTimeout(timerId));
        activeTimers.forEach(timerId => clearInterval(timerId));
        activeTimers = [];
    }

    function prepareElementContentForFocusBlur(element) {
        let animatedWordSpans = [];
        if (!element) return animatedWordSpans;

        if (typeof element.dataset.fullHtml === 'undefined' || element.dataset.fullHtml === "") {
            element.dataset.fullHtml = element.innerHTML;
        }
        const fullHtmlContent = element.dataset.fullHtml;

        element.innerHTML = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullHtmlContent;

        function processNode(sourceNode, parentElementToAppendTo) {
            if (sourceNode.nodeType === Node.TEXT_NODE) {
                const wordsAndSpaces = sourceNode.textContent.split(/(\s+)/);
                wordsAndSpaces.forEach(textPart => {
                    if (textPart.trim() === '') {
                        parentElementToAppendTo.appendChild(document.createTextNode(textPart));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'word-span';
                        span.textContent = textPart;
                        parentElementToAppendTo.appendChild(span);
                        animatedWordSpans.push(span);
                    }
                });
            } else if (sourceNode.nodeType === Node.ELEMENT_NODE) {
                const clonedElement = sourceNode.cloneNode(false);
                parentElementToAppendTo.appendChild(clonedElement);
                Array.from(sourceNode.childNodes).forEach(childNode => {
                    processNode(childNode, clonedElement);
                });
            }
        }
        Array.from(tempDiv.childNodes).forEach(childNode => {
            processNode(childNode, element);
        });
        return animatedWordSpans;
    }

    async function applyFocusBlurEffectToBlurb(element) {
        if (!element) {
            console.error("applyFocusBlurEffectToBlurb: Element is null.");
            return;
        }

        clearActiveTimers();
        element.style.visibility = 'visible';

        const allWordSpans = prepareElementContentForFocusBlur(element);

        if (allWordSpans.length === 0 && element.dataset.fullHtml && element.dataset.fullHtml.trim() !== '') {
             console.warn(`WARNING: No word spans generated for ${element.id}, although fullHtmlContent was not empty. Check HTML parsing. Content:`, element.dataset.fullHtml);
        }

        let animationPromises = [];
        let currentOverallDelay = FOCUS_BLUR_INITIAL_DELAY;
        const processedHighlightParents = new Set();

        allWordSpans.forEach((span) => {
            const wordPromise = new Promise(resolve => {
                const delay = currentOverallDelay;
                activeTimers.push(setTimeout(() => {
                    span.classList.add('visible');

                    let parent = span.parentElement;
                    while(parent && parent !== element) {
                        if (parent.tagName === 'MARK' || parent.classList.contains('tech-highlight')) {
                            if (!processedHighlightParents.has(parent)) {
                                parent.classList.add('highlight-visible');
                                processedHighlightParents.add(parent);
                            }
                            break;
                        }
                        parent = parent.parentElement;
                    }
                    activeTimers.push(setTimeout(resolve, FOCUS_BLUR_TRANSITION_DURATION));
                }, delay));
            });
            animationPromises.push(wordPromise);
            currentOverallDelay += FOCUS_BLUR_WORD_STAGGER;
        });

        await Promise.all(animationPromises);
    }

    async function initBlurbEffect() {
        clearActiveTimers();
        const blurbElement = document.getElementById('blurb-p1');

        if (blurbElement) {
            if (typeof blurbElement.dataset.fullHtml === 'undefined' || blurbElement.dataset.fullHtml.trim() === "") {
                blurbElement.dataset.fullHtml = blurbElement.innerHTML;
            }
        } else {
            console.error("initBlurbEffect: blurb-p1 element not found!");
            return;
        }

        const fullHtmlStored = blurbElement.dataset.fullHtml;

        if (fullHtmlStored && fullHtmlStored.trim() !== '') {
            await applyFocusBlurEffectToBlurb(blurbElement);
        } else {
            console.warn("Skipping Focus Blur effect for blurb-p1 due to empty content.");
            if (blurbElement) blurbElement.style.visibility = 'visible';
        }
        activateKeywordPulse();
    }

    const body = document.body;
    if (body.classList.contains('gatekeeper-hide-initial')) {
        const observer = new MutationObserver((mutationsList, observerInstance) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!body.classList.contains('gatekeeper-hide-initial')) {
                        setTimeout(initBlurbEffect, 200);
                        observerInstance.disconnect();
                        return;
                    }
                }
            }
        });
        observer.observe(body, { attributes: true });
    } else {
        setTimeout(initBlurbEffect, 500);
    }
});