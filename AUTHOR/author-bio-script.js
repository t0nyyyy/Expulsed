// author-bio-script.js - JavaScript for the AUTHOR BIO page

document.addEventListener('DOMContentLoaded', () => {
    // console.log("Author Bio: Script loaded (v_faster_h1_fix).");

    const authorP1 = document.getElementById('author-p1');
    const authorP2 = document.getElementById('author-p2');
    const authorTitle = document.getElementById('author-page-title');
    const paragraphsForEffect = [authorP1, authorP2].filter(p => p instanceof HTMLElement);

    let activeTimers = [];
    let keywordHoverListenersAuthor = [];

    const FASTER_TRANSITION_DURATION = 400; // ms, matches the 0.4s filter transition in CSS
    const FASTER_WORD_STAGGER = 30; // ms, delay between each word appearing
    const FASTER_INITIAL_PARA_DELAY = 150; // ms, delay before first paragraph word if title exists
    const FASTER_INITIAL_TITLE_DELAY = 50; // ms, delay before first title word


    function clearActiveTimers() {
        activeTimers.forEach(timerId => clearTimeout(timerId));
        activeTimers = [];
    }

    function activateKeywordPulseAuthor() {
        keywordHoverListenersAuthor.forEach(item => item.element.removeEventListener(item.type, item.listener));
        keywordHoverListenersAuthor = [];
        const container = document.getElementById('author-bio-text');
        if (!container) return;
        const allKeywords = container.querySelectorAll('.keyword');
        allKeywords.forEach(kw => {
            const mouseoverListener = () => kw.classList.add('active-pulse');
            const mouseoutListener = () => kw.classList.remove('active-pulse');
            kw.addEventListener('mouseover', mouseoverListener);
            kw.addEventListener('mouseout', mouseoutListener);
            keywordHoverListenersAuthor.push({ element: kw, type: 'mouseover', listener: mouseoverListener });
            keywordHoverListenersAuthor.push({ element: kw, type: 'mouseout', listener: mouseoutListener });
        });
    }

    function prepareElementsForFocusBlur(paragraphElements) {
        let animatedWordSpans = [];
        paragraphElements.forEach(element => {
            if (!element) return;
            if (typeof element.dataset.originalFullHtml === 'undefined') {
                element.dataset.originalFullHtml = element.innerHTML;
            }
            const fullHtmlContent = element.dataset.originalFullHtml;
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
        });
        return animatedWordSpans;
    }

    async function applyFocusBlurEffectToBio() {
        clearActiveTimers();
        let animationCompletionPromises = [];
        // console.log("Author Bio: Applying FASTER focus blur effect...");

        let currentOverallDelay = FASTER_INITIAL_TITLE_DELAY;

        if (authorTitle) {
            if (typeof authorTitle.dataset.originalFullHtml === 'undefined') {
                 authorTitle.dataset.originalFullHtml = authorTitle.innerHTML;
            }
            // Get raw text, strip potential html, trim, then split by multiple spaces
            const titleTextContent = authorTitle.dataset.originalFullHtml.replace(/<[^>]+>/g, "").trim();
            authorTitle.innerHTML = ''; 
            
            const titleWords = titleTextContent.split(/\s+/).filter(w => w.length > 0);

            titleWords.forEach((word, idx) => {
                const titleSpan = document.createElement('span');
                titleSpan.className = 'word-span';
                titleSpan.textContent = word;
                authorTitle.appendChild(titleSpan);

                if (idx < titleWords.length - 1) { // Add space if not the last word
                    authorTitle.appendChild(document.createTextNode(" "));
                }
                
                const titlePromise = new Promise(resolve => {
                    activeTimers.push(setTimeout(() => {
                        titleSpan.classList.add('visible');
                        activeTimers.push(setTimeout(resolve, FASTER_TRANSITION_DURATION)); 
                    }, currentOverallDelay));
                });
                animationCompletionPromises.push(titlePromise);
                currentOverallDelay += FASTER_WORD_STAGGER; // Stagger for next word in title
            });
            authorTitle.style.visibility = 'visible';
        }
        
        // Add a small delay after title before paragraphs start
        currentOverallDelay += FASTER_INITIAL_PARA_DELAY; 
        
        paragraphsForEffect.forEach(p => { if(p) p.style.visibility = 'visible'; });
        const allWordSpans = prepareElementsForFocusBlur(paragraphsForEffect);
        
        const processedHighlightParents = new Set();

        allWordSpans.forEach((span, index) => { // index here is per-paragraph, not global
            const wordPromise = new Promise(resolve => {
                const delay = currentOverallDelay + index * FASTER_WORD_STAGGER; 
                activeTimers.push(setTimeout(() => {
                    span.classList.add('visible'); 
                    let parent = span.parentElement;
                    if (parent && (parent.tagName === 'MARK' || parent.classList.contains('tech-highlight'))) {
                        if (!processedHighlightParents.has(parent)) {
                            parent.classList.add('highlight-visible');
                            processedHighlightParents.add(parent);
                        }
                    }
                    activeTimers.push(setTimeout(resolve, FASTER_TRANSITION_DURATION)); 
                }, delay));
            });
            animationCompletionPromises.push(wordPromise);
        });

        await Promise.all(animationCompletionPromises);
        // console.log("Author Bio: Focus blur effect complete. Activating keyword pulse.");
        activateKeywordPulseAuthor();
    }

    const body = document.body;
    if (body.classList.contains('gatekeeper-hide-initial')) {
        const observer = new MutationObserver((mutationsList, observerInstance) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!body.classList.contains('gatekeeper-hide-initial')) {
                        setTimeout(applyFocusBlurEffectToBio, 200);
                        observerInstance.disconnect();
                        return;
                    }
                }
            }
        });
        observer.observe(body, { attributes: true });
    } else {
        setTimeout(applyFocusBlurEffectToBio, 500);
    }
});