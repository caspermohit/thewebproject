/**
 * Home page functionality
 * @author Mohit Shah
 * Handles home page functionality, including item management, and UI updates
 */

import itemsService from '../modules/items.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get all items
        const items = await itemsService.getItems();
        
        if (!Array.isArray(items)) {
            console.error('Items is not an array:', items);
            uiHandler.showNotification('Error loading items. Please refresh the page.', 'error');
            return;
        }

        // Function to format date
        const formatDate = (dateString) => {
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            } catch (error) {
                return 'Date not available';
            }
        };

        // Function to create a product card
        const createProductCard = (item, badge) => {
            // Safely get the first part of the address or provide a default
            const location = item.location?.address ? 
                item.location.address.split(',')[0] : 
                'Location not specified';

            return `
                <article class="product-card">
                    ${badge ? `<div class="card-badge">${badge}</div>` : ''}
                    <img src="${item.images?.[0]?.replace('./', '/') || '/src/assets/images/furniture/table.jpg'}" 
                         alt="${item.title || 'Item image'}"
                         onerror="this.src='/src/assets/images/furniture/table.jpg'">
                    <div class="card-section">
                        <h3>${item.title || 'Untitled Item'}</h3>
                        <p>${item.description ? `${item.description.slice(0, 50)}${item.description.length > 50 ? '...' : ''}` : 'No description available'}</p>
                        <div class="card-meta">
                            <span><i class="bx bx-map"></i> ${location}</span>
                            <span><i class="bx bx-time"></i> ${formatDate(item.created_at)}</span>
                        </div>
                        <a href="./src/pages/main/item-details.html?id=${item.id}" class="button expanded">View Details</a>
                    </div>
                </article>
            `;
        };

        // Update Featured Items section
        const featuredItemsContainer = document.querySelector('.items-section:first-of-type .grid-x');
        if (featuredItemsContainer) {
            try {
                // Get first 4 items for featured section
                const featuredItems = items.slice(0, 4);
                featuredItemsContainer.innerHTML = featuredItems.map(item => `
                    <div class="cell small-12 medium-6 large-3">
                        ${createProductCard(item, 'Featured')}
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error rendering featured items:', error);
                featuredItemsContainer.innerHTML = '<div class="cell"><div class="callout warning">Error loading featured items</div></div>';
            }
        }

        // Update Recently Added section
        const recentItemsContainer = document.querySelector('.items-section:last-of-type .grid-x');
        if (recentItemsContainer) {
            try {
                // Sort items by creation date and get the 4 most recent
                const recentItems = [...items]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .slice(0, 4);

                recentItemsContainer.innerHTML = recentItems.map(item => `
                    <div class="cell small-12 medium-6 large-3">
                        ${createProductCard(item, 'New')}
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error rendering recent items:', error);
                recentItemsContainer.innerHTML = '<div class="cell"><div class="callout warning">Error loading recent items</div></div>';
            }
        }
    } catch (error) {
        console.error('Error loading items:', error);
        uiHandler.showNotification('Error loading items. Please refresh the page.', 'error');
        
        // Show error message in containers
        const containers = [
            document.querySelector('.items-section:first-of-type .grid-x'),
            document.querySelector('.items-section:last-of-type .grid-x')
        ];
        
        containers.forEach(container => {
            if (container) {
                container.innerHTML = `
                    <div class="cell">
                        <div class="callout alert">
                            <h5>Error Loading Items</h5>
                            <p>There was a problem loading the items. Please try refreshing the page.</p>
                        </div>
                    </div>
                `;
            }
        });
    }
});

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted yesterday';
    if (diffDays < 7) return `Posted ${diffDays} days ago`;
    return `Posted on ${date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    })}`;
} 