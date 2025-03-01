// Notifications page functionality
import notificationsService from '../modules/notifications.js';
import authService from '../auth.js';
import uiHandler from '../modules/ui.js';
import itemsService from '../modules/items.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
        uiHandler.showNotification('Please log in to view your notifications', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }

    // Get notifications list container
    const notificationsList = document.querySelector('.notifications-list');
    
    // Get user's notifications
    const notifications = notificationsService.getNotifications(currentUser.id);

    // Function to format date
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.floor(diffTime / (1000 * 60));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    }

    // Function to get notification icon
    function getNotificationIcon(type) {
        switch (type) {
            case 'message':
                return 'bx-chat';
            case 'alert_match':
                return 'bx-bell-plus';
            case 'item_request':
                return 'bx-package';
            case 'request_update':
                return 'bx-check-circle';
            default:
                return 'bx-bell';
        }
    }

    // Function to get notification action button
    function getNotificationAction(notification) {
        switch (notification.type) {
            case 'message':
                return `<button class="button small view-conversation" data-conversation-id="${notification.conversationId}">View Conversation</button>`;
            case 'alert_match':
                return `<button class="button small view-item" data-item-id="${notification.itemId}">View Item</button>`;
            case 'item_request':
                return `
                    <div class="button-group">
                        <button class="button small success accept-request" data-item-id="${notification.itemId}" data-request-id="${notification.requestId}">Accept</button>
                        <button class="button small alert reject-request" data-item-id="${notification.itemId}" data-request-id="${notification.requestId}">Decline</button>
                        <button class="button small view-item" data-item-id="${notification.itemId}">View Item</button>
                    </div>
                    <p class="request-message"><strong>Message:</strong> ${notification.requestMessage}</p>
                `;
            case 'request_update':
                return `<button class="button small view-item" data-item-id="${notification.itemId}">View Item</button>`;
            default:
                return '';
        }
    }

    // Render notifications
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="text-center margin-top-2">
                <i class="bx bx-bell-off" style="font-size: 3rem; color: #ccc;"></i>
                <p>No notifications yet</p>
            </div>
        `;
    } else {
        notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification ${notification.isRead ? '' : 'unread'}" data-notification-id="${notification.id}">
                <div class="grid-x grid-padding-x align-middle">
                    <div class="cell shrink">
                        <i class="bx ${getNotificationIcon(notification.type)} notification-icon"></i>
                    </div>
                    <div class="cell auto">
                        <h6 class="notification-title">${notification.title}</h6>
                        <p>${notification.message}</p>
                        <time>${formatDate(notification.createdAt)}</time>
                    </div>
                    <div class="cell shrink">
                        <div class="button-group">
                            ${getNotificationAction(notification)}
                            <button class="button small clear mark-read" data-notification-id="${notification.id}" ${notification.isRead ? 'style="display: none;"' : ''}>
                                <i class="bx bx-check"></i>
                            </button>
                            <button class="button small clear delete-notification" data-notification-id="${notification.id}">
                                <i class="bx bx-x"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Handle mark all as read
    const markAllReadBtn = document.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async () => {
            const unreadNotifications = notifications.filter(n => !n.isRead);
            
            for (const notification of unreadNotifications) {
                await notificationsService.markAsRead(notification.id, currentUser.id);
            }
            
            document.querySelectorAll('.notification.unread').forEach(el => {
                el.classList.remove('unread');
                el.querySelector('.mark-read').style.display = 'none';
            });
            
            uiHandler.showNotification('All notifications marked as read', 'success');
        });
    }

    // Handle notification actions
    notificationsList.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const notificationId = target.closest('.notification').dataset.notificationId;

        if (target.classList.contains('mark-read')) {
            const result = await notificationsService.markAsRead(notificationId, currentUser.id);
            if (result.success) {
                target.closest('.notification').classList.remove('unread');
                target.style.display = 'none';
            }
        } else if (target.classList.contains('delete-notification')) {
            const result = await notificationsService.deleteNotification(notificationId, currentUser.id);
            if (result.success) {
                target.closest('.notification').remove();
                if (notificationsList.children.length === 0) {
                    notificationsList.innerHTML = `
                        <div class="text-center margin-top-2">
                            <i class="bx bx-bell-off" style="font-size: 3rem; color: #ccc;"></i>
                            <p>No notifications yet</p>
                        </div>
                    `;
                }
            }
        } else if (target.classList.contains('view-conversation')) {
            window.location.href = `messages.html?conversation=${target.dataset.conversationId}`;
        } else if (target.classList.contains('view-item')) {
            window.location.href = `item-details.html?id=${target.dataset.itemId}`;
        }
    });

    // Add event listeners for the new buttons
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.accept-request')) {
            const itemId = e.target.dataset.itemId;
            const requestId = e.target.dataset.requestId;
            const result = await itemsService.updateRequestStatus(itemId, requestId, 'accepted');
            if (result.success) {
                uiHandler.showNotification('Request accepted successfully', 'success');
                loadNotifications(); // Refresh notifications
            } else {
                uiHandler.showNotification(result.error, 'error');
            }
        } else if (e.target.matches('.reject-request')) {
            const itemId = e.target.dataset.itemId;
            const requestId = e.target.dataset.requestId;
            const result = await itemsService.updateRequestStatus(itemId, requestId, 'rejected');
            if (result.success) {
                uiHandler.showNotification('Request rejected', 'info');
                loadNotifications(); // Refresh notifications
            } else {
                uiHandler.showNotification(result.error, 'error');
            }
        }
    });
}); 