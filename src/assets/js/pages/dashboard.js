/**
 * Dashboard functionality
 * @author mohit shah
 * Handles dashboard functionality, including item management, user management, and conversation management
 */

import itemsService from '../modules/items.js';
import messagesService from '../modules/messages.js';
import authService from '../auth.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is admin
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = '/src/pages/auth/login.html';
        return;
    }

    // Initialize stats and load data
    await updateStats();
    await loadItems();
    await loadUsers();
    await loadConversations();

    // Add event listeners
    setupEventListeners();
});

// Update dashboard stats
async function updateStats() {
    try {
        // Get data from localStorage
        const items = JSON.parse(localStorage.getItem('sharecare_items'))?.items || [];
        const users = JSON.parse(localStorage.getItem('sharecare_users'))?.users || [];
        const conversations = JSON.parse(localStorage.getItem('sharecare_messages'))?.conversations || [];

        document.getElementById('totalItems').textContent = items.length;
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalConversations').textContent = conversations.length;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Load items from localStorage
async function loadItems() {
    const itemsTableBody = document.getElementById('itemsTableBody');
    if (!itemsTableBody) return;

    try {
        const items = JSON.parse(localStorage.getItem('sharecare_items'))?.items || [];
        
        if (items.length === 0) {
            itemsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No items found</td></tr>';
            return;
        }

        itemsTableBody.innerHTML = items.map(item => `
            <tr>
                <td>${item.id}</td>
                <td>${item.title}</td>
                <td>${item.category}</td>
                <td><span class="status-badge status-${getStatusBadgeClass(item.status)}">${item.status}</span></td>
                <td>${item.donor?.name || 'Unknown'}</td>
                <td>${formatDate(item.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewItem('${item.id}')" class="button tiny">
                            <i class="bx bx-show"></i>
                        </button>
                        <button onclick="editItem('${item.id}')" class="button tiny">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button onclick="deleteItem('${item.id}')" class="button tiny alert">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading items:', error);
        itemsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading items</td></tr>';
    }
}

// Load users from localStorage
async function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;

    try {
        const users = JSON.parse(localStorage.getItem('sharecare_users'))?.users || [];
        
        if (users.length === 0) {
            usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
            return;
        }

        usersTableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.first_name} ${user.last_name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${formatDate(user.created_at || new Date())}</td>
                <td><span class="status-badge status-${getStatusBadgeClass(user.status)}">${user.status || 'Active'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewUser('${user.id}')" class="button tiny">
                            <i class="bx bx-show"></i>
                        </button>
                        <button onclick="editUser('${user.id}')" class="button tiny">
                            <i class="bx bx-edit"></i>
                        </button>
                        <button onclick="deleteUser('${user.id}')" class="button tiny alert">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading users</td></tr>';
    }
}

// Load conversations from localStorage
async function loadConversations() {
    const conversationsTableBody = document.getElementById('conversationsTableBody');
    if (!conversationsTableBody) return;

    try {
        const conversations = JSON.parse(localStorage.getItem('sharecare_messages'))?.conversations || [];
        
        if (conversations.length === 0) {
            conversationsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No conversations found</td></tr>';
            return;
        }

        conversationsTableBody.innerHTML = conversations.map(conv => `
            <tr>
                <td>${conv.id}</td>
                <td>${conv.itemTitle || 'N/A'}</td>
                <td>${formatParticipants(conv.participants)}</td>
                <td>${formatLastMessage(conv)}</td>
                <td>${formatDate(conv.created_at)}</td>
                <td><span class="status-badge status-${getStatusBadgeClass(getConversationStatus(conv))}">${getConversationStatus(conv)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button onclick="viewConversation('${conv.id}')" class="button tiny">
                            <i class="bx bx-show"></i>
                        </button>
                        <button onclick="deleteConversation('${conv.id}')" class="button tiny alert">
                            <i class="bx bx-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error loading conversations:', error);
        conversationsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Error loading conversations</td></tr>';
    }
}

// Helper functions
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Invalid date';
    }
}

function formatParticipants(participants = []) {
    if (!Array.isArray(participants)) return 'No participants';
    return participants.join(', ');
}

function formatLastMessage(conversation) {
    if (!conversation.messages || conversation.messages.length === 0) {
        return 'No messages';
    }
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.content.substring(0, 30) + (lastMessage.content.length > 30 ? '...' : '');
}

function getConversationStatus(conversation) {
    if (!conversation.messages || conversation.messages.length === 0) return 'new';
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    return lastMessage.read ? 'read' : 'unread';
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'active':
            return 'status-active';
        case 'inactive':
            return 'status-inactive';
        case 'pending':
            return 'status-pending';
        default:
            return '';
    }
}

// Event listeners setup
function setupEventListeners() {
    // Add Item button
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        window.location.href = '/src/pages/main/donate.html';
    });

    // Add User button
    document.getElementById('addUserBtn')?.addEventListener('click', () => {
        showAddUserModal();
    });

    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        authService.logout();
    });
}

// Add User Modal
function showAddUserModal() {
    const modalHtml = `
        <div class="add-user-modal">
            <h3>Add New User</h3>
            <form id="addUserForm">
                <div class="grid-x grid-margin-x">
                    <div class="cell medium-6">
                        <label for="firstName">First Name
                            <input type="text" id="firstName" name="firstName" required>
                        </label>
                    </div>
                    <div class="cell medium-6">
                        <label for="lastName">Last Name
                            <input type="text" id="lastName" name="lastName" required>
                        </label>
                    </div>
                </div>
                
                <label for="email">Email
                    <input type="email" id="email" name="email" required>
                </label>
                
                <label for="username">Username
                    <input type="text" id="username" name="username" required>
                </label>
                
                <label for="password">Password
                    <input type="password" id="password" name="password" required>
                </label>
                
                <label for="role">Role
                    <select id="role" name="role" required>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>
                
                <button type="submit" class="button expanded">Add User</button>
            </form>
        </div>
    `;

    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'reveal';
    modal.id = 'addUserModal';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);

    // Initialize Foundation modal
    const $modal = new Foundation.Reveal($('#addUserModal'), {
        closeOnClick: true,
        closeOnEsc: true
    });
    $modal.open();

    // Handle form submission
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            id: 'usr_' + Date.now(),
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            email: formData.get('email'),
            username: formData.get('username'),
            password_hash: formData.get('password'), // In a real app, this should be hashed
            role: formData.get('role'),
            created_at: new Date().toISOString(),
            status: 'active'
        };

        try {
            // Get existing users
            const existingData = JSON.parse(localStorage.getItem('sharecare_users')) || { users: [] };
            
            // Check if username or email already exists
            const userExists = existingData.users.some(user => 
                user.username === userData.username || 
                user.email === userData.email
            );

            if (userExists) {
                alert('Username or email already exists');
                return;
            }

            // Add new user
            existingData.users.push(userData);
            localStorage.setItem('sharecare_users', JSON.stringify(existingData));

            // Close modal and refresh data
            $modal.close();
            await loadUsers();
            await updateStats();
            
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Error adding user. Please try again.');
        }
    });
}

// Make functions available globally for button onclick handlers
window.viewItem = (id) => {
    window.location.href = `/src/pages/main/item-details.html?id=${id}`;
};

window.editItem = (id) => {
    window.location.href = `/src/pages/main/edit-item.html?id=${id}`;
};

window.deleteItem = async (id) => {
    if (confirm('Are you sure you want to delete this item?')) {
        // Get items from localStorage
        const items = JSON.parse(localStorage.getItem('sharecare_items'))?.items || [];
        const updatedItems = items.filter(item => item.id !== id);
        localStorage.setItem('sharecare_items', JSON.stringify({ items: updatedItems }));
        
        // Also delete any conversations related to this item
        const conversations = JSON.parse(localStorage.getItem('sharecare_messages'))?.conversations || [];
        const updatedConversations = conversations.filter(conv => conv.itemId !== id);
        localStorage.setItem('sharecare_messages', JSON.stringify({ conversations: updatedConversations }));
        
        await loadItems();
        await loadConversations();
        await updateStats();
    }
};

window.viewUser = (id) => {
    const users = JSON.parse(localStorage.getItem('sharecare_users'))?.users || [];
    const user = users.find(u => u.id === id);
    
    if (!user) {
        alert('User not found');
        return;
    }

    const modalHtml = `
        <div class="user-details-modal">
            <h3>User Details</h3>
            <div class="grid-x grid-margin-x">
                <div class="cell medium-6">
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Name:</strong> ${user.first_name} ${user.last_name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                </div>
                <div class="cell medium-6">
                    <p><strong>Username:</strong> ${user.username}</p>
                    <p><strong>Role:</strong> ${user.role}</p>
                    <p><strong>Status:</strong> ${user.status || 'Active'}</p>
                    <p><strong>Created:</strong> ${formatDate(user.created_at)}</p>
                </div>
            </div>
            <button type="button" class="button" onclick="editUser('${user.id}')">Edit User</button>
        </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'reveal';
    modal.id = 'userDetailsModal';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);

    const $modal = new Foundation.Reveal($('#userDetailsModal'), {
        closeOnClick: true,
        closeOnEsc: true
    });
    $modal.open();
};

window.editUser = (id) => {
    const users = JSON.parse(localStorage.getItem('sharecare_users'))?.users || [];
    const user = users.find(u => u.id === id);
    
    if (!user) {
        alert('User not found');
        return;
    }

    const modalHtml = `
        <div class="edit-user-modal">
            <h3>Edit User</h3>
            <form id="editUserForm">
                <div class="grid-x grid-margin-x">
                    <div class="cell medium-6">
                        <label for="firstName">First Name
                            <input type="text" id="firstName" name="firstName" value="${user.first_name}" required>
                        </label>
                    </div>
                    <div class="cell medium-6">
                        <label for="lastName">Last Name
                            <input type="text" id="lastName" name="lastName" value="${user.last_name}" required>
                        </label>
                    </div>
                </div>
                
                <label for="email">Email
                    <input type="email" id="email" name="email" value="${user.email}" required>
                </label>
                
                <label for="username">Username
                    <input type="text" id="username" name="username" value="${user.username}" required>
                </label>
                
                <label for="role">Role
                    <select id="role" name="role" required>
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </label>

                <label for="status">Status
                    <select id="status" name="status" required>
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="suspended" ${user.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                    </select>
                </label>
                
                <label for="newPassword">New Password (leave blank to keep current)
                    <input type="password" id="newPassword" name="newPassword">
                </label>
                
                <button type="submit" class="button expanded">Save Changes</button>
            </form>
        </div>
    `;

    const modal = document.createElement('div');
    modal.className = 'reveal';
    modal.id = 'editUserModal';
    modal.innerHTML = modalHtml;
    document.body.appendChild(modal);

    const $modal = new Foundation.Reveal($('#editUserModal'), {
        closeOnClick: true,
        closeOnEsc: true
    });
    $modal.open();

    // Handle form submission
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedUserData = {
            ...user,
            first_name: formData.get('firstName'),
            last_name: formData.get('lastName'),
            email: formData.get('email'),
            username: formData.get('username'),
            role: formData.get('role'),
            status: formData.get('status')
        };

        // Only update password if a new one is provided
        if (formData.get('newPassword')) {
            updatedUserData.password_hash = formData.get('newPassword');
        }

        try {
            const existingData = JSON.parse(localStorage.getItem('sharecare_users')) || { users: [] };
            
            // Check if username or email already exists (excluding current user)
            const userExists = existingData.users.some(u => 
                u.id !== id && (
                    u.username === updatedUserData.username || 
                    u.email === updatedUserData.email
                )
            );

            if (userExists) {
                alert('Username or email already exists');
                return;
            }

            // Don't allow changing the last admin's role
            if (user.role === 'admin' && updatedUserData.role !== 'admin') {
                const adminCount = existingData.users.filter(u => u.role === 'admin').length;
                if (adminCount <= 1) {
                    alert('Cannot change role of the last admin');
                    return;
                }
            }

            // Update user
            const userIndex = existingData.users.findIndex(u => u.id === id);
            if (userIndex !== -1) {
                existingData.users[userIndex] = updatedUserData;
                localStorage.setItem('sharecare_users', JSON.stringify(existingData));
                
                // Close modal and refresh data
                $modal.close();
                await loadUsers();
            }
        } catch (error) {
            console.error('Error updating user:', error);
            alert('Error updating user. Please try again.');
        }
    });
};

window.deleteUser = (id) => {
    if (confirm('Are you sure you want to delete this user?')) {
        // Get users from localStorage
        const existingData = JSON.parse(localStorage.getItem('sharecare_users')) || { users: [] };
        const userToDelete = existingData.users.find(user => user.id === id);
        
        // Don't allow deleting the last admin
        if (userToDelete?.role === 'admin') {
            const adminCount = existingData.users.filter(user => user.role === 'admin').length;
            if (adminCount <= 1) {
                alert('Cannot delete the last admin user');
                return;
            }
        }

        // Update users
        existingData.users = existingData.users.filter(user => user.id !== id);
        localStorage.setItem('sharecare_users', JSON.stringify(existingData));

        // Also update items and conversations
        const items = JSON.parse(localStorage.getItem('sharecare_items'))?.items || [];
        const updatedItems = items.filter(item => item.donor?.id !== id);
        localStorage.setItem('sharecare_items', JSON.stringify({ items: updatedItems }));

        const conversations = JSON.parse(localStorage.getItem('sharecare_messages'))?.conversations || [];
        const updatedConversations = conversations.filter(conv => !conv.participants.includes(id));
        localStorage.setItem('sharecare_messages', JSON.stringify({ conversations: updatedConversations }));

        loadUsers();
        loadItems();
        loadConversations();
        updateStats();
    }
};

window.viewConversation = (id) => {
    window.location.href = `/src/pages/main/messages.html?conversation=${id}`;
};

window.deleteConversation = async (id) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
        const conversations = JSON.parse(localStorage.getItem('sharecare_messages'))?.conversations || [];
        const updatedConversations = conversations.filter(conv => conv.id !== id);
        localStorage.setItem('sharecare_messages', JSON.stringify({ conversations: updatedConversations }));
        await loadConversations();
        await updateStats();
    }
}; 