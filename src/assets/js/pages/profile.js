// Profile page functionality
import authService from '../auth.js';
import itemsService from '../modules/items.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
        uiHandler.showNotification('Please log in to view your profile', 'warning');
        setTimeout(() => {
            window.location.href = '../auth/login.html';
        }, 2000);
        return;
    }

    // Load user profile data
    loadUserProfile(currentUser);
    loadDonationStats(currentUser);
    loadDonationHistory(currentUser);
    loadUserSettings(currentUser);

    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(profileForm);
            
            // Update user data
            currentUser.first_name = formData.get('first_name');
            currentUser.last_name = formData.get('last_name');
            currentUser.email = formData.get('email');
            currentUser.profile = {
                ...currentUser.profile,
                location: formData.get('location'),
                bio: formData.get('bio')
            };

            // Save updated user data
            authService.setCurrentUser(currentUser);
            uiHandler.showNotification('Profile updated successfully', 'success');
        });
    }

    // Handle avatar change
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            const imageData = e.target.result;
                            
                            // Update user avatar
                            currentUser.profile.avatar = imageData;
                            authService.setCurrentUser(currentUser);
                            
                            // Update UI
                            document.getElementById('profileAvatar').src = imageData;
                            uiHandler.showNotification('Profile picture updated successfully', 'success');
                        };
                        reader.readAsDataURL(file);
                    } catch (error) {
                        uiHandler.showNotification('Error updating profile picture', 'error');
                    }
                }
            };
            
            input.click();
        });
    }

    // Handle notification preferences
    const notificationToggles = ['emailNotif', 'pushNotif', 'smsNotif'];
    notificationToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const type = id.replace('Notif', '');
                currentUser.preferences.notifications[type] = e.target.checked;
                authService.setCurrentUser(currentUser);
                uiHandler.showNotification('Notification preferences updated', 'success');
            });
        }
    });

    // Handle privacy settings
    const privacyToggles = ['showEmail', 'showLocation', 'showHistory'];
    privacyToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const setting = id.replace('show', '').toLowerCase();
                currentUser.preferences.privacy[`show_${setting}`] = e.target.checked;
                authService.setCurrentUser(currentUser);
                uiHandler.showNotification('Privacy settings updated', 'success');
            });
        }
    });

    // Handle change password
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const modalContent = `
                <div class="change-password-modal">
                    <h3>Change Password</h3>
                    <form id="changePasswordForm">
                        <label for="currentPassword">Current Password
                            <input type="password" id="currentPassword" name="currentPassword" required>
                        </label>
                        <label for="newPassword">New Password
                            <input type="password" id="newPassword" name="newPassword" required>
                        </label>
                        <label for="confirmPassword">Confirm New Password
                            <input type="password" id="confirmPassword" name="confirmPassword" required>
                        </label>
                        <button type="submit" class="button expanded">Change Password</button>
                    </form>
                </div>
            `;

            const modal = await uiHandler.showModal(modalContent, {
                closeButton: true,
                width: '400px'
            });

            const form = document.getElementById('changePasswordForm');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                
                if (formData.get('newPassword') !== formData.get('confirmPassword')) {
                    uiHandler.showNotification('New passwords do not match', 'error');
                    return;
                }

                // In a real app, this would make an API call to change the password
                uiHandler.showNotification('Password changed successfully', 'success');
                modal.close();
            });
        });
    }

    // Handle delete account
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            const confirmDelete = await uiHandler.showModal(`
                <div class="text-center">
                    <h3>Delete Account</h3>
                    <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                    <div class="button-group">
                        <button class="button alert" id="confirmDeleteAccount">Yes, Delete My Account</button>
                        <button class="button secondary" id="cancelDeleteAccount">Cancel</button>
                    </div>
                </div>
            `, {
                closeButton: true,
                width: '400px'
            });

            document.getElementById('confirmDeleteAccount').addEventListener('click', () => {
                // In a real app, this would make an API call to delete the account
                authService.logout();
                window.location.href = '../../../index.html';
            });

            document.getElementById('cancelDeleteAccount').addEventListener('click', () => {
                confirmDelete.close();
            });
        });
    }
});

// Helper Functions
function loadUserProfile(user) {
    // Set avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) {
        profileAvatar.src = user.profile.avatar || '/src/assets/images/avatars/default.png';
    }

    // Set form values
    document.getElementById('firstName').value = user.first_name;
    document.getElementById('lastName').value = user.last_name;
    document.getElementById('email').value = user.email;
    document.getElementById('location').value = user.profile.location || '';
    document.getElementById('bio').value = user.profile.bio || '';
}

function loadDonationStats(user) {
    document.getElementById('itemsDonated').textContent = user.donation_stats.items_donated;
    document.getElementById('itemsReceived').textContent = user.donation_stats.items_received;
    document.getElementById('rating').textContent = `${user.donation_stats.rating}⭐`;
}

function loadDonationHistory(user) {
    // Load donated items
    const donatedItems = itemsService.getUserItems(user.id, 'donated');
    const donatedItemsList = document.getElementById('donatedItemsList');
    if (donatedItemsList) {
        donatedItemsList.innerHTML = donatedItems.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>${formatDate(item.created_at)}</td>
                <td>${item.status.charAt(0).toUpperCase() + item.status.slice(1)}</td>
                <td>
                    <a href="item-details.html?id=${item.id}" class="button tiny">View</a>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">No items donated yet</td></tr>';
    }

    // Load received items
    const receivedItems = itemsService.getUserItems(user.id, 'received');
    const receivedItemsList = document.getElementById('receivedItemsList');
    if (receivedItemsList) {
        receivedItemsList.innerHTML = receivedItems.map(item => `
            <tr>
                <td>${item.title}</td>
                <td>${formatDate(item.created_at)}</td>
                <td>${item.donor.name}</td>
                <td>
                    <a href="item-details.html?id=${item.id}" class="button tiny">View</a>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="4" class="text-center">No items received yet</td></tr>';
    }
}

function loadUserSettings(user) {
    // Load notification preferences
    document.getElementById('emailNotif').checked = user.preferences.notifications.email;
    document.getElementById('pushNotif').checked = user.preferences.notifications.push;
    document.getElementById('smsNotif').checked = user.preferences.notifications.sms;

    // Load privacy settings
    document.getElementById('showEmail').checked = user.preferences.privacy.show_email;
    document.getElementById('showLocation').checked = user.preferences.privacy.show_location;
    document.getElementById('showHistory').checked = user.preferences.privacy.show_donation_history;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
} 