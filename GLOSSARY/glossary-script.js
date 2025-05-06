document.addEventListener('DOMContentLoaded', () => {
    const terminalOutput = document.getElementById('terminal-output');
    const searchInput = document.getElementById('search-input');
    const randomButton = document.getElementById('random-button');
    const resetButton = document.getElementById('reset-button');
    const aboutButton = document.getElementById('button-2-placeholder');
    const welcomeMessageElement = document.getElementById('welcome-message');

    let glossaryData = [];
    const maxResultsToShow = 18;

    function loadWelcomeMessage() {
        terminalOutput.innerHTML = "";
        terminalOutput.style.display = 'none';
        welcomeMessageElement.textContent = 'Loading Welcome Message...';
        welcomeMessageElement.style.display = 'block';

        fetch('welcome.txt')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(asciiArt => {
                welcomeMessageElement.textContent = asciiArt;
            })
            .catch(error => {
                console.error("Error loading welcome.txt:", error);
                welcomeMessageElement.textContent = "Error loading welcome message.";
            });
    }

    function loadGlossaryData() {
        fetch('glossary_data.json')
            .then(response => response.json())
            .then(data => {
                glossaryData = data;
            })
            .catch(error => console.error("Error loading glossary_data.json:", error));
    }

    function displayDefinition(definition, term) {
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'none';
        terminalOutput.style.display = 'block';

        const titleElement = document.createElement('h2');
        titleElement.classList.add('glossary-title');
        titleElement.textContent = term.toUpperCase();
        terminalOutput.appendChild(titleElement);

        const definitionElement = document.createElement('div');
        definitionElement.classList.add('glossary-entry');
        definitionElement.textContent = definition;
        definitionElement.style.width = '0';
        definitionElement.style.animation = 'none';
        definitionElement.offsetHeight; 
        definitionElement.style.animation = 'typing-glossary 1s steps(40, end) forwards, blink-caret-glossary .75s step-end infinite alternate';
        terminalOutput.appendChild(definitionElement);

        definitionElement.addEventListener('animationend', (event) => {
            if (event.animationName === 'typing-glossary') {
                definitionElement.style.width = 'auto';
            }
        }, { once: true });
    }

    function handleSearchInput() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'none';
        terminalOutput.style.display = 'block';

        if (!searchTerm) {
            welcomeMessageElement.style.display = 'block';
            terminalOutput.style.display = 'none';
            loadWelcomeMessage();
            return;
        }

        const searchResults = glossaryData.filter(entry =>
            entry.term.toLowerCase().includes(searchTerm)
        );
        const resultsToDisplay = searchResults.slice(0, maxResultsToShow);

        if (resultsToDisplay.length > 0) {
            const resultsList = document.createElement('ol');
            resultsList.classList.add('search-results-list');
            resultsToDisplay.forEach(result => {
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
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'none';
        terminalOutput.style.display = 'block';

        fetch('about.txt')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.text();
            })
            .then(aboutText => {
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
        if (welcomeMessageElement.style.display !== 'none') {
             welcomeMessageElement.style.display = 'none';
             terminalOutput.style.display = 'block';
             terminalOutput.innerHTML = "";
        }
    });

    randomButton.addEventListener('click', () => {
        terminalOutput.style.display = 'block';
        welcomeMessageElement.style.display = 'none';
        if (glossaryData.length > 0) {
            const randomIndex = Math.floor(Math.random() * glossaryData.length);
            const randomEntry = glossaryData[randomIndex];
            displayDefinition(randomEntry.definition, randomEntry.term);
        } else {
            terminalOutput.textContent = "Glossary data not loaded yet.";
        }
    });

    resetButton.addEventListener('click', () => {
        terminalOutput.style.display = 'none';
        terminalOutput.innerHTML = "";
        welcomeMessageElement.style.display = 'block';
        loadWelcomeMessage();
        searchInput.value = "";
    });

    aboutButton.addEventListener('click', () => {
        terminalOutput.style.display = 'block';
        welcomeMessageElement.style.display = 'none';
        loadAboutMessage();
    });
});