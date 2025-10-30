// Initialize Socket.IO connection
const socket = io();

// DOM elements
const offeringsContainer = document.getElementById('offeringsContainer');
const offeringPanel = document.getElementById('emojiPanel');
const offeringBtns = document.querySelectorAll('.offering-btn');
const offeringModal = document.getElementById('offeringModal');
const offeringForm = document.getElementById('offeringForm');
const offeringPopup = document.getElementById('offeringPopup');
const closePopup = document.getElementById('closePopup');

// State
let selectedImage = null;
let selectedName = null;
let pendingOffering = null;
let sessionId = generateSessionId();
let hasPlacedOffering = false;

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Profanity filter - check for inappropriate words
function containsProfanity(text) {
    if (!text) return false;
    
    const words = text.toLowerCase().trim();
    
    // List of inappropriate words to filter
    const blockedWords = [
        // Common profanity (partial list)
        'shit', 'fuck', 'damn', 'bitch', 'asshole', 'bastard',
        'crap', 'piss', 'hell', 'pussy', 'dick', 'cock',
        // Slurs and offensive terms
        'nigger', 'nigga', 'fag', 'faggot', 'retard', 'retarded',
        'tranny', 'chink', 'kike', 'spic', 'wetback', 'gook',
        // Other offensive terms
        'whore', 'slut', 'hoe', 'thot'
    ];
    
    // Check if any blocked word appears in the text
    return blockedWords.some(word => {
        // Use word boundaries to match whole words
        const regex = new RegExp('\\b' + word + '\\b', 'i');
        return regex.test(words);
    });
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners. Found buttons:', offeringBtns.length);
    
    // Offering selection
    offeringBtns.forEach((btn, index) => {
        console.log(`Setting up button ${index}:`, btn, 'dataset:', btn.dataset);
        
        btn.addEventListener('click', (e) => {
            console.log('Button click event triggered!');
            
            if (hasPlacedOffering) {
                alert('You have already placed an offering. Each visitor can only place one offering per session.');
                return;
            }
            
            // Remove previous selection
            offeringBtns.forEach(b => b.classList.remove('selected'));
            
            // Get the button element (in case click was on the image inside)
            const button = e.target.closest('.offering-btn') || e.target;
            
            console.log('Button clicked:', button);
            console.log('Button dataset:', button.dataset);
            console.log('Button has data-image:', button.hasAttribute('data-image'));
            console.log('Button data-image value:', button.getAttribute('data-image'));
            
            // Select new offering
            selectedImage = button.dataset.image;
            selectedName = button.dataset.name;
            button.classList.add('selected');
            
            console.log('Selected offering:', { image: selectedImage, name: selectedName });
        });
    });

    // Click on altar to place offering
    const altarBackground = document.querySelector('.altar-background');
    console.log('Altar background element:', altarBackground);
    
    // Function to handle altar clicks
    function handleAltarClick(e) {
        console.log('Altar clicked!', { selectedImage, selectedName, hasPlacedOffering });
        
        if (!selectedImage || hasPlacedOffering) {
            if (hasPlacedOffering) {
                alert('You have already placed an offering. Each visitor can only place one offering per session.');
            } else {
                alert('Please select an offering first!');
            }
            return;
        }

        // Store click position
        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100; // Percentage
        const y = ((e.clientY - rect.top) / rect.height) * 100; // Percentage

        console.log('Click position:', { x, y });

        pendingOffering = {
            image: selectedImage,
            name: selectedName,
            x: x,
            y: y
        };

        // Show form modal
        offeringModal.style.display = 'block';
    }
    
    // Try to attach click handler to background
    if (altarBackground) {
        altarBackground.addEventListener('click', handleAltarClick);
    } else {
        console.error('Altar background element not found!');
    }
    
    // Fallback: attach to the entire altar container
    document.querySelector('.altar-container').addEventListener('click', (e) => {
        // Only handle clicks if they're not on offerings, offering buttons, or their children
        if (!e.target.classList.contains('offering') && 
            !e.target.classList.contains('offering-btn') &&
            !e.target.closest('.offering') && // Check if clicked element is inside an offering
            !e.target.closest('.emoji-panel') &&
            !e.target.closest('.modal') &&
            !e.target.closest('.offering-popup')) {
            handleAltarClick(e);
        }
    });

    // Form submission
    offeringForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = new FormData(offeringForm);
        console.log('Form data collected:', {
            name: formData.get('name'),
            age: formData.get('age'),
            location: formData.get('location'),
            message: formData.get('message')
        });
        
        // Check for profanity in form fields
        const name = formData.get('name');
        const location = formData.get('location');
        const message = formData.get('message');
        
        if (containsProfanity(name)) {
            alert('Please use appropriate language. Your name contains inappropriate words.');
            return;
        }
        
        if (containsProfanity(location)) {
            alert('Please use appropriate language. Your location contains inappropriate words.');
            return;
        }
        
        if (message && containsProfanity(message)) {
            alert('Please use appropriate language. Your message contains inappropriate words.');
            return;
        }
        
        console.log('Pending offering data:', pendingOffering);
        
        const offeringData = {
            sessionId: sessionId,
            image: pendingOffering.image,
            name: pendingOffering.name,
            x: pendingOffering.x,
            y: pendingOffering.y,
            visitorName: name,
            age: formData.get('age'),
            location: location,
            message: message || 'No message'
        };

        // Send offering to server
        console.log('Sending offering data:', offeringData);
        console.log('Image being sent:', offeringData.image);
        socket.emit('place-offering', offeringData);
        
        // Close modal and reset form
        offeringModal.style.display = 'none';
        offeringForm.reset();
        selectedImage = null;
        selectedName = null;
        offeringBtns.forEach(btn => btn.classList.remove('selected'));
        pendingOffering = null;
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        offeringModal.style.display = 'none';
        selectedImage = null;
        selectedName = null;
        offeringBtns.forEach(btn => btn.classList.remove('selected'));
        pendingOffering = null;
    });

    // Close popup
    closePopup.addEventListener('click', () => {
        offeringPopup.style.display = 'none';
    });

    // Close popup when clicking outside
    offeringPopup.addEventListener('click', (e) => {
        if (e.target === offeringPopup) {
            offeringPopup.style.display = 'none';
        }
    });

    // Minimize/expand panels
    document.getElementById('minimizeIntro').addEventListener('click', (e) => {
        e.stopPropagation();
        const introPanel = document.getElementById('introPanel');
        introPanel.classList.toggle('panel-minimized');
    });

    document.getElementById('minimizeOffering').addEventListener('click', (e) => {
        e.stopPropagation();
        const emojiPanel = document.getElementById('emojiPanel');
        emojiPanel.classList.toggle('panel-minimized');
    });
}

// Create offering element
function createOfferingElement(offering) {
    const offeringEl = document.createElement('div');
    offeringEl.className = 'offering';
    offeringEl.style.left = offering.x + '%';
    offeringEl.style.top = offering.y + '%';
    offeringEl.dataset.offeringId = offering.id;
    
    // Create image element
    const img = document.createElement('img');
    
    // Use the actual image from the offering, or default to bowl
    const imageSrc = offering.image || 'bowl.avif';
    img.src = imageSrc;
    img.alt = offering.name || offering.visitorName || 'Offering';
    img.className = 'offering-image';
    offeringEl.appendChild(img);
    
    // Create hover popup
    const hoverPopup = document.createElement('div');
    hoverPopup.className = 'offering-hover-popup';
    hoverPopup.innerHTML = `
        <div class="hover-popup-content">
            <p><strong>${offering.visitorName || offering.name}</strong></p>
            <p>Age: ${offering.age} | ${offering.location}</p>
            <p>${offering.message}</p>
        </div>
    `;
    offeringEl.appendChild(hoverPopup);
    
    // Add click handler to show popup
    offeringEl.addEventListener('click', (e) => {
        e.stopPropagation();
        showOfferingPopup(offering);
    });
    
    console.log('Created offering with image:', imageSrc, 'for offering:', offering);
    
    return offeringEl;
}

// Show offering popup
function showOfferingPopup(offering) {
    const imageContainer = document.getElementById('popupOfferingImage');
    
    // Clear previous content
    imageContainer.innerHTML = '';
    
    // Show image
    const img = document.createElement('img');
    img.src = offering.image || 'bowl.avif';
    img.alt = offering.name || 'Offering';
    imageContainer.appendChild(img);
    
    document.getElementById('popupName').textContent = offering.visitorName || offering.name;
    document.getElementById('popupAge').textContent = offering.age;
    document.getElementById('popupLocation').textContent = offering.location;
    document.getElementById('popupMessage').textContent = offering.message;
    
    // Format timestamp
    const date = new Date(offering.timestamp);
    const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    document.getElementById('popupTimestamp').textContent = formattedDate;
    
    offeringPopup.style.display = 'block';
}

// Socket event listeners
socket.on('existing-offerings', (offerings) => {
    console.log('Received existing offerings:', offerings);
    offerings.forEach(offering => {
        console.log('Processing offering:', offering);
        const offeringEl = createOfferingElement(offering);
        offeringsContainer.appendChild(offeringEl);
    });
});

socket.on('new-offering', (offering) => {
    console.log('New offering received:', offering);
    console.log('Creating element for offering with image:', offering.image);
    const offeringEl = createOfferingElement(offering);
    offeringsContainer.appendChild(offeringEl);
    
    // If this is our own offering, mark that we've placed one
    if (offering.sessionId === sessionId) {
        hasPlacedOffering = true;
        offeringPanel.style.opacity = '0.5';
        offeringPanel.querySelector('.instruction').textContent = 'You have placed your offering!';
    }
});

socket.on('offering-removed', (offeringId) => {
    const offeringEl = document.querySelector(`[data-offering-id="${offeringId}"]`);
    if (offeringEl) {
        offeringEl.remove();
    }
});

socket.on('offering-error', (error) => {
    alert(error.message);
});

// Test function to place an offering directly
function testPlaceOffering() {
    const testOffering = {
        id: 'test_' + Date.now(),
        sessionId: sessionId,
        image: 'bowl.avif',
        name: 'Bowl',
        x: 50,
        y: 50,
        visitorName: 'Test User',
        age: 25,
        location: 'Test City',
        message: 'This is a test offering',
        timestamp: new Date().toISOString()
    };
    
    const offeringEl = createOfferingElement(testOffering);
    offeringsContainer.appendChild(offeringEl);
    console.log('Test offering placed:', testOffering);
}

// Function to refresh offerings display
function refreshOfferings() {
    // Clear existing offerings
    offeringsContainer.innerHTML = '';
    
    // Request fresh offerings from server
    socket.emit('get-offerings');
}

// Function to clear all offerings and reload
function clearAndReloadOfferings() {
    console.log('Clearing all offerings and reloading...');
    offeringsContainer.innerHTML = '';
    socket.emit('get-offerings');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    console.log('Taco Time Shrine initialized. Session ID:', sessionId);
    
    // Add test functions to window for debugging
    window.testPlaceOffering = testPlaceOffering;
    window.refreshOfferings = refreshOfferings;
    window.clearAndReloadOfferings = clearAndReloadOfferings;
    console.log('Test functions available: window.testPlaceOffering(), window.refreshOfferings(), window.clearAndReloadOfferings()');
});
