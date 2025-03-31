/**
 * UI Handler Service
 * @author Goutam Yadav
 * Handles UI components, animations, form validations, and notifications
 */

// UI Module for Share&Care Platform
import authService from '../auth.js';

class UIHandler {
    constructor() {
        this.notifications = [];
        this.modalStack = [];
        this.initializeUI();
    }

    initializeUI() {
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize mobile menu
        this.initializeMobileMenu();
        
        // Initialize scroll animations
        this.initializeScrollAnimations();
        
        // Update UI based on auth status
        this.updateUIForAuthStatus();
        
        // Initialize notifications
        this.initializeNotifications();
    }

    // Mobile Menu
    initializeMobileMenu() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                mobileMenuToggle.setAttribute('aria-expanded',
                    mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
                );
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // Tooltips
    initializeTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('data-tooltip'));
            });
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - parseInt(getComputedStyle(document.documentElement).getPropertyValue('--space-xs'))}px`;
        tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
    }

    hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Scroll Animations
    initializeScrollAnimations() {
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // Auth Status UI Updates
    updateUIForAuthStatus() {
        const isAuthenticated = authService.isUserAuthenticated();
        const authElements = document.querySelectorAll('[data-auth-required]');
        const nonAuthElements = document.querySelectorAll('[data-non-auth-only]');
        
        authElements.forEach(element => {
            element.style.display = isAuthenticated ? '' : 'none';
        });
        
        nonAuthElements.forEach(element => {
            element.style.display = isAuthenticated ? 'none' : '';
        });

        if (isAuthenticated) {
            const user = authService.getCurrentUser();
            this.updateUserInfo(user);
        }
    }

    updateUserInfo(user) {
        const userNameElements = document.querySelectorAll('.user-name');
        const userAvatarElements = document.querySelectorAll('.user-avatar');
        
        userNameElements.forEach(element => {
            element.textContent = `${user.first_name} ${user.last_name}`;
        });
        
        userAvatarElements.forEach(element => {
            element.src = user.profile.avatar;
            element.alt = `${user.first_name}'s avatar`;
        });
    }

    // Notifications
    initializeNotifications() {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Create notification structure
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="bx ${this.getNotificationIcon(type)}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${this.getNotificationTitle(type)}</div>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="bx bx-x"></i>
            </button>
            <div class="toast-progress">
                <div class="toast-progress-bar"></div>
            </div>
        `;

        const container = document.querySelector('.toast-container');
        container.appendChild(toast);

        // Add close button handler
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        });

        // Animate progress bar
        const progressBar = toast.querySelector('.toast-progress-bar');
        progressBar.style.width = '100%';
        progressBar.style.transition = `width ${duration}ms linear`;
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
            progressBar.style.width = '0%';
        }, 10);

        // Auto dismiss
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    getNotificationIcon(type) {
        switch(type) {
            case 'success': return 'bx-check-circle';
            case 'error': return 'bx-x-circle';
            case 'warning': return 'bx-error';
            case 'info': return 'bx-info-circle';
            default: return 'bx-info-circle';
        }
    }

    getNotificationTitle(type) {
        switch(type) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'warning': return 'Warning';
            case 'info': return 'Information';
            default: return 'Notice';
        }
    }

    // Modal handling
    showModal(content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content" style="background: var(--white); border-radius: var(--radius-lg);">
                ${options.title ? `<h2 class="modal-title">${options.title}</h2>` : ''}
                <div class="modal-body">${content}</div>
                ${options.showClose !== false ? '<button class="modal-close">&times;</button>' : ''}
            </div>
        `;

        document.body.appendChild(modal);
        this.modalStack.push(modal);

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modal));
        }

        if (overlay && options.closeOnOverlay !== false) {
            overlay.addEventListener('click', () => this.closeModal(modal));
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        return modal;
    }

    closeModal(modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            this.modalStack = this.modalStack.filter(m => m !== modal);
            if (this.modalStack.length === 0) {
                document.body.style.overflow = '';
            }
        }, 300);
    }

    closeAllModals() {
        [...this.modalStack].forEach(modal => this.closeModal(modal));
    }

    // Loading indicators
    showLoading(container = document.body) {
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div>';
        container.appendChild(loader);
        return loader;
    }

    hideLoading(loader) {
        if (loader && loader.parentNode) {
            loader.remove();
        }
    }
}

const uiHandler = new UIHandler();
export default uiHandler; 