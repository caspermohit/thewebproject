
/**
 * Login page functionality
 * @author Mohit Shah
 * Handles login page functionality, including authentication, form validation, and UI updates
 */

import authService from '../auth.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    // Basic form validation
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!usernameInput.value.trim()) {
            usernameInput.focus();
            return;
        }
        
        if (!passwordInput.value) {
            passwordInput.focus();
            return;
        }

        const loader = uiHandler.showLoading();
        
        try {
            const result = await authService.login(
                usernameInput.value.trim(),
                passwordInput.value
            );
            
            if (result.success) {
                // Check if user is suspended
                if (result.user.status === 'suspended') {
                    uiHandler.showNotification('Your account has been suspended. Please contact support(437-999-9999) for assistance.', 'error');
                    return;
                }

                // Check if user is inactive
                if (result.user.status === 'inactive') {
                    uiHandler.showNotification('Your account is inactive. Please contact support(437-999-9999) to reactivate your account.', 'warning');
                    return;
                }

                // Check if user is admin
                if (result.user.role === 'admin') {
                    // Add dashboard link to navigation
                    const navMenuLeft = document.querySelector('.nav-menu-left');
                    if (navMenuLeft) {
                        const dashboardLink = document.createElement('li');
                        dashboardLink.innerHTML = `<a href="/src/pages/dashboard/index.html">
                            <i class="bx bx-grid-alt nav-icon"></i> Dashboard</a>`;
                        navMenuLeft.appendChild(dashboardLink);
                    }
                    // Redirect to dashboard
                    window.location.href = '/src/pages/dashboard/index.html';
                } else {
                    window.location.href = '/index.html';
                }
            }
        } finally {
            uiHandler.hideLoading(loader);
        }
    });

    // Handle "Remember Me" checkbox
    const rememberMeCheckbox = document.getElementById('rememberMe');
    if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = localStorage.getItem('rememberMe') === 'true';
        rememberMeCheckbox.addEventListener('change', (e) => {
            localStorage.setItem('rememberMe', e.target.checked);
        });
    }

    // Simple password visibility toggle
    document.querySelector('.show-password-toggle')?.addEventListener('click', () => {
        if (passwordInput) {
            passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
            document.querySelector('.show-password-toggle i').className = 
                passwordInput.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
    });

    // Add input event listeners to remove invalid state
    usernameInput?.addEventListener('input', () => {
        usernameInput.classList.remove('is-invalid-input');
    });

    passwordInput?.addEventListener('input', () => {
        passwordInput.classList.remove('is-invalid-input');
    });
}); 