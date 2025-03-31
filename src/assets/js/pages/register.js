/**
 * Registration page functionality
 * @author Mohit Shah
 * Handles registration page functionality, including authentication, form validation, and UI updates
 */

import authService from '../auth.js';
import formHandler from '../modules/forms.js';
import uiHandler from '../modules/ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize form validation
    formHandler.initializeFormValidation('registerForm', {
        onSubmit: async (formData) => {
            const loader = uiHandler.showLoading();
            
            try {
                // Validate password match
                if (formData.password !== formData.confirmPassword) {
                    uiHandler.showNotification('Passwords do not match', 'error');
                    return;
                }

                // Create new user object
                const newUser = {
                    id: `usr_${Date.now()}`,
                    username: formData.email.split('@')[0], // Generate username from email
                    email: formData.email,
                    password_hash: formData.password, // In real app, use proper hashing
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    profile: {
                        avatar: "/src/assets/images/avatars/default.png",
                        location: "",
                        bio: "",
                        joined_date: new Date().toISOString()
                    },
                    donation_stats: {
                        items_donated: 0,
                        items_received: 0,
                        rating: 0
                    },
                    preferences: {
                        notifications: {
                            email: true,
                            push: true,
                            sms: false
                        },
                        privacy: {
                            show_email: false,
                            show_location: true,
                            show_donation_history: true
                        }
                    },
                    role: "user",
                    status: "active",
                    last_login: new Date().toISOString()
                };

                // Read existing users
                const response = await fetch('/src/assets/data/users.json');
                const data = await response.json();
                
                // Check if email already exists
                const existingUser = data.users.find(u => u.email === formData.email);
                
                if (existingUser) {
                    throw new Error('Email already registered');
                }

                // Add new user to the data
                data.users.push(newUser);

                // Store updated users in localStorage
                localStorage.setItem('sharecare_users', JSON.stringify(data));

                // Store the registration timestamp
                localStorage.setItem('last_registration', Date.now().toString());

                uiHandler.showNotification('Registration successful! Redirecting to login...', 'success');
                
                // Redirect to login page after delay
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (error) {
                uiHandler.showNotification(error.message || 'Registration failed', 'error');
            } finally {
                uiHandler.hideLoading(loader);
            }
        }
    });

    // Handle password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.querySelector('.password-strength-indicator');
    
    if (passwordInput && strengthIndicator) {
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            let strength = 0;
            
            // Length check
            if (password.length >= 8) strength++;
            // Uppercase check
            if (/[A-Z]/.test(password)) strength++;
            // Lowercase check
            if (/[a-z]/.test(password)) strength++;
            // Number check
            if (/[0-9]/.test(password)) strength++;
            // Special character check
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'][strength - 1] || '';
            const strengthClass = ['very-weak', 'weak', 'medium', 'strong', 'very-strong'][strength - 1] || '';
            
            strengthIndicator.innerHTML = password ? `
                <div class="strength-bar ${strengthClass}">
                    <div style="width: ${strength * 20}%"></div>
                </div>
                <span class="strength-text">${strengthText}</span>
            ` : '';
        });
    }

    // Handle show/hide password
    const passwordToggles = document.querySelectorAll('.show-password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const button = e.currentTarget;
            const input = button.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            button.innerHTML = type === 'password' 
                ? '<i class="bx bx-show"></i>' 
                : '<i class="bx bx-hide"></i>';
        });
    });

    // Handle confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput && passwordInput) {
        confirmPasswordInput.addEventListener('input', () => {
            const isMatch = confirmPasswordInput.value === passwordInput.value;
            formHandler.showFieldValidation(
                confirmPasswordInput,
                isMatch,
                isMatch ? '' : 'Passwords do not match'
            );
        });
    }

    // Handle social registration buttons
    const socialButtons = document.querySelectorAll('.social-login-button');
    socialButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = button.getAttribute('data-provider');
            
            // In a real application, this would initiate OAuth flow
            uiHandler.showNotification(`${provider} registration coming soon!`, 'info');
        });
    });

    // Real-time username availability check
    const usernameInput = document.getElementById('username');
    let usernameCheckTimeout;
    
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            clearTimeout(usernameCheckTimeout);
            const username = usernameInput.value.trim();
            
            if (username.length < 3) return;
            
            usernameCheckTimeout = setTimeout(async () => {
                try {
                    const response = await fetch('/src/assets/data/users.json');
                    const data = await response.json();
                    
                    const exists = data.users.some(u => u.username === username);
                    if (exists) {
                        formHandler.showFieldValidation(usernameInput, false, 'Username already taken');
                    } else {
                        formHandler.showFieldValidation(usernameInput, true, '');
                    }
                } catch (error) {
                    console.error('Error checking username:', error);
                }
            }, 500);
        });
    }
}); 