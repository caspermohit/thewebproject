// History page functionality
import itemsService from '../modules/items.js';
import authService from '../auth.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
        uiHandler.showNotification('Please log in to view your history', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }

    // Get user's donated and received items
    const donatedItems = itemsService.getUserItems(currentUser.id, 'donated');
    const receivedItems = itemsService.getUserItems(currentUser.id, 'received');

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Function to get status badge class
    function getStatusBadgeClass(status) {
        switch (status.toLowerCase()) {
            case 'available': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'completed': return 'badge-secondary';
            default: return 'badge-primary';
        }
    }

    // Function to create item row
    function createItemRow(item, type = 'donated') {
        return `
            <tr>
                <td>
                    <div class="grid-x grid-padding-x align-middle">
                        <div class="cell small-3">
                            <img src="${item.images[0]}" alt="${item.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);">
                        </div>
                        <div class="cell small-9">
                            <a href="../main/item-details.html?id=${item.id}">${item.title}</a>
                            <p class="help-text margin-0">${item.category}</p>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(item.status)}">${item.status}</span>
                </td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <div class="button-group tiny">
                        <a href="../main/item-details.html?id=${item.id}" class="button">View</a>
                        ${item.status === 'available' && type === 'donated' ? `
                            <button type="button" class="button alert" data-item-id="${item.id}">Remove</button>
                        ` : ''}
                        ${item.status === 'pending' ? `
                            <button type="button" class="button secondary" data-item-id="${item.id}">
                                ${type === 'donated' ? 'Review Request' : 'Cancel Request'}
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    // Render donated items
    const donatedItemsTable = document.getElementById('donatedItemsTable');
    if (donatedItemsTable) {
        const tbody = donatedItemsTable.querySelector('tbody');
        if (donatedItems.length > 0) {
            tbody.innerHTML = donatedItems.map(item => createItemRow(item, 'donated')).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <p>You haven't donated any items yet.</p>
                        <a href="../main/donate.html" class="button small">Donate Now</a>
                    </td>
                </tr>
            `;
        }
    }

    // Render received items
    const receivedItemsTable = document.getElementById('receivedItemsTable');
    if (receivedItemsTable) {
        const tbody = receivedItemsTable.querySelector('tbody');
        if (receivedItems.length > 0) {
            tbody.innerHTML = receivedItems.map(item => createItemRow(item, 'received')).join('');
        } else {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <p>You haven't received any items yet.</p>
                        <a href="../main/browse.html" class="button small">Browse Items</a>
                    </td>
                </tr>
            `;
        }
    }

    // Handle item actions
    document.addEventListener('click', async (e) => {
        if (e.target.matches('button[data-item-id]')) {
            const itemId = e.target.dataset.itemId;
            
            if (e.target.classList.contains('alert')) {
                // Handle remove item
                if (confirm('Are you sure you want to remove this item?')) {
                    const result = await itemsService.deleteItem(itemId);
                    if (result.success) {
                        uiHandler.showNotification(result.message, 'success');
                        e.target.closest('tr').remove();
                    } else {
                        uiHandler.showNotification(result.error, 'alert');
                    }
                }
            } else if (e.target.classList.contains('secondary')) {
                // Handle review/cancel request
                const action = e.target.textContent.trim();
                if (action === 'Review Request') {
                    // Show request review modal (in a real app)
                    uiHandler.showNotification('Request review feature coming soon', 'info');
                } else if (action === 'Cancel Request') {
                    if (confirm('Are you sure you want to cancel this request?')) {
                        // In a real app, this would make an API call
                        uiHandler.showNotification('Request cancelled successfully', 'success');
                        e.target.closest('tr').remove();
                    }
                }
            }
        }
    });

    // Initialize stats
    const statsContainer = document.querySelector('.user-stats');
    if (statsContainer && currentUser.donation_stats) {
        statsContainer.innerHTML = `
            <div class="grid-x grid-margin-x text-center">
                <div class="cell small-4">
                    <div class="stat-card">
                        <h3>${currentUser.donation_stats.items_donated}</h3>
                        <p>Items Donated</p>
                    </div>
                </div>
                <div class="cell small-4">
                    <div class="stat-card">
                        <h3>${currentUser.donation_stats.items_received}</h3>
                        <p>Items Received</p>
                    </div>
                </div>
                <div class="cell small-4">
                    <div class="stat-card">
                        <h3>${currentUser.donation_stats.rating}⭐</h3>
                        <p>Rating</p>
                    </div>
                </div>
            </div>
        `;
    }
}); 