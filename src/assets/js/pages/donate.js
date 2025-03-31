
/**
 * Donation page functionality
 * @author Sudheer
 * Handles donation functionality, including item management, form validation, and location services
 */

import itemsService from '../modules/items.js';
import formHandler from '../modules/forms.js';
import uiHandler from '../modules/ui.js';
import authService from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        uiHandler.showNotification('Please log in to donate items', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }

    // Initialize form validation
    formHandler.initializeFormValidation('donationForm', {
        onSubmit: async (formData) => {
            const loader = uiHandler.showLoading();
            
            try {
                if (!selectedLocation) {
                    throw new Error('Please select a location for your item');
                }

                // Handle image upload
                const imageFiles = document.getElementById('itemImages').files;
                const imagePromises = [];

                if (imageFiles.length > 0) {
                    for (let i = 0; i < imageFiles.length; i++) {
                        imagePromises.push(convertImageToBase64(imageFiles[i]));
                    }
                }

                // Wait for all images to be converted
                const imageUrls = await Promise.all(imagePromises);

                // Create item data object with location
                const itemData = {
                    title: formData.itemName,
                    category: formData.category,
                    condition: formData.itemCondition,
                    description: formData.description,
                    location: selectedLocation, // Use the stored location object
                    pickup_details: {
                        availability: formData.availability,
                        instructions: formData.pickupAddress
                    },
                    images: imageUrls.length > 0 ? imageUrls : ["/src/assets/images/furniture/chair.jpg"]
                };

                // Add the item
                const result = await itemsService.addItem(itemData);
                
                if (result.success) {
                    uiHandler.showNotification('Item donated successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = '/src/pages/main/browse.html';
                    }, 2000);
                } else {
                    throw new Error(result.error);
                }
            } catch (error) {
                uiHandler.showNotification(error.message || 'Error donating item', 'error');
            } finally {
                uiHandler.hideLoading(loader);
            }
        }
    });

    // Function to convert image to base64
    function convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Initialize location features
    const pinLocationBtn = document.getElementById('pinLocationBtn');
    const locationMap = document.getElementById('locationMap');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const addressInput = document.getElementById('pickupAddress');

    if (pinLocationBtn && locationMap) {
        pinLocationBtn.addEventListener('click', () => {
            if (!mapInitialized) {
                uiHandler.showNotification('Map is not initialized yet. Please try again in a moment.', 'warning');
                return;
            }
            locationMap.style.display = locationMap.style.display === 'none' ? 'block' : 'none';
            if (locationMap.style.display === 'block' && map) {
                google.maps.event.trigger(map, 'resize');
                // If no location is set yet, center on default location
                if (!marker.getPosition()) {
                    const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
                    map.setCenter(defaultLocation);
                    marker.setPosition(defaultLocation);
                    updateLocationFields(defaultLocation.lat, defaultLocation.lng);
                }
            }
        });
    }

    // Initialize category dropdown with available categories
    const categoryInput = document.getElementById('category');
    if (categoryInput) {
        const categories = itemsService.getCategories();
        categoryInput.innerHTML = `
            <option value="">Select a category</option>
            <option value="furniture">Furniture</option>
            <option value="electronics">Electronics</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="toys">Toys</option>
            <option value="other">Other</option>
            ${categories.map(category => `
                <option value="${category.name}">${category.display_name}</option>
            `).join('')}
        `;
    }

    // Initialize condition dropdown with available conditions
    const conditionInput = document.getElementById('itemCondition');
    if (conditionInput) {
        const conditions = itemsService.getConditions();
        conditionInput.innerHTML = `
            <option value="">Select condition</option>
            <option value="new">New</option>
            <option value="used">Used</option>
            <option value="worn">Worn</option>
            <option value="broken">Broken</option>
            <option value="other">Other</option>
            ${conditions.map(condition => `
                <option value="${condition.name}">${condition.display_name}</option>
            `).join('')}
        `;
    }

    // Handle image preview
    const itemImagesInput = document.getElementById('itemImages');
    const previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container grid-x grid-margin-x';
    
    if (itemImagesInput) {
        // Insert preview container after the input
        itemImagesInput.parentNode.insertBefore(previewContainer, itemImagesInput.nextSibling);

        itemImagesInput.addEventListener('change', (e) => {
            const files = e.target.files;
            previewContainer.innerHTML = ''; // Clear previous previews

            if (files.length > 0) {
                Array.from(files).forEach(file => {
                    const reader = new FileReader();
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'cell small-6 medium-4 large-3';
                    
                    reader.onload = (e) => {
                        previewDiv.innerHTML = `
                            <div class="preview-image" style="
                                width: 100%;
                                height: 150px;
                                background-image: url('${e.target.result}');
                                background-size: cover;
                                background-position: center;
                                border-radius: var(--radius-md);
                                margin-bottom: var(--space-md);
                            "></div>
                        `;
                    };
                    
                    reader.readAsDataURL(file);
                    previewContainer.appendChild(previewDiv);
                });

                uiHandler.showNotification(`${files.length} image(s) selected`, 'info');
            }
        });
    }
}); 
// Map functionality
let map;
let marker;
let geocoder;
let searchBox;
let mapInitialized = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;
let selectedLocation = null;

// Function to check if Google Maps API is loaded
function isGoogleMapsLoaded() {
    return typeof google !== 'undefined' && typeof google.maps !== 'undefined';
}

// Initialize map when Google Maps API is loaded
window.addEventListener('google-maps-loaded', () => {
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

    // Start checking initialization after a short delay
    setTimeout(checkInitialization, 3000);
});

function initializeMap() {
    try {
        console.log('Map initialization starting...');
        
        if (!isGoogleMapsLoaded()) {
            throw new Error('Google Maps API not loaded');
        }

        const mapElement = document.getElementById('locationMap');
        if (!mapElement) {
            throw new Error('Map container not found');
        }

        // Initialize geocoder
        geocoder = new google.maps.Geocoder();

        // Default location (San Francisco)
        const defaultLocation = { lat: 37.7749, lng: -122.4194 };

        // Create map
        map = new google.maps.Map(mapElement, {
            center: defaultLocation,
            zoom: 13,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        // Create marker
        marker = new google.maps.Marker({
            map: map,
            draggable: true,
            position: defaultLocation
        });

        // Initialize search box
        const searchInput = document.getElementById('locationSearch');
        if (searchInput) {
            searchBox = new google.maps.places.SearchBox(searchInput);
            
            // Bias SearchBox results towards current map's viewport
            map.addListener('bounds_changed', () => {
                searchBox.setBounds(map.getBounds());
            });

            // Listen for search box selection
            searchBox.addListener('places_changed', () => {
                const places = searchBox.getPlaces();
                if (places.length === 0) return;

                const place = places[0];
                if (!place.geometry || !place.geometry.location) return;

                // Update map and marker
                map.setCenter(place.geometry.location);
                marker.setPosition(place.geometry.location);

                // Update form fields
                updateLocationFields(
                    place.geometry.location.lat(),
                    place.geometry.location.lng(),
                    place.formatted_address
                );
            });
        }

        // Add marker drag event
        marker.addListener('dragend', () => {
            const position = marker.getPosition();
            reverseGeocode(position.lat(), position.lng());
        });

        // Add map click event
        map.addListener('click', (e) => {
            marker.setPosition(e.latLng);
            reverseGeocode(e.latLng.lat(), e.latLng.lng());
        });

        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.setCenter(pos);
                    marker.setPosition(pos);
                    reverseGeocode(pos.lat, pos.lng);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                }
            );
        }

        mapInitialized = true;
        console.log('Map initialization complete');

    } catch (error) {
        console.error('Error initializing map:', error);
        mapInitialized = false;
    }
}

// Function to update form fields with location data
function updateLocationFields(lat, lng, address = '') {
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const addressInput = document.getElementById('pickupAddress');
    const selectedAddressInput = document.getElementById('selectedAddress');

    if (latitudeInput) latitudeInput.value = lat;
    if (longitudeInput) longitudeInput.value = lng;
    
    if (address) {
        if (addressInput) addressInput.value = address;
        if (selectedAddressInput) selectedAddressInput.value = address;
    }

    // Store selected location
    selectedLocation = {
        address: address,
        coordinates: { lat, lng }
    };
}

// Function to reverse geocode coordinates to address
function reverseGeocode(lat, lng) {
    if (!geocoder) return;

    const latlng = { lat, lng };
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK' && results[0]) {
            updateLocationFields(lat, lng, results[0].formatted_address);
        } else {
            console.error('Geocoder failed:', status);
            // Still update coordinates even if address lookup fails
            updateLocationFields(lat, lng);
        }
    });
}

function setupLocationHandlers() {
    const availabilitySelect = document.getElementById('availability');
    const customAvailability = document.getElementById('customAvailability');

    // Handle availability selection
    availabilitySelect.addEventListener('change', (e) => {
        customAvailability.style.display = e.target.value === 'Custom' ? 'block' : 'none';
    });
} 
