/**
 * Search Results page functionality
 * @author sudheer chavali
 * Handles search results page functionality, including item management, alert functionality, and UI updates
 */

import itemsService from '../modules/items.js';
import alertsService from '../modules/alerts.js';
import authService from '../auth.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterForm = document.getElementById('filterForm');
    const saveSearchCard = document.querySelector('.save-search-card');
    const saveSearchBtn = document.getElementById('saveSearchBtn');
    const searchResults = document.querySelector('.search-results');
    const noResults = document.querySelector('.no-results');
    const searchSummary = document.querySelector('.search-summary');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q') || '';
    const initialCategory = urlParams.get('category') || '';

    // Set initial search values
    searchInput.value = initialQuery;
    if (initialCategory) {
        document.getElementById('category').value = initialCategory;
    }

    // Initialize filters
    let currentFilters = {
        search: initialQuery,
        category: initialCategory,
        location: '',
        condition: ''
    };

    // Initialize category and condition dropdowns
    function initializeDropdowns() {
        const categorySelect = document.getElementById('category');
        const conditionSelect = document.getElementById('condition');

        // Populate categories
        const categories = itemsService.getCategories();
        categorySelect.innerHTML = `
            <option value="">All Categories</option>
            ${categories.map(category => `
                <option value="${category.name}" ${category.name === initialCategory ? 'selected' : ''}>
                    ${category.display_name}
                </option>
            `).join('')}
        `;

        // Populate conditions
        const conditions = itemsService.getConditions();
        conditionSelect.innerHTML = `
            <option value="">Any Condition</option>
            ${conditions.map(condition => `
                <option value="${condition.name}">${condition.display_name}</option>
            `).join('')}
        `;
    }

    // Function to update search summary
    function updateSearchSummary() {
        const activeFilters = [];
        if (currentFilters.search) activeFilters.push(`"${currentFilters.search}"`);
        if (currentFilters.category) {
            const category = itemsService.getCategories().find(c => c.name === currentFilters.category);
            if (category) activeFilters.push(category.display_name);
        }
        if (currentFilters.condition) {
            const condition = itemsService.getConditions().find(c => c.name === currentFilters.condition);
            if (condition) activeFilters.push(condition.display_name);
        }
        if (currentFilters.location) activeFilters.push(`near "${currentFilters.location}"`);

        searchSummary.innerHTML = activeFilters.length > 0 
            ? `<p>Showing results for ${activeFilters.join(' • ')}</p>`
            : '<p>Showing all items</p>';
    }

    // Function to render search results
    function renderResults(items) {
        if (items.length === 0) {
            searchResults.style.display = 'none';
            noResults.style.display = 'block';
            
            // Show save search card for logged-in users
            const currentUser = authService.getCurrentUser();
            if (currentUser && (currentFilters.search || currentFilters.category || currentFilters.location)) {
                saveSearchCard.style.display = 'block';
            } else {
                saveSearchCard.style.display = 'none';
            }
        } else {
            searchResults.style.display = 'grid';
            noResults.style.display = 'none';
            saveSearchCard.style.display = 'none';

            searchResults.innerHTML = items.map(item => `
                <div class="cell medium-4">
                    <div class="card" role="article">
                        <img src="${item.images[0]}" alt="${item.title}" style="width: 100%; height: 200px; object-fit: cover;">
                        <div class="card-section">
                            <h4 class="card-title">${item.title}</h4>
                            <p>Condition: ${item.condition}</p>
                            <p>Location: ${item.location.address.split(',')[0]}</p>
                            <a href="map.html?item=${item.id}" aria-label="View ${item.title} location on map">
                                <i class="bx bx-map"></i> View on Map
                            </a>
                            <a href="item-details.html?id=${item.id}" class="button expanded" aria-label="View ${item.title} details">View Details</a>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    // Function to perform search
    function performSearch() {
        const items = itemsService.getItems(currentFilters);
        renderResults(items);
        updateSearchSummary();

        // Update URL with search parameters
        const params = new URLSearchParams();
        if (currentFilters.search) params.set('q', currentFilters.search);
        if (currentFilters.category) params.set('category', currentFilters.category);
        if (currentFilters.location) params.set('location', currentFilters.location);
        if (currentFilters.condition) params.set('condition', currentFilters.condition);
        
        const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
        window.history.pushState({}, '', newUrl);
    }

    // Initialize dropdowns
    initializeDropdowns();

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        currentFilters.search = searchInput.value.trim();
        performSearch();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentFilters.search = searchInput.value.trim();
            performSearch();
        }
    });

    filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(filterForm);
        
        currentFilters = {
            ...currentFilters,
            category: formData.get('category'),
            location: formData.get('location'),
            condition: formData.get('condition')
        };

        performSearch();
    });

    filterForm.addEventListener('reset', () => {
        setTimeout(() => {
            currentFilters = {
                search: searchInput.value.trim(),
                category: '',
                location: '',
                condition: ''
            };
            performSearch();
        }, 0);
    });

    saveSearchBtn?.addEventListener('click', async () => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            uiHandler.showNotification('Please log in to save searches', 'warning');
            setTimeout(() => {
                window.location.href = '../auth/login.html';
            }, 2000);
            return;
        }

        const result = await alertsService.addAlert({
            userId: currentUser.id,
            searchTerm: currentFilters.search,
            category: currentFilters.category,
            location: currentFilters.location
        });

        if (result.success) {
            uiHandler.showNotification('Search alert saved! We\'ll notify you when matching items are available.', 'success');
            saveSearchBtn.disabled = true;
            saveSearchBtn.innerHTML = '<i class="bx bx-check"></i> Alert Set';
        } else {
            uiHandler.showNotification('Failed to save search alert. Please try again.', 'error');
        }
    });

    // Perform initial search
    performSearch();
}); 