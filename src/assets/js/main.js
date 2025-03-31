
/**
 * Main JavaScript file for Share&Care platform
 * @author Mohit Shah
 * Handles main functionality, including mobile menu toggle, stats animation, and card hover effects
 */

// DOM Elements
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navMenu = document.querySelector('.nav-menu');

// Mobile menu toggle functionality
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.setAttribute('aria-expanded', 
            mobileMenuToggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true'
        );
    });
}

// Stats Animation
const animateStats = () => {
    const stats = document.querySelectorAll('.hero-stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.textContent);
        let current = 0;
        const increment = target / 30; // Animate over 30 steps
        
        const updateCount = () => {
            if (current < target) {
                current += increment;
                stat.textContent = Math.ceil(current) + '+';
                requestAnimationFrame(updateCount);
            } else {
                stat.textContent = target + '+';
            }
        };
        
        updateCount();
    });
};

// Run stats animation when the element is in view
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStats();
            observer.unobserve(entry.target);
        }
    });
});

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    observer.observe(heroStats);
}

// Card hover effects
const productCards = document.querySelectorAll('.product-card');
productCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.transition = 'transform 0.3s ease';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const authMenu = document.querySelector('.auth-menu');
    let isMenuOpen = false;

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        isMenuOpen = !isMenuOpen;
        navMenu.classList.toggle('active');
        document.body.style.overflow = isMenuOpen ? 'hidden' : '';
        
        // Close auth dropdown when closing mobile menu
        if (!isMenuOpen && authMenu) {
            const authDropdown = authMenu.querySelector('.auth-dropdown');
            if (authDropdown) {
                authDropdown.classList.remove('show');
            }
        }
    };

    // Event listeners
    mobileMenuToggle?.addEventListener('click', toggleMobileMenu);

    // Close menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMenuOpen) {
            toggleMobileMenu();
        }
    });

    // Handle auth menu on mobile
    if (authMenu) {
        const authToggle = authMenu.querySelector('.auth-toggle');
        const authDropdown = authMenu.querySelector('.auth-dropdown');
        
        authToggle?.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                authDropdown.classList.toggle('show');
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !authMenu.contains(e.target)) {
                authDropdown?.classList.remove('show');
            }
        });
    }

    // Stats Animation
    const animateStats = () => {
        const stats = document.querySelectorAll('.hero-stat-number');
        stats.forEach(stat => {
            const target = parseInt(stat.textContent);
            let current = 0;
            const increment = target / 30;
            
            const updateCount = () => {
                if (current < target) {
                    current += increment;
                    stat.textContent = Math.ceil(current) + '+';
                    requestAnimationFrame(updateCount);
                } else {
                    stat.textContent = target + '+';
                }
            };
            
            updateCount();
        });
    };

    // Run stats animation when in view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                observer.unobserve(entry.target);
            }
        });
    });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }
}); 