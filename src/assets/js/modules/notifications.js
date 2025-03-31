
/**
 * Notifications Service for Share&Care Platform
 * @author Rupesh Gaur
 * Handles notification functionality, including notification management, and UI updates
 */

import authService from '../auth.js';
import uiHandler from './ui.js';

class NotificationsService {
    constructor() {
        this.notifications = [];
        this.loadNotifications();
    }

    async loadNotifications() {
        try {
            // First try to get notifications from localStorage
            let data = JSON.parse(localStorage.getItem('sharecare_notifications'));
            
            if (!data) {
                // Initialize with empty array if no notifications exist
                data = [];
                localStorage.setItem('sharecare_notifications', JSON.stringify(data));
            }
            
            this.notifications = data;
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.notifications = [];
        }
    }

    getNotifications(userId) {
        return this.notifications
            .filter(notification => notification.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async addNotification(notification) {
        try {
            const newNotification = {
                id: `notif_${Date.now()}`,
                createdAt: new Date().toISOString(),
                isRead: false,
                ...notification
            };

            this.notifications.unshift(newNotification);
            this.saveNotifications();

            return {
                success: true,
                notification: newNotification
            };
        } catch (error) {
            console.error('Error adding notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            const notification = this.notifications.find(n => n.id === notificationId && n.userId === userId);
            if (!notification) {
                throw new Error('Notification not found');
            }

            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            this.saveNotifications();

            return {
                success: true,
                notification
            };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            const index = this.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
            if (index === -1) {
                throw new Error('Notification not found');
            }

            this.notifications.splice(index, 1);
            this.saveNotifications();

            return {
                success: true,
                message: 'Notification deleted successfully'
            };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getUnreadCount(userId) {
        return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
    }

    saveNotifications() {
        localStorage.setItem('sharecare_notifications', JSON.stringify(this.notifications));
    }
}

const notificationsService = new NotificationsService();
export default notificationsService; 