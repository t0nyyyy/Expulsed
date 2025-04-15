// glossary-script.js - JavaScript for the GLOSSARY page (glossary.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("glossary-script.js is loaded and running on the GLOSSARY page!");

    const terminalOutput = document.getElementById('terminal-output');
    const searchInput = document.getElementById('search-input');
    const randomButton = document.getElementById('random-button');
    const resetButton = document.getElementById('reset-button');
    const screensaver1Button = document.getElementById('screensaver1-button');
    const screensaverButton = document.getElementById('screensaver-button');
    const screensaver3Button = document.getElementById('screensaver3-button');
    const aboutButton = document.getElementById('button-2-placeholder');
    const welcomeMessageElement = document.getElementById('welcome-message');
    const screensaverContainer = document.getElementById('screensaver-container');

    let glossaryData = [];

    function loadWelcomeMessage() {
        console.log("loadWelcomeMessage() function called...");
        fetch('welcome.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                }
                return response.text();
            })
            .then(asciiArt => {
                console.log("welcome.txt loaded successfully:", asciiArt.substring(0, 20) + "...");
                welcomeMessageElement.textContent = asciiArt;
            })
            .catch(error => {
                console.error("Error loading welcome.txt:", error);
                console.error("Error details:", error.message);
                terminalOutput.textContent = "Error loading welcome message.";
            });
    }

    function loadGlossaryData() {
        fetch('glossary_data.json')
            .then(response => response.json())
            .then(data => {
                glossaryData = data;
                console.log("Glossary data loaded successfully:", glossaryData);
            })
            .catch(error => {
                console.error("Error loading glossary_data.json:", error);
                terminalOutput.textContent = "Error loading glossary data.";
            });
    }

    function displayDefinition(definition, term) {
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'none';

        const titleElement = document.createElement('h2');
        titleElement.classList.add('glossary-title');
        titleElement.textContent = term.toUpperCase();
        terminalOutput.appendChild(titleElement);

        const definitionElement = document.createElement('div');
        definitionElement.classList.add('glossary-entry');
        definitionElement.textContent = definition;
        definitionElement.style.width = '0';
        definitionElement.style.animation = 'typing-glossary 1s steps(40, end) forwards, blink-caret-glossary .75s step-end infinite alternate';
        terminalOutput.appendChild(definitionElement);

        definitionElement.addEventListener('animationend', (event) => {
            if (event.animationName === 'typing-glossary') {
                 definitionElement.style.width = 'auto';
            }
        });
    }

    function handleSearchInput() {
        const searchTerm = searchInput.value.toLowerCase();
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'none';

        if (!searchTerm) {
            welcomeMessageElement.style.display = 'block';
            return;
        }

        const searchResults = glossaryData.filter(entry =>
            entry.term.toLowerCase().includes(searchTerm)
        );

        if (searchResults.length > 0) {
            const resultsList = document.createElement('ol');
            resultsList.classList.add('search-results-list');

            searchResults.forEach(result => {
                const listItem = document.createElement('li');
                listItem.textContent = result.term;
                listItem.classList.add('search-result-item');
                listItem.addEventListener('click', () => displayDefinition(result.definition, result.term));
                resultsList.appendChild(listItem);
            });

            terminalOutput.appendChild(resultsList);

        } else {
            const noResultsDiv = document.createElement('div');
            noResultsDiv.classList.add('no-results');
            noResultsDiv.textContent = "No results found.";
            terminalOutput.appendChild(noResultsDiv);
        }
    }

    function loadAboutMessage() {
        console.log("loadAboutMessage() function called...");
        fetch('about.txt')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
                }
                return response.text();
            })
            .then(aboutText => {
                console.log("about.txt loaded successfully:", aboutText.substring(0, 20) + "...");
                terminalOutput.innerHTML = "";
                welcomeMessageElement.style.display = 'none';
                const aboutDiv = document.createElement('div');
                aboutDiv.classList.add('about-message');
                aboutDiv.textContent = aboutText;
                terminalOutput.appendChild(aboutDiv);

            })
            .catch(error => {
                console.error("Error loading about.txt:", error);
                terminalOutput.textContent = "Error loading about message.";
            });
    }

    loadWelcomeMessage();
    loadGlossaryData();

    searchInput.addEventListener('input', handleSearchInput);

    searchInput.addEventListener('focus', () => {
        welcomeMessageElement.style.display = 'none';
    });

    searchInput.addEventListener('blur', () => {
        if (!searchInput.value.trim()) {
            resetButton.click();
        }
    });

    randomButton.addEventListener('click', () => {
        if (screensaverContainer.style.display !== 'none') {
            clearScreensaverContainer();
            screensaverContainer.style.display = 'none';
            terminalOutput.style.display = 'block';
        }
        terminalOutput.innerHTML = "";
        if (glossaryData.length > 0) {
            const randomIndex = Math.floor(Math.random() * glossaryData.length);
            const randomEntry = glossaryData[randomIndex];
            displayDefinition(randomEntry.definition, randomEntry.term);
        } else {
            terminalOutput.textContent = "Glossary data not loaded yet.";
        }
    });

    resetButton.addEventListener('click', () => {
        console.log("RESET button clicked!");
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'block';
        loadWelcomeMessage();
        searchInput.value = "";
        if (screensaverContainer.style.display !== 'none') {
             screensaverContainer.style.display = 'none';
             clearScreensaverContainer();
        }
        terminalOutput.style.display = 'block';
    });

    screensaver1Button.addEventListener('click', () => {
        toggleScreensaver('screensaver.svg');
    });

    screensaverButton.addEventListener('click', () => {
        toggleScreensaver('screensaver2.svg');
    });

    screensaver3Button.addEventListener('click', () => {
         toggleScreensaver('screensaver3.svg');
    });

    aboutButton.addEventListener('click', () => {
        console.log("ABOUT button clicked!");
        if (screensaverContainer.style.display !== 'none') {
            clearScreensaverContainer();
            screensaverContainer.style.display = 'none';
            terminalOutput.style.display = 'block';
        }
        loadAboutMessage();
    });

    function toggleScreensaver(svgFileName) {
        if (screensaverContainer.style.display === 'none') {
            screensaverContainer.style.display = 'block';
            terminalOutput.style.display = 'none';
            welcomeMessageElement.style.display = 'none';
            loadScreensaverSVG(svgFileName);
        } else {
            resetButton.click();
        }
    }

    function loadScreensaverSVG(svgFileName) {
        fetch(svgFileName)
            .then(response => response.text())
            .then(svgContent => {
                screensaverContainer.innerHTML = svgContent;
            })
            .catch(error => {
                console.error(`Error loading ${svgFileName}:`, error);
                screensaverContainer.textContent = `Error loading ${svgFileName}.`;
            });
    }

    function clearScreensaverContainer() {
        screensaverContainer.innerHTML = "";
    }

});