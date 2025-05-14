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
    const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!?§$%&/()[]{}=+*~#'-_.:,;";

    function clearActiveTimers() {
        activeTimers.forEach(timerId => clearTimeout(timerId));
        activeTimers.forEach(timerId => clearInterval(timerId));
        activeTimers = [];
    }

    async function applyMatrixEffectToElement(element, fullHtmlContent) {
        if (!element) {
            console.error("applyMatrixEffectToElement: Element is null. Cannot apply effect.");
            return;
        }

        element.innerHTML = '';
        let wordSpansToAnimate = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fullHtmlContent;

        function processNode(node, parentElementToAppendTo) {
            if (node.nodeType === Node.TEXT_NODE) {
                const wordsAndSpaces = node.textContent.split(/(\s+)/);
                wordsAndSpaces.forEach(textPart => {
                    if (textPart.trim() === '') {
                        parentElementToAppendTo.appendChild(document.createTextNode(textPart));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'word-span matrix-initial-scramble';
                        span.dataset.originalWord = textPart;
                        let initialScramble = "";
                        for (let k = 0; k < textPart.length; k++) {
                            initialScramble += MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
                        }
                        span.textContent = initialScramble;
                        parentElementToAppendTo.appendChild(span);
                        wordSpansToAnimate.push(span);
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const clonedElement = node.cloneNode(false);
                parentElementToAppendTo.appendChild(clonedElement);
                Array.from(node.childNodes).forEach(childNode => processNode(childNode, clonedElement));
            }
        }

        Array.from(tempDiv.childNodes).forEach(childNode => processNode(childNode, element));

        if (wordSpansToAnimate.length === 0 && fullHtmlContent.trim() !== '') {
            console.warn(`WARNING: No word spans generated for ${element.id}, although fullHtmlContent was not empty. Check HTML parsing. Content:`, fullHtmlContent);
        }

        wordSpansToAnimate.forEach(span => {
            let parent = span.parentElement;
            while (parent && parent !== element) {
                if (parent.tagName === 'MARK' || parent.classList.contains('neon-link') || parent.classList.contains('tech-highlight')) {
                    if (!parent.classList.contains('content-scrambling')) {
                        parent.classList.add('content-scrambling');
                    }
                    break; 
                }
                parent = parent.parentElement;
            }
        });

        const scrambleIterations = 4;
        const scrambleCharInterval = 30;
        const wordRevealDelay = 35;

        for (let i = 0; i < wordSpansToAnimate.length; i++) {
            const span = wordSpansToAnimate[i];
            const originalWord = span.dataset.originalWord;
            const wordLen = originalWord.length;
            let currentIteration = 0;

            const intervalId = setInterval(() => {
                if (currentIteration >= scrambleIterations) {
                    clearInterval(intervalId);
                    span.textContent = originalWord;
                    span.style.color = '';
                    span.classList.remove('matrix-initial-scramble');

                    let styledParent = span.parentElement;
                    while(styledParent && styledParent !== element) {
                        if (styledParent.classList.contains('content-scrambling')) {
                            break; 
                        }
                        styledParent = styledParent.parentElement;
                    }

                    if (styledParent && styledParent !== element && styledParent.classList.contains('content-scrambling')) {
                        const siblingWordSpans = Array.from(styledParent.querySelectorAll('.word-span'));
                        const allSiblingsUnscrambled = siblingWordSpans.every(s => !s.classList.contains('matrix-initial-scramble'));
                        
                        if (allSiblingsUnscrambled) {
                            styledParent.classList.remove('content-scrambling');
                        }
                    }
                } else {
                    let randomWord = "";
                    for (let j = 0; j < wordLen; j++) {
                        let charCandidate;
                        do {
                            charCandidate = MATRIX_CHARS.charAt(Math.floor(Math.random() * MATRIX_CHARS.length));
                        } while (charCandidate === ' ');
                        randomWord += charCandidate;
                    }
                    span.textContent = randomWord;
                    currentIteration++;
                }
            }, scrambleCharInterval);
            activeTimers.push(intervalId);

            await new Promise(resolve => {
                const timeoutId = setTimeout(resolve, wordRevealDelay);
                activeTimers.push(timeoutId);
            });
        }
    }

    async function initBlurbEffect() {
        clearActiveTimers();
        const blurbElement = document.getElementById('blurb-p1');
        let fullHtml = '';

        if (blurbElement) {
            if (typeof blurbElement.dataset.fullHtml === 'undefined' || blurbElement.dataset.fullHtml === "") {
                blurbElement.dataset.fullHtml = blurbElement.innerHTML;
            }
            fullHtml = blurbElement.dataset.fullHtml;
        } else {
            console.error("initBlurbEffect: blurb-p1 element not found!");
            return;
        }

        if (fullHtml && fullHtml.trim() !== '') {
            blurbElement.style.visibility = 'visible';
            await applyMatrixEffectToElement(blurbElement, fullHtml);
        } else {
            console.warn("Skipping Matrix effect for blurb-p1 due to empty content.");
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