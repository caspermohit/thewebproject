// Authentication Service for Share&Care Platform

class AuthService {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.TOKEN_KEY = 'sharecare_token';
        this.REFRESH_TOKEN_KEY = 'sharecare_refresh_token';
        
        // Check if user is already logged in
        this.checkAuthStatus();
        // Update UI on load
        this.updateAuthUI();
    }

    async login(username, password) {
        try {
            // First try to get users from localStorage
            let data = JSON.parse(localStorage.getItem('sharecare_users'));
            
            // If not in localStorage or data is empty, fetch from file
            if (!data || !data.users || data.users.length === 0) {
                const response = await fetch('../../../src/assets/data/users.json');
                if (!response.ok) {
                    return { success: false };
                }
                data = await response.json();
                localStorage.setItem('sharecare_users', JSON.stringify(data));
            }
            
            const user = data.users.find(
                u => (u.username.toLowerCase() === username.toLowerCase() || 
                     u.email.toLowerCase() === username.toLowerCase()) && 
                     u.password_hash === password
            );
            
            if (!user) {
                return { success: false };
            }
            
            this.setCurrentUser(user);
            this.generateAndSetTokens(user);
            this.updateAuthUI();
            return {
                success: true,
                user: this.sanitizeUser(user)
            };
        } catch (error) {
            return { success: false };
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        this.updateAuthUI();
        
        // Redirect to home page
        window.location.href = '/index.html';
    }

    checkAuthStatus() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        if (token) {
            try {
                // In a real application, verify the token with the backend
                const userData = this.parseToken(token);
                this.currentUser = userData;
                this.isAuthenticated = true;
                this.updateAuthUI();
                return true;
            } catch (error) {
                this.logout();
                return false;
            }
        }
        return false;
    }

    updateAuthUI() {
        const loginButton = document.querySelector('.auth-menu');
        if (!loginButton) return;

        if (this.currentUser) {
            // Update dropdown header
            const dropdownHeader = loginButton.querySelector('.dropdown-header span');
            if (dropdownHeader) {
                dropdownHeader.textContent = `Welcome, ${this.currentUser.first_name}!`;
            }

            // Show logged in menu, hide logged out menu
            const loggedInMenu = loginButton.querySelector('.logged-in-menu');
            const loggedOutMenu = loginButton.querySelector('.logged-out-menu');
            if (loggedInMenu) loggedInMenu.style.display = 'block';
            if (loggedOutMenu) loggedOutMenu.style.display = 'none';

            // Show/hide admin options
            const adminOptions = loginButton.querySelector('.admin-only');
            if (adminOptions) {
                adminOptions.style.display = this.currentUser.role === 'admin' ? 'block' : 'none';
            }

            // Add logout event listener
            const logoutLink = loginButton.querySelector('.logout-link');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }
        } else {
            // Show logged out menu, hide logged in menu
            const loggedInMenu = loginButton.querySelector('.logged-in-menu');
            const loggedOutMenu = loginButton.querySelector('.logged-out-menu');
            if (loggedInMenu) loggedInMenu.style.display = 'none';
            if (loggedOutMenu) loggedOutMenu.style.display = 'block';

            // Reset dropdown header
            const dropdownHeader = loginButton.querySelector('.dropdown-header span');
            if (dropdownHeader) {
                dropdownHeader.textContent = 'Welcome!';
            }
        }
    }

    getCurrentUser() {
        return this.currentUser ? this.sanitizeUser(this.currentUser) : null;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // Helper methods
    setCurrentUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
    }

    generateAndSetTokens(user) {
        // In a real application, these would be JWT tokens from the backend
        const token = btoa(JSON.stringify(user));
        const refreshToken = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
        
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    }

    parseToken(token) {
        try {
            return JSON.parse(atob(token));
        } catch (error) {
            throw new Error('Invalid token');
        }
    }

    sanitizeUser(user) {
        // Remove sensitive information before returning user data
        const { password_hash, ...sanitizedUser } = user;
        return sanitizedUser;
    }

    async refreshToken() {
        const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (!refreshToken) {
            this.logout();
            return false;
        }

        try {
            // In a real application, this would be an API call to refresh the token
            const userData = this.parseToken(refreshToken);
            if (Date.now() - userData.timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 days
                throw new Error('Refresh token expired');
            }
            
            // Simulate getting new tokens
            this.generateAndSetTokens(this.currentUser);
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.role) {
            return false;
        }

        // In a real application, we would check against the roles defined in users.json
        const adminPermissions = [
            'view_items', 'create_items', 'edit_all_items', 'delete_all_items',
            'message_users', 'update_profile', 'manage_users', 'view_analytics',
            'manage_settings'
        ];

        const userPermissions = [
            'view_items', 'create_items', 'edit_own_items', 'delete_own_items',
            'message_users', 'update_profile'
        ];

        if (this.currentUser.role === 'admin') {
            return adminPermissions.includes(permission);
        }

        return userPermissions.includes(permission);
    }
}

// Create and export a single instance of AuthService
const authService = new AuthService();
export default authService; 