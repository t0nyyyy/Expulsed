// contact-script.js - JavaScript for the CONTACT page (contact.html)

document.addEventListener('DOMContentLoaded', () => {
    console.log("contact-script.js is loaded and running on the CONTACT page!");
    
    // Form validation function
    function validateForm() {
        const form = document.getElementById('contactForm');
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const message = document.getElementById('message');
        let isValid = true;

        // Clear previous error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());

        // Name validation
        if (name.value.trim() === '') {
            displayError(name, 'Code Name is required');
            isValid = false;
        } else if (name.value.length < 2) {
            displayError(name, 'Code Name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email.value.trim() === '') {
            displayError(email, 'Email is required');
            isValid = false;
        } else if (!emailRegex.test(email.value)) {
            displayError(email, 'Please enter a valid email address');
            isValid = false;
        }

        // Message validation
        if (message.value.trim() === '') {
            displayError(message, 'Message content is required');
            isValid = false;
        } else if (message.value.length < 10) {
            displayError(message, 'Message must be at least 10 characters');
            isValid = false;
        }

        return isValid;
    }

    // Function to display error messages
    function displayError(input, message) {
        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.style.color = '#ff4444';
        errorSpan.style.fontSize = '0.8em';
        errorSpan.style.marginTop = '5px';
        errorSpan.textContent = message;
        input.parentNode.insertBefore(errorSpan, input.nextSibling);
    }
    
    // Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            if (!validateForm()) {
                e.preventDefault();
                return;
            }

            const isDemo = true; // Set to false in production
            
            // Generate random Transmission ID
            const randomId = Math.floor(Math.random() * 9000000) + 1000000; // Range: 1000000 to 9999999
            const transmissionId = `BF-${randomId}`;

            if (isDemo) {
                e.preventDefault();
                simulateTransmission();
                
                // Redirect to thank-you page with the transmission ID as a query parameter
                setTimeout(() => {
                    window.location.href = `thank-you.html?transmissionId=${encodeURIComponent(transmissionId)}`;
                }, 4000);
            } else {
                // Production mode: Add the Transmission ID to the form before submitting
                const hiddenInput = document.createElement('input');
                hiddenInput.type = 'hidden';
                hiddenInput.name = 'Transmission_ID'; // This will appear in the email
                hiddenInput.value = transmissionId;
                contactForm.appendChild(hiddenInput);

                // Show transmission simulation even in production mode (optional)
                simulateTransmission();
                // Form will submit normally to formsubmit.co with the ID included
                // No need for e.preventDefault() here; let it submit
            }
        });
    }
    
    // Animate SVG elements
    animateSvgElements();
    
    // Add hover effects to form elements
    addFormEffects();
});

// Function to simulate transmission with matrix-style effect
function simulateTransmission() {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="loading-spinner">◠</span> PROCESSING`;
    submitBtn.style.backgroundColor = 'rgba(0, 60, 0, 0.8)';
    
    let progress = 0;
    const transmissionText = ['PROCESSING', 'ENCRYPTING', 'TRANSMITTING', 'SENT'];
    const interval = setInterval(() => {
        submitBtn.innerHTML = `<span class="loading-spinner">◠</span> ${transmissionText[progress]} ${'.'.repeat(progress % 3 + 1)}`;
        progress++;
        
        if (progress > transmissionText.length) {
            clearInterval(interval);
            submitBtn.innerHTML = '✓ TRANSMISSION COMPLETE';
            setTimeout(() => {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                submitBtn.style.backgroundColor = 'rgba(0, 20, 0, 0.8)';
                document.getElementById('contactForm').reset();
            }, 3000);
        }
    }, 800);
}

// Function to animate SVG elements
function animateSvgElements() {
    const svgNodes = document.querySelectorAll('.svg-node');
    svgNodes.forEach(node => {
        setInterval(() => {
            node.style.opacity = Math.random() > 0.7 ? '0.5' : '1';
        }, 1000 + Math.random() * 2000);
    });
}

// Add futuristic effects to form elements
function addFormEffects() {
    const inputs = document.querySelectorAll('.futuristic-input');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            // Add typing sound effect if desired later
        });
        
        input.addEventListener('blur', () => {
            if (input.value.trim() !== '') {
                input.style.borderColor = '#00ff99';
                setTimeout(() => {
                    input.style.borderColor = '#00ff66';
                }, 1000);
            }
        });
    });
}