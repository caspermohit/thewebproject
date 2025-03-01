// Messages module for Share&Care Platform
import uiHandler from './ui.js';
import authService from '../auth.js';
import notificationsService from './notifications.js';

class MessagesService {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Initialize conversations in localStorage if not exists
        if (!localStorage.getItem('sharecare_conversations')) {
            localStorage.setItem('sharecare_conversations', JSON.stringify([]));
        }
    }

    async getConversations(userId) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            return conversations
                .filter(conversation => conversation.participants.some(p => p.id === userId))
                .sort((a, b) => {
                    const aLastMessage = a.messages[a.messages.length - 1];
                    const bLastMessage = b.messages[b.messages.length - 1];
                    return (bLastMessage?.timestamp || 0) - (aLastMessage?.timestamp || 0);
                });
        } catch (error) {
            console.error('Error getting conversations:', error);
            return [];
        }
    }

    async getConversation(conversationId) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            return conversations.find(c => c.id === conversationId) || null;
        } catch (error) {
            console.error('Error getting conversation:', error);
            return null;
        }
    }

    async startConversation(itemId, participants) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            
            // Check if conversation already exists
            const existingConversation = conversations.find(c => 
                c.itemId === itemId && 
                c.participants.every(p1 => participants.some(p2 => p1.id === p2.id)) &&
                participants.every(p1 => c.participants.some(p2 => p1.id === p2.id))
            );

            if (existingConversation) {
                return existingConversation;
            }

            // Create new conversation
            const newConversation = {
                id: Date.now().toString(),
                itemId,
                participants,
                messages: [],
                createdAt: new Date().toISOString()
            };

            conversations.push(newConversation);
            localStorage.setItem('sharecare_conversations', JSON.stringify(conversations));

            return newConversation;
        } catch (error) {
            console.error('Error starting conversation:', error);
            throw new Error('Failed to start conversation');
        }
    }

    async sendMessage(conversationId, content) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            const conversation = conversations.find(c => c.id === conversationId);
            
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            const message = {
                id: Date.now().toString(),
                conversationId,
                senderId: currentUser.id,
                content,
                timestamp: new Date().toISOString(),
                read: false
            };

            conversation.messages.push(message);
            localStorage.setItem('sharecare_conversations', JSON.stringify(conversations));

            return message;
        } catch (error) {
            console.error('Error sending message:', error);
            throw new Error('Failed to send message');
        }
    }

    async markConversationAsRead(conversationId) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            const conversation = conversations.find(c => c.id === conversationId);
            
            if (!conversation) {
                throw new Error('Conversation not found');
            }

            const currentUser = authService.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not authenticated');
            }

            let updated = false;
            conversation.messages.forEach(message => {
                if (message.senderId !== currentUser.id && !message.read) {
                    message.read = true;
                    updated = true;
                }
            });

            if (updated) {
                localStorage.setItem('sharecare_conversations', JSON.stringify(conversations));
            }

            return true;
        } catch (error) {
            console.error('Error marking conversation as read:', error);
            return false;
        }
    }

    async deleteConversation(conversationId) {
        try {
            const conversations = JSON.parse(localStorage.getItem('sharecare_conversations') || '[]');
            const updatedConversations = conversations.filter(c => c.id !== conversationId);
            localStorage.setItem('sharecare_conversations', JSON.stringify(updatedConversations));
            return true;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }
    }

    async getUnreadCount(userId) {
        try {
            const conversations = await this.getConversations(userId);
            return conversations.reduce((total, conversation) => {
                return total + conversation.messages.filter(m => 
                    m.senderId !== userId && !m.read
                ).length;
            }, 0);
        } catch (error) {
            console.error('Error getting unread count:', error);
            return 0;
        }
    }

    formatMessageContent(content) {
        if (!content) return '';
        return content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;')
            .replace(/\n/g, '<br>');
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Create and export a single instance
const messagesService = new MessagesService();
export default messagesService; 