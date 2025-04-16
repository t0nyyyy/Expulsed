// svg-animations.js

function createSVGElement(type, attributes) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", type);
    for (const key in attributes) {
        element.setAttribute(key, attributes[key]);
    }
    return element;
}

function animateElement(element, keyframes, options) {
    return element.animate(keyframes, options);
}

function createNetworkNodePulse(containerId) {
    // No changes needed here - this animation was working fine
    const container = document.getElementById(containerId);
    const svg = createSVGElement("svg", { width: '100%', height: '100%', style: 'background-color: #000' });
    container.appendChild(svg);

    let nodes = [];
    let connections = [];
    let connectionIndex = 0;
    const numNodes = 90;
    const horizontalMargin = 10;
    const verticalMargin = 10;

    function generateNodesAndConnections() {
        nodes = [];
        connections = [];
        connectionIndex = 0;
        svg.innerHTML = '';

        for (let i = 0; i < numNodes; i++) {
            const x = horizontalMargin + Math.random() * (svg.clientWidth - 2 * horizontalMargin);
            const y = verticalMargin + Math.random() * (svg.clientHeight - 2 * verticalMargin);
            const node = createSVGElement("circle", { cx: x, cy: y, r: 3, fill: '#00ff00' });
            nodes.push(node);
            svg.appendChild(node);
        }

        let allConnections = [];
        for (let i = 0; i < numNodes; i++) {
            for (let j = i + 1; j < numNodes; j++) {
                if (Math.random() < 0.1) {
                    const connection = createSVGElement("line", {
                        x1: nodes[i].getAttribute('cx'),
                        y1: nodes[i].getAttribute('cy'),
                        x2: nodes[j].getAttribute('cx'),
                        y2: nodes[j].getAttribute('cy'),
                        stroke: '#00ff00',
                        'stroke-width': 0.5,
                        opacity: 0
                    });
                    allConnections.push(connection);
                    svg.appendChild(connection);
                }
            }
        }
        connections = [...allConnections];
    }

    function animateLineDrawing() {
        if (connectionIndex < connections.length) {
            const currentConnection = connections[connectionIndex];
            animateElement(currentConnection, [
                { opacity: 0 },
                { opacity: 0.5 }
            ], {
                duration: 700,
                easing: 'ease-in-out',
                fill: 'forwards'
            }).onfinish = () => {
                connectionIndex++;
                setTimeout(animateLineDrawing, 300);
            };
        } else {
            connectionIndex = 0;
            setTimeout(() => {
                generateNodesAndConnections();
                setTimeout(animateLineDrawing, 1000);
            }, 2000);
        }
    }

    generateNodesAndConnections();
    animateLineDrawing();
}
function createBravoData(containerId) {
    const container = document.getElementById(containerId);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    container.appendChild(canvas);

    const gridSize = 15;
    //  const baseContainerWidth = 1273.33; // REMOVED:  Unnecessary
    //  let cellSize = baseContainerWidth / gridSize; // REMOVED: Calculate dynamically

    //  *** KEY CHANGE: Use container dimensions directly ***
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    let cellSize = container.clientWidth / gridSize; // Calculate based on *actual* container width


    let cells = []; // Keep this outside the functions
    function initializeCells() {
        cells = []; // Clear previous cells
        for (let i = 0; i < gridSize; i++) {
            cells[i] = [];
            for (let j = 0; j < gridSize; j++) {
                cells[i][j] = {
                    opacity: 0.1,
                    targetOpacity: 0.1,
                    animationDuration: 1000 + Math.random() * 1000,
                    animationStart: performance.now(),
                };
            }
        }
    }
     initializeCells(); // Initialize on first load

    function drawGrid() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cell = cells[i][j];

                const timeElapsed = performance.now() - cell.animationStart;
                let progress = timeElapsed / cell.animationDuration;
                if (progress > 1) {
                    progress = 1;
                }

                cell.opacity = cell.opacity + (cell.targetOpacity - cell.opacity) * progress;

                if (progress === 1) {
                    cell.targetOpacity = 0.1 + Math.random() * 0.6;
                    cell.animationStart = performance.now();
                    cell.animationDuration = 1500 + Math.random() * 1000;
                }

                ctx.globalAlpha = cell.opacity;
                ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            }
        }

        requestAnimationFrame(drawGrid);
    }


    function handleResize() {
        // *** KEY CHANGE: Use container dimensions directly ***
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        cellSize = container.clientWidth / gridSize; // Recalculate cellSize
        initializeCells(); // Re-initialize cells
    }

    window.addEventListener('resize', handleResize);

    drawGrid(); // Start the animation
}

function createCharlieDigital(containerId, speedFactor = 1.0) {
    const container = document.getElementById(containerId);
    const svg = createSVGElement("svg", { width: '100%', height: '100%' });
    container.appendChild(svg);

    const numRows = 7;
    const numColumnsVisible = 30;
    const fontSize = 30;
    const columnWidth = fontSize * 0.8;  //  Keep this calculation
    const rowHeight = 300 / numRows; //  Consider making this dynamic too
    // const startX = 0;  //  REMOVED:  Calculate startX dynamically

     // *** KEY CHANGE: Calculate startX to center the text ***
    const startX = (container.clientWidth - numColumnsVisible * columnWidth) / 2 + 12;

    // Create text elements
    for (let i = 0; i < numRows; i++) {
        const textGroup = createSVGElement("g", {});
        svg.appendChild(textGroup);

        for (let j = 0; j < numColumnsVisible; j++) {
            const text = createSVGElement("text", {
                x: startX + j * columnWidth, // Use startX
                y: i * rowHeight + rowHeight / 2 + fontSize / 3, // Fine as is
                'text-anchor': 'middle', // Keep this for centering within columns
                'font-size': fontSize,    // Keep
                fill: '#00ff00'        // Keep
            });
            text.textContent = Math.round(Math.random()); // Keep
            textGroup.appendChild(text);
        }
    }

    // Animation Logic (Simplified and Corrected)
    const baseScrollInterval = 200; // Milliseconds per column shift
    const adjustedInterval = baseScrollInterval * (1 / speedFactor);

    setInterval(() => {
        // Move all text elements one column to the left
        const textElements = svg.querySelectorAll('text');
        textElements.forEach(textElement => {
            let currentX = parseFloat(textElement.getAttribute('x'));
            currentX -= columnWidth;

            // If an element goes off-screen to the left, move it to the right end
            if (currentX < -columnWidth) {
                 currentX += columnWidth * numColumnsVisible; // Keep
            }
            textElement.setAttribute('x', currentX);

            // Update the text content
            textElement.textContent = Math.round(Math.random());
        });
    }, adjustedInterval);
}

function createDeltaScanline(containerId) {
    const container = document.getElementById(containerId);
     const svg = createSVGElement("svg", { width: '100%', height: '100%', style: 'background-color: #000' });
    container.appendChild(svg);

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const keywords = ['function', 'let', 'const', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'from', 'export', 'async', 'await'];
    const variables = ['data', 'value', 'count', 'item', 'index', 'result', 'temp', 'input', 'output', 'config'];
    const operators = ['=', '+', '-', '*', '/', '==', '!=', '<', '>', '+=', '-=', '++', '--', '%'];
    const symbols = ['{', '}', '(', ')', '[', ']', ';', ',', '.', ':', '"', "'", '`'];

    const numLines = 100;
    const fontSize = 18;
    const lineHeight = fontSize * 1.2;
    const startY = 30;
    const startX = 20;

    const lines = [];
    for (let i = 0; i < numLines; i++) {
        lines.push(generateRandomCodeLine(keywords, variables, operators, symbols, characters));
    }

    for (let i = 0; i < lines.length; i++) {
        const text = createSVGElement("text", {
            x: startX,
            y: startY + i * lineHeight,
            'font-size': fontSize,
            fill: '#00ff00',
            opacity: 0.8
        });
        text.textContent = lines[i];
        svg.appendChild(text);
    }

    const scanline = createSVGElement("rect", {
        x: 0,
        y: 0,
        width: '100%',
        height: 2,
        fill: 'rgba(0, 255, 0, 0.5)'
    });
    svg.appendChild(scanline);

    animateScanline(svg, scanline, lineHeight, numLines);

    function animateScanline(svg, scanline, lineHeight, numLines) {
        const duration = 30000;
        const totalHeight = svg.getBoundingClientRect().height;

        animateElement(scanline, [
            { transform: 'translateY(0)' },
            { transform: `translateY(${totalHeight}px)` }
        ], {
            duration: duration,
            iterations: Infinity,
            easing: 'linear'
        });

        const textElements = svg.querySelectorAll('text');
        const totalTextHeight = numLines * lineHeight;
        textElements.forEach(text => {
            animateElement(text, [
                { transform: 'translateY(0)' },
                { transform: `translateY(-${totalTextHeight}px)` }
            ], {
                duration: duration,
                iterations: Infinity,
                easing: 'linear'
            });
        });
    }
}

// Helper functions
function generateRandomCodeLine(keywords, variables, operators, symbols, characters) {
	let line = "";
	const numElements = 5 + Math.floor(Math.random() * 10);

	for (let i = 0; i < numElements; i++) {
		const elementType = Math.random();

		if (elementType < 0.1 && keywords.length > 0) {
			line += keywords[Math.floor(Math.random() * keywords.length)] + " ";
		} else if (elementType < 0.3 && variables.length > 0) {
			line += variables[Math.floor(Math.random() * variables.length)] + " ";
		} else if (elementType < 0.5 && operators.length > 0) {
			line += operators[Math.floor(Math.random() * operators.length)] + " ";
		} else if (elementType < 0.6 && symbols.length > 0) {
			line += symbols[Math.floor(Math.random() * symbols.length)] + " ";
		} else {
			const wordLength = Math.floor(2 + Math.random() * 8);
			let word = "";
			for (let k = 0; k < wordLength; k++) {
				word += characters.charAt(Math.floor(Math.random() * characters.length));
			}
			line += word + " ";
		}
		if (Math.random() < 0.05) {
			line += "// " + generateRandomText(10, characters);
			break;
		}
	}
	return line;
}

function generateRandomText(length, characters) {
	let text = "";
	for (let i = 0; i < length; i++) {
		text += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return text;
}

document.addEventListener('DOMContentLoaded', () => {
    createNetworkNodePulse('alpha');  // Keep this
    createBravoData('bravo');      // Keep this
    createCharlieDigital('charlie', 1.1);  // Keep this (you can adjust the speedFactor)
    createDeltaScanline('delta');   // Keep this
});