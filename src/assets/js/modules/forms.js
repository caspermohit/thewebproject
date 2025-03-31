
/**
 * Form handling and validation module
 * @author Mohit Shah
 * Handles form handling and validation, including password requirements, form submission, and field validation
 */

import authService from '../auth.js';

class FormHandler {
    constructor() {
        this.passwordRequirements = {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecial: true
        };
    }

    // Initialize form validation
    initializeFormValidation(formId, options = {}) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.validateForm(form)) {
                const formData = this.getFormData(form);
                if (options.onSubmit) {
                    await options.onSubmit(formData);
                }
            }
        });

        // Real-time validation
        form.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });
        });
    }

    // Validate entire form
    validateForm(form) {
        let isValid = true;
        form.querySelectorAll('input').forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        return isValid;
    }

    // Validate individual field
    validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (input.type) {
            case 'email':
                isValid = this.validateEmail(value);
                errorMessage = 'Please enter a valid email address';
                break;
            case 'password':
                isValid = this.validatePassword(value);
                errorMessage = this.getPasswordErrorMessage(value);
                break;
            case 'tel':
                isValid = this.validatePhone(value);
                errorMessage = 'Please enter a valid phone number';
                break;
            default:
                if (input.required && !value) {
                    isValid = false;
                    errorMessage = 'This field is required';
                }
        }

        this.showFieldValidation(input, isValid, errorMessage);
        return isValid;
    }

    // Get form data as object
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        return data;
    }

    // Validation helpers
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validatePassword(password) {
        const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = this.passwordRequirements;
        
        if (password.length < minLength) return false;
        if (requireUppercase && !/[A-Z]/.test(password)) return false;
        if (requireLowercase && !/[a-z]/.test(password)) return false;
        if (requireNumber && !/[0-9]/.test(password)) return false;
        if (requireSpecial && !/[!@#$%^&*]/.test(password)) return false;
        
        return true;
    }

    validatePhone(phone) {
        return /^\+?[\d\s-]{10,}$/.test(phone);
    }

    getPasswordErrorMessage(password) {
        const errors = [];
        const { minLength, requireUppercase, requireLowercase, requireNumber, requireSpecial } = this.passwordRequirements;

        if (password.length < minLength) errors.push(`at least ${minLength} characters`);
        if (requireUppercase && !/[A-Z]/.test(password)) errors.push('an uppercase letter');
        if (requireLowercase && !/[a-z]/.test(password)) errors.push('a lowercase letter');
        if (requireNumber && !/[0-9]/.test(password)) errors.push('a number');
        if (requireSpecial && !/[!@#$%^&*]/.test(password)) errors.push('a special character');

        return errors.length ? `Password must contain ${errors.join(', ')}` : '';
    }

    // UI feedback
    showFieldValidation(input, isValid, errorMessage) {
        const errorElement = this.getOrCreateErrorElement(input);
        
        if (!isValid) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            errorElement.style.display = 'none';
        }
    }

    getOrCreateErrorElement(input) {
        let errorElement = input.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            errorElement.style.color = 'var(--danger-color)';
            errorElement.style.fontSize = 'var(--font-size-xs)';
            errorElement.style.marginTop = 'var(--space-xs)';
            input.parentNode.insertBefore(errorElement, input.nextSibling);
        }
        return errorElement;
    }
}

const formHandler = new FormHandler();
export default formHandler; 