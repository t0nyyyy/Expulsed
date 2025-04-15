// book-series-script.js - JavaScript for the BOOK page (book-series.html)

document.addEventListener("DOMContentLoaded", () => {
    console.log("book-series-script.js is loaded and running on the BOOK page!");

    // Smooth scrolling for read-more links
    const readMoreLinks = document.querySelectorAll(".read-more-link");
    readMoreLinks.forEach(link => {
        link.addEventListener("click", (event) => {
            if (!link.href.includes("#")) {
                return;
            }
            event.preventDefault();
            const targetId = link.getAttribute("href");
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    // Set initial classified state
    const setInitialClassifiedState = () => {
        const books = ['book2', 'book3', 'book4', 'book5'];
        books.forEach(bookId => {
            const book = document.getElementById(bookId);
            if (book) {
                book.classList.add('classified');
            }
        });
    };
    setInitialClassifiedState();

    // Click event listeners for classified books
    const classifiedBooks = document.querySelectorAll('.book-entry.classified');
    classifiedBooks.forEach(book => {
        book.addEventListener('click', () => {
            const hiddenText = book.querySelector('.hidden-text');
            if (hiddenText) {
                hiddenText.classList.toggle('revealed');
            }
        });
    });

    // Global functions for classified control
    window.toggleClassified = function (...bookIds) {
        bookIds.forEach(bookId => {
            const bookEntry = document.getElementById(bookId);
            if (bookEntry) {
                bookEntry.classList.toggle("classified");
                const description = bookEntry.querySelector(".hidden-text");
                if (description) { description.classList.toggle("revealed"); }
            } else { console.warn(`Book ID '${bookId}' not found!`); }
        });
    };
    window.setClassifiedStatus = function (status, ...bookIds) {
        bookIds.forEach(bookId => {
            const bookEntry = document.getElementById(bookId);
            if (bookEntry) {
                if (status) { bookEntry.classList.add("classified"); }
                else {
                    bookEntry.classList.remove("classified");
                    const description = bookEntry.querySelector(".hidden-text");
                    if (description) { description.classList.remove("revealed"); }
                }
            } else { console.warn(`Book ID '${bookId}' not found!`); }
        });
    };
    window.revealAllBooks = function () { window.setClassifiedStatus(false, 'book2', 'book3', 'book4', 'book5'); };
    window.classifyAllBooks = function () { window.setClassifiedStatus(true, 'book2', 'book3', 'book4', 'book5'); };
    window.releaseBooks = function (...bookIds) { bookIds.forEach(bookId => { window.setClassifiedStatus(false, bookId); }); };


    // Sequential Shine Effect (setTimeout-based)

    const bookEntries = [
        document.getElementById('book1'),
        document.getElementById('book2'),
        document.getElementById('book3'),
        document.getElementById('book4'),
        document.getElementById('book5'),
    ];

    const validBookEntries = bookEntries.filter(entry => entry !== null);
    const bookCoverContainers = validBookEntries.map(entry => entry.querySelector('.book-cover-container')).filter(container => container !== null);

    let currentShineIndex = 0;
    const numberOfBooks = bookCoverContainers.length;
    let shineTimeoutId = null;

    // Duration in milliseconds - MUST match the CSS animation-duration value!
    const animationDuration = 2400;

    if (numberOfBooks > 0) {

        const triggerNextShine = () => {
            if (bookCoverContainers[currentShineIndex]) {
               bookCoverContainers[currentShineIndex].classList.remove('is-shining');
            }

            currentShineIndex = (currentShineIndex + 1) % numberOfBooks;

            if (bookCoverContainers[currentShineIndex]) {
                bookCoverContainers[currentShineIndex].classList.add('is-shining');
            }

            shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };

        const startShineSequence = () => {
             clearTimeout(shineTimeoutId);
             bookCoverContainers.forEach(container => container.classList.remove('is-shining'));
             if (bookCoverContainers[currentShineIndex]) {
                  bookCoverContainers[currentShineIndex].classList.add('is-shining');
             }
             shineTimeoutId = setTimeout(triggerNextShine, animationDuration);
        };

        startShineSequence(); // Start the sequence

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                 clearTimeout(shineTimeoutId);
                 if (bookCoverContainers[currentShineIndex]) {
                    bookCoverContainers[currentShineIndex].classList.remove('is-shining');
                 }
            } else {
                 startShineSequence(); // Restart sequence when visible again
            }
        });

    } else {
        console.warn("Sequential Shine: Could not find any valid book cover containers.");
    }

}); // End of DOMContentLoaded listener