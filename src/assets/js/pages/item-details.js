// Item Details page functionality
import itemsService from '../modules/items.js';
import messagesService from '../modules/messages.js';
import uiHandler from '../modules/ui.js';
import authService from '../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Get item ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        uiHandler.showNotification('Item not found', 'error');
        setTimeout(() => {
            window.location.href = '/src/pages/main/browse.html';
        }, 2000);
        return;
    }

    // Get item details
    const item = itemsService.getItemById(itemId);
    if (!item) {
        uiHandler.showNotification('Item not found', 'error');
        setTimeout(() => {
            window.location.href = '/src/pages/main/browse.html';
        }, 2000);
        return;
    }

    // Update page content
    document.title = `${item.title} - Share&Care`;

    // Update image
    const primaryImage = document.querySelector('.primary-image img');
    if (primaryImage) {
        primaryImage.src = item.images[0].replace('./', '/');
        primaryImage.alt = `${item.title} - Main view`;
    }

    // Update item details
    const itemTitle = document.querySelector('.item-details h1');
    if (itemTitle) itemTitle.textContent = item.title;

    // Update metadata
    const metadataList = document.querySelector('.item-meta dl');
    if (metadataList) {
        metadataList.innerHTML = `
            <dt>Category:</dt>
            <dd>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</dd>
            
            <dt>Condition:</dt>
            <dd>${item.condition}</dd>
            
            <dt>Location:</dt>
            <dd>${item.location.address.split(',')[0]}</dd>
            
            <dt>Posted:</dt>
            <dd>${formatDate(item.created_at)}</dd>

            <dt>Status:</dt>
            <dd>${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</dd>
        `;
    }

    // Update description
    const description = document.querySelector('.item-description p');
    if (description) description.textContent = item.description;

    // Update pickup information
    const donorInfo = document.querySelector('.donor-info');
    if (donorInfo) {
        donorInfo.innerHTML = `
            <h3>Pickup Information</h3>
            <p>Available for pickup: ${item.pickup_details.availability}</p>
            <p>Location: ${item.location.address}</p>
            <p>Donor: ${item.donor.name} (Rating: ${item.donor.rating}⭐)</p>
            <p>Instructions: ${item.pickup_details.instructions}</p>
        `;
    }

    // Update action buttons
    const buttonGroup = document.querySelector('.button-group');
    if (buttonGroup) {
        const currentUser = authService.getCurrentUser();
        const isOwnItem = currentUser && currentUser.id === item.donor.id;
        const isRecipient = currentUser && item.recipient && item.recipient.id === currentUser.id;
        const isAvailable = item.status === 'available';
        const isPending = item.status === 'pending';
        const isReserved = item.status === 'reserved';

        buttonGroup.innerHTML = `
            ${isAvailable && !isOwnItem ? `
                <button type="button" class="button" id="requestItemBtn" aria-label="Request this ${item.title}">
                    Request Item
                </button>
                <button type="button" class="button" id="messageBtn" aria-label="Message donor about this ${item.title}">
                    Message Donor
                </button>
            ` : ''}
            ${isOwnItem ? `
                ${isReserved ? `
                    <button type="button" class="button success" id="markPickedUpBtn" aria-label="Mark ${item.title} as picked up">
                        <i class="bx bx-check"></i> Mark as Picked Up
                    </button>
                ` : ''}
                <button type="button" class="button" id="editItemBtn">Edit Item</button>
                <button type="button" class="button alert" id="deleteItemBtn" aria-label="Delete this ${item.title}">Delete Item</button>
            ` : ''}
            ${isRecipient ? `
                ${isReserved ? `
                    <button type="button" class="button success" id="markPickedUpBtn" aria-label="Mark ${item.title} as picked up">
                        <i class="bx bx-check"></i> Mark as Picked Up
                    </button>
                    <button type="button" class="button" id="messageBtn" aria-label="Message donor about this ${item.title}">
                        <i class="bx bx-message"></i> Message Donor
                    </button>
                ` : ''}
            ` : ''}
            <a href="../main/map.html?item=${item.id}" class="button" aria-label="View ${item.title} location on map">
                <i class="bx bx-map"></i> View on Map
            </a>
        `;

        // Add event listener for picked up button
        const markPickedUpBtn = document.getElementById('markPickedUpBtn');
        if (markPickedUpBtn) {
            markPickedUpBtn.addEventListener('click', async () => {
                try {
                    const confirmPickup = await uiHandler.showModal(`
                        <div class="text-center">
                            <h3>Confirm Pickup</h3>
                            <p>Are you sure you want to mark "${item.title}" as picked up? This action cannot be undone.</p>
                            <div class="button-group">
                                <button class="button success" id="confirmPickup">Yes, Confirm Pickup</button>
                                <button class="button secondary" id="cancelPickup">Cancel</button>
                            </div>
                        </div>
                    `, {
                        closeButton: true,
                        width: '400px'
                    });

                    document.getElementById('confirmPickup').addEventListener('click', async () => {
                        const result = await itemsService.markAsPickedUp(item.id);
                        if (result.success) {
                            uiHandler.showNotification('Item marked as picked up successfully', 'success');
                            confirmPickup.close();
                            // Redirect to history page after a short delay
                            setTimeout(() => {
                                window.location.href = '/src/pages/main/history.html';
                            }, 1500);
                        } else {
                            uiHandler.showNotification(result.error, 'error');
                        }
                    });

                    document.getElementById('cancelPickup').addEventListener('click', () => {
                        confirmPickup.close();
                    });
                } catch (error) {
                    console.error('Error marking item as picked up:', error);
                    uiHandler.showNotification('Failed to mark item as picked up. Please try again.', 'error');
                }
            });
        }

        // Add event listener for message button
        const messageBtn = document.getElementById('messageBtn');
        if (messageBtn) {
            messageBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    uiHandler.showNotification('Please log in to message the donor', 'warning');
                    setTimeout(() => {
                        window.location.href = '/src/pages/auth/login.html';
                    }, 2000);
                    return;
                }

                // Start or get existing conversation
                const result = await messagesService.startConversation({
                    participants: [currentUser.id, item.donor.id],
                    itemId: item.id,
                    itemTitle: item.title
                });

                if (result.success) {
                    window.location.href = `/src/pages/main/messages.html?conversation=${result.conversation.id}`;
                } else {
                    uiHandler.showNotification(result.error, 'error');
                }
            });
        }

        const requestItemBtn = document.getElementById('requestItemBtn');
        if (requestItemBtn) {
            requestItemBtn.addEventListener('click', async () => {
                if (!currentUser) {
                    uiHandler.showNotification('Please log in to request items', 'warning');
                    setTimeout(() => {
                        window.location.href = '/src/pages/auth/login.html';
                    }, 2000);
                    return;
                }

                // Show request modal
                const modalContent = `
                    <div class="request-item-modal">
                        <h3>Request Item</h3>
                        <form id="requestItemForm">
                            <label for="requestMessage">Message to Donor
                                <textarea id="requestMessage" name="message" rows="4" 
                                    placeholder="Introduce yourself and explain why you're interested in this item..." 
                                    required></textarea>
                            </label>
                            <button type="submit" class="button expanded">Send Request</button>
                        </form>
                    </div>
                `;

                const modal = await uiHandler.showModal(modalContent, {
                    closeButton: true,
                    width: '500px'
                });

                const requestForm = document.getElementById('requestItemForm');
                requestForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const message = document.getElementById('requestMessage').value.trim();
                    
                    const result = await itemsService.requestItem(item.id, message);
                    if (result.success) {
                        uiHandler.showNotification('Request sent successfully!', 'success');
                        modal.close();
                    } else {
                        uiHandler.showNotification(result.error, 'error');
                    }
                });
            });
        }

        // Handle delete item
        const deleteItemBtn = document.getElementById('deleteItemBtn');
        if (deleteItemBtn) {
            deleteItemBtn.addEventListener('click', async () => {
                const confirmDelete = await uiHandler.showModal(`
                    <div class="text-center">
                        <h3>Delete Item</h3>
                        <p>Are you sure you want to delete "${item.title}"? This action cannot be undone.</p>
                        <div class="button-group">
                            <button class="button alert" id="confirmDelete">Yes, Delete</button>
                            <button class="button secondary" id="cancelDelete">Cancel</button>
                        </div>
                    </div>
                `, {
                    closeButton: true,
                    width: '400px'
                });

                document.getElementById('confirmDelete').addEventListener('click', async () => {
                    const result = await itemsService.deleteItem(item.id);
                    if (result.success) {
                        uiHandler.showNotification('Item deleted successfully', 'success');
                        confirmDelete.close();
                        setTimeout(() => {
                            window.location.href = '/src/pages/main/browse.html';
                        }, 1500);
                    } else {
                        uiHandler.showNotification(result.error, 'error');
                    }
                });

                document.getElementById('cancelDelete').addEventListener('click', () => {
                    confirmDelete.close();
                });
            });
        }

        // Handle edit item
        const editItemBtn = document.getElementById('editItemBtn');
        if (editItemBtn) {
            editItemBtn.addEventListener('click', async () => {
                try {
                    // Get categories and conditions asynchronously
                    const [categories, conditions] = await Promise.all([
                        itemsService.getCategories(),
                        itemsService.getConditions()
                    ]);

                    if (!Array.isArray(categories) || !Array.isArray(conditions)) {
                        throw new Error('Failed to load categories or conditions');
                    }

                    const modalContent = `
                        <div class="edit-item-modal">
                            <h3>Edit Item</h3>
                            <form id="editItemForm">
                                <label for="editTitle">Title
                                    <input type="text" id="editTitle" name="title" value="${item.title}" required>
                                </label>

                                <label for="editCategory">Category
                                    <select id="editCategory" name="category" required>
                                        ${categories.map(cat => `
                                            <option value="${cat.name}" ${cat.name === item.category ? 'selected' : ''}>
                                                ${cat.display_name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </label>

                                <label for="editCondition">Condition
                                    <select id="editCondition" name="condition" required>
                                        ${conditions.map(cond => `
                                            <option value="${cond.name}" ${cond.name === item.condition ? 'selected' : ''}>
                                                ${cond.display_name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </label>

                                <label for="editDescription">Description
                                    <textarea id="editDescription" name="description" rows="4" required>${item.description}</textarea>
                                </label>

                                <label for="editPickupDetails">Pickup Details
                                    <textarea id="editPickupDetails" name="pickup_details" rows="3" required>${item.pickup_details.instructions}</textarea>
                                </label>

                                <button type="submit" class="button expanded">Save Changes</button>
                            </form>
                        </div>
                    `;

                    const modal = await uiHandler.showModal(modalContent, {
                        closeButton: true,
                        width: '600px'
                    });

                    const editForm = document.getElementById('editItemForm');
                    editForm.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        try {
                            const formData = new FormData(editForm);
                            
                            // Update item data
                            item.title = formData.get('title');
                            item.category = formData.get('category');
                            item.condition = formData.get('condition');
                            item.description = formData.get('description');
                            item.pickup_details.instructions = formData.get('pickup_details');
                            item.updated_at = new Date().toISOString();

                            // Save changes
                            await itemsService.saveItems();
                            
                            // Update UI
                            itemTitle.textContent = item.title;
                            document.title = `${item.title} - Share&Care`;
                            description.textContent = item.description;
                            
                            // Update metadata
                            metadataList.innerHTML = `
                                <dt>Category:</dt>
                                <dd>${item.category.charAt(0).toUpperCase() + item.category.slice(1)}</dd>
                                
                                <dt>Condition:</dt>
                                <dd>${item.condition}</dd>
                                
                                <dt>Location:</dt>
                                <dd>${item.location.address.split(',')[0]}</dd>
                                
                                <dt>Posted:</dt>
                                <dd>${formatDate(item.created_at)}</dd>

                                <dt>Status:</dt>
                                <dd>${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</dd>
                            `;

                            // Update pickup information
                            donorInfo.innerHTML = `
                                <h3>Pickup Information</h3>
                                <p>Available for pickup: ${item.pickup_details.availability}</p>
                                <p>Location: ${item.location.address}</p>
                                <p>Donor: ${item.donor.name} (Rating: ${item.donor.rating}⭐)</p>
                                <p>Instructions: ${item.pickup_details.instructions}</p>
                            `;

                            uiHandler.showNotification('Item updated successfully', 'success');
                            modal.close();
                        } catch (error) {
                            console.error('Error updating item:', error);
                            uiHandler.showNotification('Failed to update item. Please try again.', 'error');
                        }
                    });
                } catch (error) {
                    console.error('Error loading edit form:', error);
                    uiHandler.showNotification('Failed to load edit form. Please try again.', 'error');
                }
            });
        }
    }
});

// Helper function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
} 