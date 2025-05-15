// cosmic-backdrop2.js
document.addEventListener('DOMContentLoaded', () => {
    const spaceBackground = document.querySelector('.space-background');
    if (!spaceBackground) {
        console.error('Cosmic backdrop.js: .space-background not found'); return;
    }
    const starField = document.querySelector('.star-field');
    if (!starField) {
        console.error('Cosmic backdrop.js: .star-field not found'); return;
    }

    const cosmicDust = document.createElement('div');
    cosmicDust.className = 'cosmic-dust';
    spaceBackground.appendChild(cosmicDust);

    const starSettings = {
        totalStars: 450, whiteStars: 225, yellowStars: 90, goldStars: 90, redStars: 45,
        starSpeed: 15, replenishInterval: 2000
    };

    const activeStars = [];
    let lastUpdateTime = Date.now();
    let animationFrameId = null;

    function createStar(className, minSize, maxSize, initialXPos = null) {
        const star = document.createElement('div');
        star.className = className;
        const size = Math.random() * (maxSize - minSize) + minSize;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        const xPos = initialXPos !== null ? initialXPos : Math.random() * 100;
        const yPos = Math.random() * 100;
        star.style.left = `${xPos}%`;
        star.style.top = `${yPos}%`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.opacity = 0.1;
        setTimeout(() => { star.style.opacity = '1'; }, 10);
        const starData = {
            element: star, xPos: xPos, yPos: yPos, size: size,
            speed: (Math.random() * 0.3 + 0.85) * starSettings.starSpeed,
            className: className
        };
        activeStars.push(starData);
        starField.appendChild(star);
        return starData;
    }

    function createInitialStars() {
        const screenWidthsToPrepopulate = 2;
        for (let screenIndex = 0; screenIndex < screenWidthsToPrepopulate; screenIndex++) {
            const xOffset = screenIndex * 100;
            for (let i = 0; i < starSettings.whiteStars; i++) {
                createStar('star', 0.7, 4.5, xOffset + Math.random() * 100);
            }
            for (let i = 0; i < starSettings.yellowStars; i++) {
                createStar('star star-yellow', 1.2, 3.8, xOffset + Math.random() * 100);
            }
            for (let i = 0; i < starSettings.goldStars; i++) {
                createStar('star star-gold', 1.5, 4, xOffset + Math.random() * 100);
            }
            for (let i = 0; i < starSettings.redStars; i++) {
                createStar('star star-red', 1.2, 3.5, xOffset + Math.random() * 100);
            }
        }
    }

    function createRightEdgeStar(className) {
        let minSize, maxSize;
        if (className.includes('star-yellow')) { minSize = 1.2; maxSize = 3.8; }
        else if (className.includes('star-gold')) { minSize = 1.5; maxSize = 4; }
        else if (className.includes('star-red')) { minSize = 1.2; maxSize = 3.5; }
        else { minSize = 0.7; maxSize = 4.5; }
        const star = document.createElement('div');
        star.className = className;
        const size = Math.random() * (maxSize - minSize) + minSize;
        star.style.width = `${size}px`; star.style.height = `${size}px`;
        const xPos = 100 + (Math.random() * 5);
        const yPos = Math.random() * 100;
        star.style.left = `${xPos}%`; star.style.top = `${yPos}%`;
        star.style.animationDuration = `${Math.random() * 3 + 2}s`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.opacity = 0.1;
        setTimeout(() => { star.style.opacity = '1'; }, 10);
        const starData = { element: star, xPos: xPos, yPos: yPos, size: size, speed: (Math.random() * 0.3 + 0.85) * starSettings.starSpeed, className: className };
        activeStars.push(starData);
        starField.appendChild(star);
        return starData;
    }

    function replenishStars() {
        const counts = { 'star': 0, 'star star-yellow': 0, 'star star-gold': 0, 'star star-red': 0 };
        activeStars.forEach(star => {
            if (star.xPos > -5 && !star.removed) {
                counts[star.className] = (counts[star.className] || 0) + 1;
            }
        });
        const needed = {
            'star': Math.max(0, starSettings.whiteStars - counts['star']),
            'star star-yellow': Math.max(0, starSettings.yellowStars - counts['star star-yellow']),
            'star star-gold': Math.max(0, starSettings.goldStars - counts['star star-gold']),
            'star star-red': Math.max(0, starSettings.redStars - counts['star star-red'])
        };
        const maxAddPerReplenish = 10;
        let addedThisCycle = 0;
        const typesToReplenish = ['star', 'star star-yellow', 'star star-gold', 'star star-red'];
        for (const type of typesToReplenish) {
            const canAdd = maxAddPerReplenish - addedThisCycle;
            const willAdd = Math.min(needed[type], canAdd);
            for (let i = 0; i < willAdd; i++) {
                createRightEdgeStar(type);
            }
            addedThisCycle += willAdd;
            if (addedThisCycle >= maxAddPerReplenish) break;
        }
    }

    let lastReplenishTime = 0;
    function throttledReplenish() {
        const now = Date.now();
        if (now - lastReplenishTime > starSettings.replenishInterval) {
            replenishStars();
            lastReplenishTime = now;
        }
    }

    function animateStars() {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;
        const maxDelta = 0.1;
        const actualDelta = Math.min(deltaTime, maxDelta);
        activeStars.forEach(star => {
            if (star.removed) return;
            const windowWidth = window.innerWidth;
            const pixelMove = star.speed * actualDelta;
            const percentMove = (pixelMove / windowWidth) * 100;
            star.xPos -= percentMove;
            if (star.xPos < 110 && star.xPos > -10) {
                star.element.style.left = `${star.xPos}%`;
            }
            if (star.xPos < -5) {
                star.element.remove();
                star.removed = true;
            }
        });
        for (let i = activeStars.length - 1; i >= 0; i--) {
            if (activeStars[i].removed) {
                activeStars.splice(i, 1);
            }
        }
        throttledReplenish();
        animationFrameId = requestAnimationFrame(animateStars);
    }

    function stopAnimation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function createDustClouds(count = 3) {
        for (let i = 0; i < count; i++) {
            const dustCloud = document.createElement('div');
            dustCloud.className = 'dust-cloud';
            const cloudType = Math.random() > 0.5 ? 'dust-cloud-light' : 'dust-cloud-dark';
            dustCloud.classList.add(cloudType);
            const width = Math.random() * 200 + 200;
            const height = Math.random() * 150 + 100;
            dustCloud.style.width = `${width}px`;
            dustCloud.style.height = `${height}px`;
            dustCloud.style.top = `${Math.random() * 70 + 15}%`;
            dustCloud.style.animationDelay = `${Math.random() * 10}s`;
            dustCloud.style.animationDuration = `${Math.random() * 20 + 40}s`;
            spaceBackground.appendChild(dustCloud);
        }
    }

    function createNebula(count = 2) {
        for (let i = 0; i < count; i++) {
            const nebula = document.createElement('div');
            nebula.className = 'nebula';
            nebula.style.left = `${10 + Math.random() * 60}%`;
            nebula.style.top = `${20 + Math.random() * 50}%`;
            const scale = 0.8 + Math.random() * 0.4;
            nebula.style.transform = `scale(${scale})`;
            nebula.style.animationDelay = `${Math.random() * 20}s`;
            spaceBackground.appendChild(nebula);
        }
    }

    createInitialStars();
    createDustClouds();
    createNebula();
    lastUpdateTime = Date.now();
    animateStars();

    let dustIntervalId = setInterval(() => {
        document.querySelectorAll('.dust-cloud').forEach(el => el.remove());
        createDustClouds();
    }, 120000);

    let lastParallaxUpdate = 0;
    const parallaxThrottleMs = 50;
    function handleMouseMove(e) {
        const now = Date.now();
        if (now - lastParallaxUpdate < parallaxThrottleMs) return;
        lastParallaxUpdate = now;
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        if (cosmicDust) {
            cosmicDust.style.transform = `translate(${x * -8}px, ${y * -8}px)`;
        }
        document.querySelectorAll('.nebula').forEach(nebula => {
            const currentScaleMatch = nebula.style.transform.match(/scale\((.*?)\)/);
            const currentScale = currentScaleMatch ? currentScaleMatch[1] : 1;
            nebula.style.transform = `translate(${x * -5}px, ${y * -5}px) scale(${currentScale})`;
        });
    }
    document.addEventListener('mousemove', handleMouseMove);

    function cleanupCosmicBackdrop() {
        stopAnimation();
        clearInterval(dustIntervalId);
        document.removeEventListener('mousemove', handleMouseMove);
        if (cosmicDust) cosmicDust.remove();
        document.querySelectorAll('.dust-cloud').forEach(el => el.remove());
        document.querySelectorAll('.nebula').forEach(el => el.remove());
        activeStars.forEach(star => star.element.remove());
        activeStars.length = 0;
    }
    window.addEventListener('unload', cleanupCosmicBackdrop);

    const brightnessSlider = document.getElementById('brightnessSlider');
    if (brightnessSlider) {
        const updateBackgroundOpacity = () => {
            if (!spaceBackground) return;
            const brightnessValue = brightnessSlider.value;
            const normalizedBrightness = parseFloat(brightnessValue) / 100;
            let backgroundOpacity = 0.9;
            if (normalizedBrightness < 1.0) {
                backgroundOpacity = 0.3 + (normalizedBrightness - 0.5) * (0.9 - 0.3) / (1.0 - 0.5);
            } else if (normalizedBrightness > 1.0) {
                backgroundOpacity = 0.9 + (normalizedBrightness - 1.0) * (1.0 - 0.9) / (2.0 - 1.0);
            }
            backgroundOpacity = Math.max(0.3, Math.min(backgroundOpacity, 1.0));
            spaceBackground.style.opacity = backgroundOpacity;
        };
        brightnessSlider.addEventListener('input', updateBackgroundOpacity);
        if (typeof spaceBackground !== 'undefined' && spaceBackground) {
            updateBackgroundOpacity();
        }
    }
});