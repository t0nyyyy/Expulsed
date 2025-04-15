// stationListSetup.js

// Function to set up station and outpost lists with pagination
export async function setupStationLists() {
    // Load stations data
    const response = await fetch('js/data/stations.json');
    const stationsData = await response.json();
    window.stationsData = stationsData;

    // Stations container setup
    const stationsContainer = document.getElementById('stations-container');
    const stationList = document.createElement('ul');
    stationList.id = 'station-list';
    stationList.classList.add('list-grid');
    stationsContainer.appendChild(stationList);

    // Outposts container setup
    const outpostsContainer = document.getElementById('outposts-container');
    const outpostList = document.createElement('ul');
    outpostList.id = 'outpost-list';
    outpostList.classList.add('list-grid');
    outpostsContainer.appendChild(outpostList);

    // Pagination state
    const itemsPerPage = 10;
    let currentStationPage = 0;
    let currentOutpostPage = 0;

    // Flatten stations data for easier pagination
    const allStations = [];
    for (const planet in stationsData) {
        stationsData[planet].forEach((station, index) => {
            allStations.push({ planet, station, index });
        });
    }

    // Flatten outposts data for easier pagination
    const allOutpostsFlat = [];
    for (const location in window.allOutposts) {
        window.allOutposts[location].forEach((outpost, index) => {
            allOutpostsFlat.push({ location, outpost, index });
        });
    }

    // Function to render stations for the current page
    function renderStations(page) {
        stationList.innerHTML = '';
        const start = page * itemsPerPage;
        const end = Math.min(start + itemsPerPage, allStations.length);
        const stationsToShow = allStations.slice(start, end);

        stationsToShow.forEach(({ planet, station, index }) => {
            const li = document.createElement('li');
            li.textContent = station.name;
            li.style.cursor = 'pointer';
            li.dataset.planet = planet;
            li.dataset.index = index;
            li.dataset.type = 'station';
            stationList.appendChild(li);
        });

        prevStationButton.disabled = page === 0;
        nextStationButton.disabled = end >= allStations.length;
    }

    // Function to render outposts for the current page
    function renderOutposts(page) {
        outpostList.innerHTML = '';
        const start = page * itemsPerPage;
        const end = Math.min(start + itemsPerPage, allOutpostsFlat.length);
        const outpostsToShow = allOutpostsFlat.slice(start, end);

        outpostsToShow.forEach(({ location, outpost, index }) => {
            const li = document.createElement('li');
            if (outpost.outpostIndex !== undefined) {
                li.textContent = outpost.userData.name;
                li.dataset.type = outpost.userData.type;
            } else {
                li.textContent = outpost.mesh.userData.name;
                li.dataset.type = outpost.mesh.userData.type;
            }
            li.dataset.location = location;
            li.dataset.index = index;
            outpostList.appendChild(li);
        });

        prevOutpostButton.disabled = page === 0;
        nextOutpostButton.disabled = end >= allOutpostsFlat.length;
    }

    // Create pagination buttons for stations
    const stationPagination = document.createElement('div');
    stationPagination.classList.add('pagination');
    const prevStationButton = document.createElement('button');
    prevStationButton.textContent = 'Previous Page';
    prevStationButton.classList.add('pagination-button');
    const nextStationButton = document.createElement('button');
    nextStationButton.textContent = 'Next Page';
    nextStationButton.classList.add('pagination-button');
    stationPagination.appendChild(prevStationButton);
    stationPagination.appendChild(nextStationButton);
    stationsContainer.appendChild(stationPagination);

    // Create pagination buttons for outposts
    const outpostPagination = document.createElement('div');
    outpostPagination.classList.add('pagination');
    const prevOutpostButton = document.createElement('button');
    prevOutpostButton.textContent = 'Previous Page';
    prevOutpostButton.classList.add('pagination-button');
    const nextOutpostButton = document.createElement('button');
    nextOutpostButton.textContent = 'Next Page';
    nextOutpostButton.classList.add('pagination-button');
    outpostPagination.appendChild(prevOutpostButton);
    outpostPagination.appendChild(nextOutpostButton);
    outpostsContainer.appendChild(outpostPagination);

    // Event listeners for station pagination buttons
    prevStationButton.addEventListener('click', () => {
        if (currentStationPage > 0) {
            currentStationPage--;
            renderStations(currentStationPage);
        }
    });

    nextStationButton.addEventListener('click', () => {
        if ((currentStationPage + 1) * itemsPerPage < allStations.length) {
            currentStationPage++;
            renderStations(currentStationPage);
        }
    });

    // Event listeners for outpost pagination buttons
    prevOutpostButton.addEventListener('click', () => {
        if (currentOutpostPage > 0) {
            currentOutpostPage--;
            renderOutposts(currentOutpostPage);
        }
    });

    nextOutpostButton.addEventListener('click', () => {
        if ((currentOutpostPage + 1) * itemsPerPage < allOutpostsFlat.length) {
            currentOutpostPage++;
            renderOutposts(currentOutpostPage);
        }
    });

    // Initial render
    renderStations(currentStationPage);
    renderOutposts(currentOutpostPage);

    // Click event listener for the UI
    const uiContainer = document.getElementById('ui-container');
    uiContainer.addEventListener('click', (event) => {
        if (event.target.tagName === 'LI') {
            const type = event.target.dataset.type;
            const location = event.target.dataset.location;
            const index = parseInt(event.target.dataset.index);

            let mesh, marker, line, outpostIndex;
            if (type === 'station') {
                const planet = event.target.dataset.planet;
                mesh = window.allStations[planet]?.[index]?.mesh;
            } else if (type === 'Outpost' || type === 'Moon Outpost') {
                const outpostData = window.allOutposts[location]?.[index];
                mesh = outpostData?.mesh;
                marker = outpostData?.marker;
                line = outpostData?.line;
                outpostIndex = outpostData?.outpostIndex;
            }
            if (mesh) {
                // Import highlightStation dynamically to avoid circular dependencies
                import('./stationHighlight.js').then(module => {
                    module.highlightStation(mesh, marker, line, outpostIndex);
                });
            }
        }
    });
}