// Browse page functionality
import itemsService from '../modules/items.js';
import uiHandler from '../modules/ui.js';
import authService from '../auth.js';
import alertsService from '../modules/alerts.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize variables
    let currentFilters = {
        category: '',
        location: '',
        search: ''
    };

    // Get DOM elements
    const filterForm = document.getElementById('filterForm');
    const searchInput = document.querySelector('.input-group-field[placeholder="Search items..."]');
    const itemsGrid = document.querySelector('.grid-x.grid-padding-x');
    const locationInput = document.getElementById('location');

    // Initialize category dropdown with available categories
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        try {
            const categories = await itemsService.getCategories();
            categorySelect.innerHTML = `
                <option value="">All Categories</option>
                ${categories.map(category => `
                    <option value="${category.name}">${category.display_name}</option>
                `).join('')}
            `;
        } catch (error) {
            console.error('Error loading categories:', error);
            uiHandler.showNotification('Error loading categories. Please refresh the page.', 'error');
        }
    }

    // Function to format location display
    const formatLocation = (location) => {
        if (!location || !location.address) return 'Location not specified';
        const parts = location.address.split(',').map(part => part.trim());
        // Return first part (street) and city if available
        return parts.length > 1 ? `${parts[0]}, ${parts[1]}` : parts[0];
    };

    // Function to render items
    const renderItems = (items) => {
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'grid-x grid-padding-x';

        if (items.length === 0) {
            const noItems = document.createElement('div');
            noItems.className = 'cell';
            
            // Check if user is logged in
            const currentUser = authService.getCurrentUser();
            const searchTerm = currentFilters.search;
            const locationTerm = currentFilters.location;
            
            noItems.innerHTML = `
                <div class="callout warning">
                    <h5>No items found matching your criteria.</h5>
                    ${currentUser ? `
                        <p>Would you like to be notified when items matching "${searchTerm}"${locationTerm ? ` in "${locationTerm}"` : ''} become available?</p>
                        <button type="button" class="button" id="setAlertBtn">
                            <i class="bx bx-bell"></i> Get notified when available
                        </button>
                    ` : `
                        <p>Please <a href="../auth/login.html">log in</a> to set notifications for when items become available.</p>
                    `}
                </div>
            `;
            
            itemsContainer.appendChild(noItems);
            
            // Replace existing items grid with new one
            const existingGrid = document.querySelector('.grid-x.grid-padding-x:not(:first-child)');
            if (existingGrid) {
                existingGrid.replaceWith(itemsContainer);
            } else {
                itemsGrid.appendChild(itemsContainer);
            }
            
            // Add event listener for alert button if user is logged in
            if (currentUser) {
                const setAlertBtn = document.getElementById('setAlertBtn');
                if (setAlertBtn) {
                    setAlertBtn.addEventListener('click', async () => {
                        const result = await alertsService.addAlert({
                            userId: currentUser.id,
                            searchTerm: searchTerm,
                            category: currentFilters.category,
                            location: currentFilters.location
                        });
                        
                        if (result.success) {
                            uiHandler.showNotification('Alert set! We\'ll notify you when matching items are available.', 'success');
                            setAlertBtn.disabled = true;
                            setAlertBtn.textContent = 'Alert Set';
                        } else {
                            uiHandler.showNotification('Failed to set alert. Please try again.', 'error');
                        }
                    });
                }
            }
            return;
        }

        // Show active filters if any
        const activeFilters = [];
        if (currentFilters.category) activeFilters.push(`Category: ${currentFilters.category}`);
        if (currentFilters.location) activeFilters.push(`Location: ${currentFilters.location}`);
        if (currentFilters.search) activeFilters.push(`Search: ${currentFilters.search}`);

        if (activeFilters.length > 0) {
            const filterInfo = document.createElement('div');
            filterInfo.className = 'cell';
            filterInfo.innerHTML = `
                <div class="callout primary">
                    <h6>Active Filters:</h6>
                    <p>${activeFilters.join(' | ')}</p>
                </div>
            `;
            itemsContainer.appendChild(filterInfo);
        }

        items.forEach(item => {
            const formattedLocation = formatLocation(item.location);
            const itemCard = document.createElement('div');
            itemCard.className = 'cell medium-4';
            itemCard.innerHTML = `
                <div class="card" role="article">
                    <img src="${item.images?.[0]?.replace('./', '/') || '/src/assets/images/furniture/couch.jpg'}" 
                         alt="${item.title || 'Item image'}" 
                         style="width: 100%; height: 200px; object-fit: cover;"
                         onerror="this.src='/src/assets/images/furniture/couch.jpg'">
                    <div class="card-section">
                        <h4 class="card-title">${item.title || 'Untitled Item'}</h4>
                        <p>Condition: ${item.condition || 'Not specified'}</p>
                        <p class="location">
                            <i class="bx bx-map-pin"></i> ${formattedLocation}
                        </p>
                        <div class="button-group">
                            <a href="map.html?item=${item.id}"  
                               aria-label="View ${item.title || 'item'} location on map">
                                <i class="bx bx-map"></i> View on Map
                            </a>
                            <a href="item-details.html?id=${item.id}" class="button small" 
                               aria-label="View ${item.title || 'item'} details">View Details</a>
                        </div>
                    </div>
                </div>
            `;
            itemsContainer.appendChild(itemCard);
        });

        // Replace existing items grid with new one
        const existingGrid = document.querySelector('.grid-x.grid-padding-x:not(:first-child)');
        if (existingGrid) {
            existingGrid.replaceWith(itemsContainer);
        } else {
            itemsGrid.appendChild(itemsContainer);
        }
    };

    // Function to update items based on filters
    const updateItems = async () => {
        try {
            const items = await itemsService.getItems(currentFilters);
            renderItems(items);
        } catch (error) {
            console.error('Error loading items:', error);
            uiHandler.showNotification('Error loading items. Please refresh the page.', 'error');
        }
    };

    // Handle filter form submission
    if (filterForm) {
        filterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            
            currentFilters = {
                ...currentFilters,
                category: formData.get('category'),
                location: formData.get('location')
            };

            await updateItems();
        });

        // Add reset button handler
        const resetButton = filterForm.querySelector('button[type="reset"]');
        if (resetButton) {
            resetButton.addEventListener('click', async () => {
                currentFilters = {
                    category: '',
                    location: '',
                    search: ''
                };
                if (searchInput) searchInput.value = '';
                if (locationInput) locationInput.value = '';
                if (categorySelect) categorySelect.value = '';
                await updateItems();
            });
        }
    }

    // Handle search input with debounce
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                currentFilters.search = e.target.value.trim();
                await updateItems();
            }, 300);
        });
    }

    // Handle location input with debounce
    if (locationInput) {
        let locationTimeout;
        locationInput.addEventListener('input', (e) => {
            clearTimeout(locationTimeout);
            locationTimeout = setTimeout(async () => {
                currentFilters.location = e.target.value.trim();
                await updateItems();
            }, 300);
        });
    }

    // Load initial items
    await updateItems();
});