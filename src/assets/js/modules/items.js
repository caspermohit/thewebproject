// Items Service for Share&Care Platform
import authService from '../auth.js';
import alertsService from './alerts.js';
import notificationsService from './notifications.js';
import uiHandler from './ui.js';

class ItemsService {
    constructor() {
        this.items = [];
        this.categories = [];
        this.conditions = [];
        this.statuses = [];
        this.STORAGE_KEY = 'sharecare_items';
        this.MAX_ITEMS = 100; // Maximum number of items to store
        this.initialized = false;
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            await this.loadItems();
            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize ItemsService:', error);
            throw error;
        }
    }

    // Calculate approximate size of data in bytes
    calculateDataSize(data) {
        return new Blob([JSON.stringify(data)]).size;
    }

    // Clean up old items when approaching quota
    cleanupOldItems() {
        if (this.items.length > this.MAX_ITEMS) {
            // Sort by date and keep only the most recent items
            this.items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            this.items = this.items.slice(0, this.MAX_ITEMS);
        }
    }

    async loadItems() {
        try {
            // First try to get items from localStorage
            let data = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            
            // If not in localStorage or data is empty, fetch from file
            if (!data || !data.items || data.items.length === 0) {
                console.log('Loading data from JSON file...');
                const response = await fetch('/src/assets/data/items.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                data = await response.json();
                console.log('Data loaded from file:', data);
            }
            
            // Ensure we have valid data structure
            this.items = data.items || [];
            this.categories = data.categories || [];
            this.conditions = data.conditions || [];
            this.statuses = data.statuses || [];

            // Store complete data in localStorage
            const completeData = {
                items: this.items,
                categories: this.categories,
                conditions: this.conditions,
                statuses: this.statuses
            };
            
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(completeData));
                console.log('Data saved to localStorage');
            } catch (storageError) {
                console.error('Error saving to localStorage:', storageError);
            }

            console.log('Loaded items:', this.items.length);
            console.log('Loaded categories:', this.categories.length);
            console.log('Loaded conditions:', this.conditions.length);
            console.log('Loaded statuses:', this.statuses.length);

        } catch (error) {
            console.error('Error in loadItems:', error);
            try {
                console.log('Attempting to load from alternate path...');
                const response = await fetch('/src/assets/data/items.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                this.items = data.items || [];
                this.categories = data.categories || [];
                this.conditions = data.conditions || [];
                this.statuses = data.statuses || [];
                
                console.log('Successfully loaded from alternate path');
                
                try {
                    const completeData = {
                        items: this.items,
                        categories: this.categories,
                        conditions: this.conditions,
                        statuses: this.statuses
                    };
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(completeData));
                    console.log('Data saved to localStorage after fallback load');
                } catch (storageError) {
                    console.error('Error saving to localStorage after fallback:', storageError);
                }
            } catch (fallbackError) {
                console.error('Failed to load items from file:', fallbackError);
                uiHandler.showNotification('Error loading items. Please refresh the page.', 'error');
                throw fallbackError;
            }
        }
    }

    async addItem(itemData) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('You must be logged in to donate items');
            }

            // Generate unique ID
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Create new item object
            const newItem = {
                id: itemId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                status: 'available',
                ...itemData,
                donor: {
                    id: currentUser.id,
                    name: `${currentUser.first_name} ${currentUser.last_name}`,
                    rating: currentUser.donation_stats?.rating || 0
                }
            };

            // Check size before adding
            const newSize = this.calculateDataSize([...this.items, newItem]);
            if (newSize > 4.5 * 1024 * 1024) { // If approaching 5MB limit
                this.cleanupOldItems();
            }

            // Add item to array
            this.items.unshift(newItem); // Add to beginning of array

            // Try to save
            const saved = await this.saveItems();
            if (!saved) {
                throw new Error('Failed to save item due to storage constraints');
            }

            // Check for matching alerts and create notifications
            await alertsService.loadAlerts(); // Make sure alerts are loaded
            const alerts = alertsService.alerts || []; // Get ALL alerts, not just current user's

            // Check each alert for matches
            for (const alert of alerts) {
                // Skip if the alert belongs to the current user (don't notify yourself)
                if (alert.userId === currentUser.id) continue;
                
                // Check if alert is active and matches the new item
                if (alert.isActive && alertsService.itemMatchesAlert(newItem, alert)) {
                    // Create notification for the alert owner
                    await notificationsService.addNotification({
                        userId: alert.userId,
                        type: 'alert_match',
                        title: 'New Item Match Found!',
                        message: `A new item "${newItem.title}" matches your alert for "${alert.searchTerm}"`,
                        itemId: newItem.id
                    });

                    // Update alert match count
                    alert.matchCount = (alert.matchCount || 0) + 1;
                    alert.lastChecked = new Date().toISOString();
                }
            }

            // Save updated alerts
            alertsService.saveAlerts();

            return {
                success: true,
                item: newItem
            };
        } catch (error) {
            console.error('Error adding item:', error);
            return {
                success: false,
                error: 'Failed to add item. Storage quota exceeded. Please try removing some old items.'
            };
        }
    }

    async getItems(filters = {}) {
        await this.initializationPromise;
        let filteredItems = [...this.items];

        // By default, exclude completed items unless specifically requested
        if (!filters.includeCompleted) {
            filteredItems = filteredItems.filter(item => item.status !== 'completed');
        }

        // Apply filters
        if (filters.category) {
            filteredItems = filteredItems.filter(item => 
                item.category.toLowerCase() === filters.category.toLowerCase()
            );
        }

        if (filters.condition) {
            filteredItems = filteredItems.filter(item => 
                item.condition.toLowerCase() === filters.condition.toLowerCase()
            );
        }

        if (filters.status) {
            filteredItems = filteredItems.filter(item => 
                item.status.toLowerCase() === filters.status.toLowerCase()
            );
        }

        if (filters.location && filters.location.trim()) {
            const searchLocation = filters.location.trim().toLowerCase();
            filteredItems = filteredItems.filter(item => {
                if (!item.location || !item.location.address) return false;
                
                // Split address into components and check each part
                const addressParts = item.location.address.toLowerCase().split(',').map(part => part.trim());
                
                // Check if any part of the address matches the search term
                return addressParts.some(part => part.includes(searchLocation));
            });
        }

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredItems = filteredItems.filter(item => 
                item.title.toLowerCase().includes(searchTerm) ||
                (item.description && item.description.toLowerCase().includes(searchTerm))
            );
        }

        // Sort by date (newest first)
        filteredItems.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );

        return filteredItems;
    }

    getItemById(itemId) {
        return this.items.find(item => item.id === itemId);
    }

    async getCategories() {
        await this.initializationPromise;
        return this.categories;
    }

    async getConditions() {
        await this.initializationPromise;
        return this.conditions;
    }

    async getStatuses() {
        await this.initializationPromise;
        return this.statuses;
    }

    getUserItems(userId, type = 'donated') {
        if (type === 'donated') {
            return this.items.filter(item => item.donor.id === userId);
        } else if (type === 'received') {
            return this.items.filter(item => 
                item.recipient && item.recipient.id === userId
            );
        } else if (type === 'completed') {
            return this.items.filter(item => 
                (item.donor.id === userId || (item.recipient && item.recipient.id === userId)) &&
                item.status === 'completed'
            );
        }
        return [];
    }

    async saveItems() {
        try {
            this.cleanupOldItems();
            
            // Prepare complete data object
            const data = {
                items: this.items,
                categories: this.categories,
                conditions: this.conditions,
                statuses: this.statuses
            };
            
            // Try to save with cleanup first
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    // If still exceeding quota, try more aggressive cleanup
                    const halfLength = Math.floor(this.items.length / 2);
                    this.items = this.items.slice(0, halfLength);
                    
                    // Try saving again with reduced items
                    const reducedData = {
                        items: this.items,
                        categories: this.categories,
                        conditions: this.conditions,
                        statuses: this.statuses
                    };
                    
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedData));
                    console.warn('Storage quota exceeded. Removed older items to free up space.');
                    return true;
                }
                throw e;
            }
        } catch (error) {
            console.error('Error saving items:', error);
            return false;
        }
    }

    async deleteItem(itemId) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('You must be logged in to delete items');
            }

            const itemIndex = this.items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                throw new Error('Item not found');
            }

            const item = this.items[itemIndex];
            if (item.donor.id !== currentUser.id) {
                throw new Error('You can only delete your own items');
            }

            // Remove the item from the array
            this.items.splice(itemIndex, 1);

            // Update localStorage
            this.saveItems();

            return {
                success: true,
                message: 'Item deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting item:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
//request item
    async requestItem(itemId, message) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('You must be logged in to request items');
            }

            const item = this.getItemById(itemId);
            if (!item) {
                throw new Error('Item not found');
            }

            if (item.status !== 'available') {
                throw new Error('This item is no longer available');
            }

            if (item.donor.id === currentUser.id) {
                throw new Error('You cannot request your own item');
            }

            // Create a request ID
            const requestId = `req_${Date.now()}`;

            // Update item with request information
            item.requests = item.requests || [];
            item.requests.push({
                id: requestId,
                userId: currentUser.id,
                userName: `${currentUser.first_name} ${currentUser.last_name}`,
                message: message,
                status: 'pending',
                createdAt: new Date().toISOString()
            });

            // Save changes
            this.saveItems();

            // Create notification for the donor
            await notificationsService.addNotification({
                userId: item.donor.id,
                type: 'item_request',
                title: 'New Item Request',
                message: `${currentUser.first_name} ${currentUser.last_name} is interested in your item "${item.title}"`,
                itemId: item.id,
                requestId: requestId,
                requesterName: `${currentUser.first_name} ${currentUser.last_name}`,
                requestMessage: message
            });

            return {
                success: true,
                message: 'Request sent successfully'
            };
        } catch (error) {
            console.error('Error requesting item:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateRequestStatus(itemId, requestId, newStatus) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('You must be logged in to update request status');
            }

            const item = this.getItemById(itemId);
            if (!item) {
                throw new Error('Item not found');
            }

            if (item.donor.id !== currentUser.id) {
                throw new Error('Only the donor can update request status');
            }

            const request = item.requests?.find(req => req.id === requestId);
            if (!request) {
                throw new Error('Request not found');
            }

            // Update request status
            request.status = newStatus;
            request.updatedAt = new Date().toISOString();

            // If accepted, update item status
            if (newStatus === 'accepted') {
                item.status = 'reserved';
                item.recipient = {
                    id: request.userId,
                    name: request.userName
                };

                // Notify other requesters that the item is no longer available
                const otherRequests = item.requests.filter(req => req.id !== requestId);
                for (const otherRequest of otherRequests) {
                    await notificationsService.addNotification({
                        userId: otherRequest.userId,
                        type: 'request_update',
                        title: 'Item No Longer Available',
                        message: `The item "${item.title}" has been reserved for another user`,
                        itemId: item.id
                    });
                }
            }

            // Notify the requester about the status update
            await notificationsService.addNotification({
                userId: request.userId,
                type: 'request_update',
                title: 'Request Status Updated',
                message: `Your request for "${item.title}" has been ${newStatus}`,
                itemId: item.id,
                requestId: requestId,
                status: newStatus
            });

            // Save changes
            this.saveItems();

            return {
                success: true,
                message: `Request ${newStatus} successfully`
            };
        } catch (error) {
            console.error('Error updating request status:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async markAsPickedUp(itemId) {
        try {
            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('You must be logged in to update item status');
            }

            const item = this.getItemById(itemId);
            if (!item) {
                throw new Error('Item not found');
            }

            // Only the recipient can mark as picked up
            if (!item.recipient || item.recipient.id !== currentUser.id) {
                throw new Error('Only the recipient can mark an item as picked up');
            }

            // Update item status
            item.status = 'completed';
            item.pickedUpAt = new Date().toISOString();

            // Create notification for the donor
            await notificationsService.addNotification({
                userId: item.donor.id,
                type: 'item_pickup',
                title: 'Item Picked Up',
                message: `${currentUser.first_name} ${currentUser.last_name} has picked up "${item.title}"`,
                itemId: item.id
            });

            // Save changes
            await this.saveItems();

            return {
                success: true,
                message: 'Item marked as picked up'
            };
        } catch (error) {
            console.error('Error marking item as picked up:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Create and export a single instance
const itemsService = new ItemsService();
export default itemsService; 