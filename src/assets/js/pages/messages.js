/**
 * Messages page functionality
 * @author Zia Sheikh
 * Handles messages page functionality, including message functionality, and UI updates
 */

import messagesService from '../modules/messages.js';
import authService from '../auth.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check if user is logged in
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        uiHandler.showNotification('Please log in to access messages', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }

    // DOM Elements
    const chatList = document.getElementById('chatList');
    const chatMessages = document.getElementById('chatMessages');
    const chatRecipient = document.getElementById('chatRecipient');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const viewItemBtn = document.getElementById('viewItemBtn');

    // Templates
    const chatItemTemplate = document.getElementById('chatItemTemplate');
    const messageTemplate = document.getElementById('messageTemplate');

    // State
    let activeConversation = null;
    let conversations = [];

    // Load conversations
    async function loadConversations() {
        try {
            conversations = await messagesService.getConversations(currentUser.id);
            chatList.innerHTML = '';

            if (conversations.length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'text-center padding-2';
                emptyState.textContent = 'No conversations yet';
                chatList.appendChild(emptyState);
                return;
            }

            conversations.forEach(conversation => {
                const chatItem = chatItemTemplate.content.cloneNode(true).querySelector('.chat-item');
                const recipientName = conversation.participants.find(p => p.id !== currentUser.id)?.name || 'Unknown User';
                
                chatItem.dataset.conversationId = conversation.id;
                chatItem.querySelector('.recipient-name').textContent = recipientName;
                
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                if (lastMessage) {
                    chatItem.querySelector('.chat-item-preview').textContent = lastMessage.content;
                }

                const unreadCount = conversation.messages.filter(m => 
                    !m.read && m.senderId !== currentUser.id
                ).length;

                const unreadBadge = chatItem.querySelector('.unread-count');
                if (unreadCount > 0) {
                    unreadBadge.textContent = unreadCount;
                    unreadBadge.style.display = 'inline-block';
                }

                chatItem.addEventListener('click', () => loadMessages(conversation));
                chatList.appendChild(chatItem);
            });
        } catch (error) {
            console.error('Error loading conversations:', error);
            uiHandler.showNotification('Failed to load conversations', 'error');
        }
    }

    // Load messages for a conversation
    async function loadMessages(conversation) {
        try {
            activeConversation = conversation;
            const recipient = conversation.participants.find(p => p.id !== currentUser.id);
            
            // Update UI
            chatRecipient.textContent = recipient.name;
            chatMessages.innerHTML = '';
            messageForm.style.display = 'flex';
            
            // Show view item button if this is an item-related conversation
            if (conversation.itemId) {
                viewItemBtn.style.display = 'inline-flex';
                viewItemBtn.onclick = () => window.location.href = `item-details.html?id=${conversation.itemId}`;
            } else {
                viewItemBtn.style.display = 'none';
            }

            // Update chat list UI
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.conversationId === conversation.id) {
                    item.classList.add('active');
                    item.querySelector('.unread-count').style.display = 'none';
                }
            });

            // Display messages
            conversation.messages.forEach(message => {
                const messageElement = messageTemplate.content.cloneNode(true).querySelector('.message');
                const isSent = message.senderId === currentUser.id;
                
                messageElement.classList.add(isSent ? 'sent' : 'received');
                messageElement.querySelector('.message-content').textContent = message.content;
                messageElement.querySelector('.message-time').textContent = new Date(message.timestamp).toLocaleTimeString();
                
                if (isSent) {
                    const statusIcon = messageElement.querySelector('.message-status i');
                    statusIcon.className = message.read ? 'fas fa-check-double' : 'fas fa-check';
                } else {
                    messageElement.querySelector('.message-status').remove();
                }
                
                chatMessages.appendChild(messageElement);
            });

            // Mark messages as read
            if (conversation.messages.some(m => !m.read && m.senderId !== currentUser.id)) {
                await messagesService.markConversationAsRead(conversation.id);
            }

            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Error loading messages:', error);
            uiHandler.showNotification('Failed to load messages', 'error');
        }
    }

    // Handle message submission
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!activeConversation) {
            uiHandler.showNotification('Please select a conversation first', 'warning');
            return;
        }

        const content = messageInput.value.trim();
        if (!content) return;

        try {
            const message = await messagesService.sendMessage(activeConversation.id, content);
            
            // Add message to UI
            const messageElement = messageTemplate.content.cloneNode(true).querySelector('.message');
            messageElement.classList.add('sent');
            messageElement.querySelector('.message-content').textContent = content;
            messageElement.querySelector('.message-time').textContent = new Date().toLocaleTimeString();
            messageElement.querySelector('.message-status i').className = 'fas fa-check';
            
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Update conversation preview
            const chatItem = document.querySelector(`.chat-item[data-conversation-id="${activeConversation.id}"]`);
            if (chatItem) {
                chatItem.querySelector('.chat-item-preview').textContent = content;
            }

            // Clear input
            messageInput.value = '';
            
            // Update active conversation
            activeConversation.messages.push(message);
        } catch (error) {
            console.error('Error sending message:', error);
            uiHandler.showNotification('Failed to send message', 'error');
        }
    });

    // Check for conversation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    
    // Initial load
    await loadConversations();
    
    // If conversation ID is in URL, load that conversation
    if (conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            loadMessages(conversation);
        }
        // Remove conversation parameter from URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Refresh conversations periodically
    setInterval(loadConversations, 30000);
}); 