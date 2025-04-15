// typewriterEffect.js

// Global variable to keep track of the current typing animation
window.currentTypingAnimation = null;

// Typewriter effect function with cancellation
export function typeText(textContainer, fullText, callback) {
    textContainer.innerHTML = '';
    let index = 0;
    const typingSpeed = 10;
    let timeoutId = null;
    let isCancelled = false;

    function type() {
        if (isCancelled) return;

        if (index < fullText.length) {
            textContainer.innerHTML = fullText.substring(0, index + 1);
            textContainer.innerHTML += '<span class="cursor">_</span>';
            index++;
            timeoutId = setTimeout(type, typingSpeed);
        } else {
            textContainer.innerHTML = fullText + '<span class="cursor">_</span>';
            if (callback) callback();
        }
    }

    type();

    return function cancel() {
        isCancelled = true;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };
}