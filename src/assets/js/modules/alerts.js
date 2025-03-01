// Alerts Service for Share&Care Platform
import authService from '../auth.js';
import notificationsService from './notifications.js';

class AlertsService {
    constructor() {
        this.alerts = [];
        this.loadAlerts();
    }

    async loadAlerts() {
        try {
            let data = JSON.parse(localStorage.getItem('sharecare_alerts'));
            
            if (!data) {
                data = [];
                localStorage.setItem('sharecare_alerts', JSON.stringify(data));
            }
            
            this.alerts = data;
        } catch (error) {
            console.error('Error loading alerts:', error);
            this.alerts = [];
        }
    }

    getUserAlerts(userId) {
        return this.alerts.filter(alert => alert.userId === userId);
    }

    async addAlert(alertData) {
        try {
            const newAlert = {
                id: `alert_${Date.now()}`,
                createdAt: new Date().toISOString(),
                isActive: true,
                matchCount: 0,
                lastChecked: new Date().toISOString(),
                ...alertData
            };

            this.alerts.push(newAlert);
            this.saveAlerts();

            return {
                success: true,
                alert: newAlert
            };
        } catch (error) {
            console.error('Error adding alert:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async removeAlert(alertId, userId) {
        try {
            const index = this.alerts.findIndex(a => a.id === alertId && a.userId === userId);
            if (index === -1) {
                throw new Error('Alert not found');
            }

            this.alerts.splice(index, 1);
            this.saveAlerts();

            return {
                success: true,
                message: 'Alert removed successfully'
            };
        } catch (error) {
            console.error('Error removing alert:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async checkNewItems(item) {
        const activeAlerts = this.alerts.filter(alert => alert.isActive);
        
        for (const alert of activeAlerts) {
            // Check if item matches alert criteria
            if (this.itemMatchesAlert(item, alert)) {
                alert.matchCount++;
                
                // Create notification for the user
                await notificationsService.addNotification({
                    userId: alert.userId,
                    type: 'alert_match',
                    title: 'Item Alert Match',
                    message: `New item matching your alert "${alert.searchTerm}": ${item.title}`,
                    itemId: item.id
                });
            }
        }
        
        this.saveAlerts();
    }

    itemMatchesAlert(item, alert) {
        const searchTerms = alert.searchTerm.toLowerCase().split(' ');
        const itemTitle = item.title.toLowerCase();
        const itemDescription = item.description.toLowerCase();
        const itemCategory = item.category.toLowerCase();

        // Check if any search term matches the item
        return searchTerms.some(term => 
            itemTitle.includes(term) || 
            itemDescription.includes(term) || 
            itemCategory.includes(term)
        );
    }

    saveAlerts() {
        localStorage.setItem('sharecare_alerts', JSON.stringify(this.alerts));
    }
}

const alertsService = new AlertsService();
export default alertsService; 