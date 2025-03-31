/**
 * Map Page
 * @author Zia Sheikh
 * Handles map integration, location services, and map functionality
 */

// Map page functionality
import itemsService from '../modules/items.js';
import uiHandler from '../modules/ui.js';

let map;
let items;
let markers = [];
let activeInfoWindow = null;
let mapInitialized = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Function to check if Google Maps API is loaded
function isGoogleMapsLoaded() {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

// Initialize map when Google Maps API is loaded
window.addEventListener('google-maps-callback', () => {
    console.log('Google Maps callback received');
    if (!isGoogleMapsLoaded()) {
        console.error('Google Maps API not loaded yet');
        return;
    }
    initializeMap();
});

// Add error handling for map initialization
window.addEventListener('load', () => {
    console.log('Page loaded, checking Google Maps initialization');
    
    // Check if Google Maps is already loaded
    if (isGoogleMapsLoaded() && !mapInitialized) {
        console.log('Google Maps API already loaded, initializing map');
        initializeMap();
    }

    // Set a timeout to check if map was initialized
    const checkInitialization = () => {
        if (!mapInitialized) {
            console.log(`Initialization attempt ${initializationAttempts + 1} of ${MAX_INITIALIZATION_ATTEMPTS}`);
            
            if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
                initializationAttempts++;
                
                if (isGoogleMapsLoaded()) {
                    console.log('Attempting to initialize map again');
                    initializeMap();
                } else {
                    console.error('Google Maps API not loaded');
                    setTimeout(checkInitialization, 3000);
                }
            } else {
                console.error('Map failed to initialize after maximum attempts');
                const mapElement = document.getElementById('map');
                if (mapElement) {
                    mapElement.innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                            <p>Unable to load Google Maps. Please try the following:</p>
                            <ol style="text-align: left; display: inline-block;">
                                <li>Check your internet connection</li>
                                <li>Disable any ad blockers for this site</li>
                                <li>Clear your browser cache</li>
                                <li>Refresh the page</li>
                            </ol>
                        </div>
                    `;
                }
            }
        }
    };

    setTimeout(checkInitialization, 3000); // First check after 3 seconds
});

async function initializeMap() {
    try {
        console.log('Map initialization starting...');
        
        if (!isGoogleMapsLoaded()) {
            throw new Error('Google Maps API not loaded');
        }

        // Initialize map
        const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
        console.log('Default location:', defaultLocation);
        
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            throw new Error('Map container not found');
        }

        // Check if map element has dimensions
        const mapWidth = mapElement.offsetWidth;
        const mapHeight = mapElement.offsetHeight;
        if (mapWidth === 0 || mapHeight === 0) {
            console.warn('Map container has zero dimensions:', { width: mapWidth, height: mapHeight });
            // Try to ensure the container has size
            mapElement.style.width = '100%';
            mapElement.style.height = '400px';
        }

        map = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 12,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });
        console.log('Map object created successfully');

        // Verify map was created successfully
        if (!map || typeof map.getCenter !== 'function') {
            throw new Error('Map object not properly initialized');
        }

        // Mark map as initialized
        mapInitialized = true;
        console.log('Map initialization complete');

        // Initialize the rest of the functionality
        await initializeMapFeatures();
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapElement.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <p>Error loading map: ${error.message}</p>
                    <p>Please try refreshing the page. If the problem persists, check your internet connection and ad blocker settings.</p>
                </div>
            `;
        }
        // Re-throw the error to be caught by the initialization system
        throw error;
    }
}

async function initializeMapFeatures() {
    try {
        // Initialize places service for location search
        const searchInput = document.getElementById('locationSearch');
        const searchBox = new google.maps.places.SearchBox(searchInput);
        
        // Bias SearchBox results towards current map's viewport
        map.addListener('bounds_changed', () => {
            searchBox.setBounds(map.getBounds());
        });

        // Get items and filter parameters
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item');
        items = await itemsService.getItems();
        console.log('Loaded items:', items);

        // Initialize category filter
        const categorySelect = document.getElementById('category');
        if (categorySelect) {
            try {
                const categories = await itemsService.getCategories();
                if (Array.isArray(categories)) {
                    categorySelect.innerHTML = `
                        <option value="">All Categories</option>
                        ${categories.map(category => `
                            <option value="${category.name}">${category.display_name}</option>
                        `).join('')}
                    `;
                } else {
                    console.error('Categories is not an array:', categories);
                    categorySelect.innerHTML = '<option value="">All Categories</option>';
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                categorySelect.innerHTML = '<option value="">All Categories</option>';
            }
        }

        // Filter items based on form values
        const filterForm = document.getElementById('mapFilters');
        if (filterForm) {
            filterForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(filterForm);
                const category = formData.get('category');
                const distance = parseInt(formData.get('distance'));
                
                try {
                    // Apply filters
                    items = await itemsService.getItems({
                        category: category || undefined
                    });

                    // Clear existing markers
                    clearMarkers();

                    // Add filtered items to map
                    addItemsToMap(items, itemId);
                    updateItemList(items);
                } catch (error) {
                    console.error('Error filtering items:', error);
                    uiHandler.showNotification('Error filtering items. Please try again.', 'error');
                }
            });
        }

        // If we have a specific item ID, focus on that item
        if (itemId) {
            const item = items.find(item => item.id === itemId);
            if (item && item.location && item.location.coordinates) {
                const position = {
                    lat: parseFloat(item.location.coordinates.lat),
                    lng: parseFloat(item.location.coordinates.lng)
                };
                map.setCenter(position);
                map.setZoom(15);
                
                // Add marker for this item
                addItemsToMap([item], itemId);
            }
        } else {
            // Add all items to map
            addItemsToMap(items);
        }

        // Update the item list
        updateItemList(items);

        // Try to get user's location
        if (navigator.geolocation) {
            uiHandler.showNotification('Getting your location...', 'info');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Got user location:', pos);
                    map.setCenter(pos);
                    
                    // Add a marker for user's location
                    new google.maps.Marker({
                        position: pos,
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: 'var(--primary-color)',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2
                        },
                        title: 'Your Location'
                    });
                    uiHandler.showNotification('Location found!', 'success');
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    let errorMessage = 'Could not get your location. ';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Please enable location access in your browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Location request timed out.';
                            break;
                        default:
                            errorMessage += 'An unknown error occurred.';
                    }
                    uiHandler.showNotification(errorMessage, 'error');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            uiHandler.showNotification('Geolocation is not supported by your browser', 'error');
        }
    } catch (error) {
        console.error('Error initializing map features:', error);
        uiHandler.showNotification('Error initializing map. Please refresh the page.', 'error');
    }
}

// Function to add items to map
function addItemsToMap(items, targetItemId = null) {
    items.forEach(item => {
        if (item.location?.coordinates) {
            const marker = new google.maps.Marker({
                position: {
                    lat: parseFloat(item.location.coordinates.lat),
                    lng: parseFloat(item.location.coordinates.lng)
                },
                map: map,
                title: item.title || 'Unnamed Item',
                animation: google.maps.Animation.DROP
            });

            // Create info window content with safe access to properties
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="map-popup">
                        <img src="${item.images?.[0] || '/src/assets/images/furniture/couch.jpg'}" 
                             alt="${item.title || 'Item image'}" 
                             style="width: 100%; height: 150px; object-fit: cover;">
                        <h4>${item.title || 'Unnamed Item'}</h4>
                        <p>${item.condition || 'Condition not specified'} • ${item.category || 'Uncategorized'}</p>
                        <p>${item.location?.address || 'Address not specified'}</p>
                        <a href="item-details.html?id=${item.id}" class="button small">View Details</a>
                    </div>
                `
            });

            // Add click listener to marker
            marker.addListener('click', () => {
                if (activeInfoWindow) {
                    activeInfoWindow.close();
                }
                infoWindow.open(map, marker);
                activeInfoWindow = infoWindow;

                // Highlight corresponding item in list
                const itemCards = document.querySelectorAll('.item-card');
                itemCards.forEach(card => {
                    card.classList.remove('active');
                    if (card.dataset.itemId === item.id) {
                        card.classList.add('active');
                        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            });

            markers.push(marker);

            // If this is the specific item we're looking for, open its info window
            if (targetItemId && item.id === targetItemId) {
                map.setCenter(marker.getPosition());
                map.setZoom(15);
                infoWindow.open(map, marker);
                activeInfoWindow = infoWindow;
            }
        }
    });
}

// Function to clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    if (activeInfoWindow) {
        activeInfoWindow.close();
        activeInfoWindow = null;
    }
}

// Function to update the item list sidebar
function updateItemList(items) {
    const itemList = document.querySelector('.item-list');
    if (itemList) {
        itemList.innerHTML = items.map(item => `
            <div class="item-card" data-item-id="${item.id}">
                <div class="grid-x grid-padding-x align-middle">
                    <div class="cell small-4">
                        <img src="${item.images?.[0] || '/src/assets/images/furniture/couch.jpg'}" 
                             alt="${item.title || 'Item image'}" 
                             class="item-image">
                    </div>
                    <div class="cell small-8">
                        <h6 class="item-title">${item.title || 'Unnamed Item'}</h6>
                        <p class="distance-text">
                            <i class="bx bx-map-pin"></i> ${item.location?.address?.split(',')[0] || 'Location not specified'}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers to item cards
        document.querySelectorAll('.item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.itemId;
                const item = items.find(i => i.id === itemId);
                if (item?.location?.coordinates) {
                    const position = {
                        lat: parseFloat(item.location.coordinates.lat),
                        lng: parseFloat(item.location.coordinates.lng)
                    };
                    
                    map.panTo(position);
                    map.setZoom(15);

                    // Find and click the corresponding marker
                    const marker = markers.find(m => 
                        m.getPosition().lat() === position.lat && 
                        m.getPosition().lng() === position.lng
                    );
                    if (marker) {
                        google.maps.event.trigger(marker, 'click');
                    }
                }
            });
        });
    }
} 