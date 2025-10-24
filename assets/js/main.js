// LockVault - Password Manager JavaScript
// Main functionality for authentication, password management, and UI interactions

class LockVault {
    constructor() {
        this.currentUser = null;
        this.passwords = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.setupEventListeners();
        this.initializeSampleData();
        this.updateUI();
    }

    // Authentication Methods
    register(username, email, password) {
        const users = this.getUsers();
        
        // Check if user already exists
        if (users.find(user => user.username === username || user.email === email)) {
            this.showAlert('User already exists!', 'error');
            return false;
        }

        // Validate password strength
        if (!this.validatePassword(password)) {
            this.showAlert('Password must be at least 8 characters with uppercase, lowercase, number, and special character', 'error');
            return false;
        }

        // Create new user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('lockvault_users', JSON.stringify(users));
        
        this.showAlert('Registration successful! Please login.', 'success');
        return true;
    }

    login(username, password) {
        const users = this.getUsers();
        const user = users.find(u => u.username === username || u.email === username);
        
        if (!user || !this.verifyPassword(password, user.password)) {
            this.showAlert('Invalid credentials!', 'error');
            return false;
        }

        this.currentUser = user;
        localStorage.setItem('lockvault_current_user', JSON.stringify(user));
        this.loadPasswords();
        this.showAlert('Login successful!', 'success');
        return true;
    }

    logout() {
        this.currentUser = null;
        this.passwords = [];
        localStorage.removeItem('lockvault_current_user');
        this.showAlert('Logged out successfully!', 'success');
        this.redirectToLogin();
    }

    // Password Management
    addPassword(website, username, password, notes = '') {
        if (!this.currentUser) {
            this.showAlert('Please login first!', 'error');
            return false;
        }

        const newPassword = {
            id: Date.now(),
            website,
            username,
            password: this.encryptPassword(password),
            notes,
            createdAt: new Date().toISOString(),
            userId: this.currentUser.id
        };

        this.passwords.push(newPassword);
        this.savePasswords();
        this.showAlert('Password saved successfully!', 'success');
        return true;
    }

    updatePassword(id, website, username, password, notes = '') {
        const index = this.passwords.findIndex(p => p.id === id);
        if (index === -1) {
            this.showAlert('Password not found!', 'error');
            return false;
        }

        this.passwords[index] = {
            ...this.passwords[index],
            website,
            username,
            password: this.encryptPassword(password),
            notes,
            updatedAt: new Date().toISOString()
        };

        this.savePasswords();
        this.showAlert('Password updated successfully!', 'success');
        return true;
    }

    deletePassword(id) {
        if (confirm('Are you sure you want to delete this password?')) {
            this.passwords = this.passwords.filter(p => p.id !== id);
            this.savePasswords();
            this.showAlert('Password deleted successfully!', 'success');
            this.updateUI();
        }
    }

    getPassword(id) {
        const password = this.passwords.find(p => p.id === id);
        if (password) {
            return {
                ...password,
                password: this.decryptPassword(password.password)
            };
        }
        return null;
    }

    // Password Generator
    generatePassword(options = {}) {
        const {
            length = 12,
            includeUppercase = true,
            includeLowercase = true,
            includeNumbers = true,
            includeSymbols = true
        } = options;

        let charset = '';
        if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
        if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeNumbers) charset += '0123456789';
        if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (charset === '') {
            this.showAlert('Please select at least one character type!', 'error');
            return '';
        }

        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        return password;
    }

    getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score <= 2) return { level: 'weak', score: 25 };
        if (score <= 4) return { level: 'fair', score: 50 };
        if (score <= 5) return { level: 'good', score: 75 };
        return { level: 'strong', score: 100 };
    }

    // Utility Methods
    hashPassword(password) {
        // Simple hash function for demo purposes
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    verifyPassword(password, hash) {
        return this.hashPassword(password) === hash;
    }

    encryptPassword(password) {
        // Simple encryption for demo purposes
        return btoa(password);
    }

    decryptPassword(encryptedPassword) {
        // Simple decryption for demo purposes
        return atob(encryptedPassword);
    }

    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return password.length >= minLength && 
               hasUpperCase && 
               hasLowerCase && 
               hasNumbers && 
               hasSpecialChar;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Data Management
    getUsers() {
        const users = localStorage.getItem('lockvault_users');
        return users ? JSON.parse(users) : [];
    }

    loadUserData() {
        const userData = localStorage.getItem('lockvault_current_user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.loadPasswords();
        }
    }

    loadPasswords() {
        if (!this.currentUser) return;
        const passwords = localStorage.getItem(`lockvault_passwords_${this.currentUser.id}`);
        this.passwords = passwords ? JSON.parse(passwords) : [];
    }

    savePasswords() {
        if (this.currentUser) {
            localStorage.setItem(`lockvault_passwords_${this.currentUser.id}`, JSON.stringify(this.passwords));
        }
    }

    // UI Methods
    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} show`;
        alert.textContent = message;

        // Insert at the top of the page
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alert, container.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    updateUI() {
        this.updateNavigation();
        this.updateDashboard();
    }

    updateNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    // Always rebuild navigation so it's consistent across pages
    navMenu.innerHTML = '';

    // Detect path context
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const pathPrefix = isInPagesDir ? '' : 'pages/';
    const homePath = isInPagesDir ? '../index.html' : 'index.html';

    if (this.currentUser) {
        // Logged-in user menu
        const menuItems = [
            { href: homePath, text: 'Home', icon: 'fas fa-home' },
            { href: `${pathPrefix}about.html`, text: 'About', icon: 'fas fa-info-circle' },
            { href: `${pathPrefix}features.html`, text: 'Features', icon: 'fas fa-star' },
            { href: `${pathPrefix}dashboard.html`, text: 'Dashboard', icon: 'fas fa-tachometer-alt' },
            { href: `${pathPrefix}generator.html`, text: 'Generator', icon: 'fas fa-key' },
            { href: `${pathPrefix}profile.html`, text: 'Profile', icon: 'fas fa-user' },
            { href: `${pathPrefix}contact.html`, text: 'Contact', icon: 'fas fa-envelope' }
        ];

        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a href="${item.href}" class="nav-link">
                    <i class="${item.icon}"></i>
                    ${item.text}
                </a>
            `;
            navMenu.appendChild(li);
        });

        // Logout button
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item';
        logoutLi.innerHTML = `
            <a href="#" class="nav-link" id="logout-btn">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </a>
        `;
        navMenu.appendChild(logoutLi);
    } else {
        // Guest menu
        const menuItems = [
            { href: homePath, text: 'Home', icon: 'fas fa-home' },
            { href: `${pathPrefix}about.html`, text: 'About', icon: 'fas fa-info-circle' },
            { href: `${pathPrefix}features.html`, text: 'Features', icon: 'fas fa-star' },
            { href: `${pathPrefix}register.html`, text: 'Register', icon: 'fas fa-user-plus' },
            { href: `${pathPrefix}login.html`, text: 'Login', icon: 'fas fa-sign-in-alt' },
            { href: `${pathPrefix}contact.html`, text: 'Contact', icon: 'fas fa-envelope' }
        ];

        menuItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a href="${item.href}" class="nav-link">
                    <i class="${item.icon}"></i>
                    ${item.text}
                </a>
            `;
            navMenu.appendChild(li);
        });
    }
}


    updateDashboard() {
        const dashboardContainer = document.querySelector('.passwords-grid');
        if (!dashboardContainer) return;

        dashboardContainer.innerHTML = '';

        if (this.passwords.length === 0) {
            dashboardContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-key" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                    <h3>No passwords saved yet</h3>
                    <p>Start by adding your first password to get started!</p>
                    <a href="pages/add.html" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Add Password
                    </a>
                </div>
            `;
            return;
        }

        this.passwords.forEach(password => {
            const passwordCard = this.createPasswordCard(password);
            dashboardContainer.appendChild(passwordCard);
        });
    }

    createPasswordCard(password) {
        const card = document.createElement('div');
        card.className = 'password-card';
        card.innerHTML = `
            <div class="password-card-header">
                <div class="password-website">${password.website}</div>
                <div class="password-actions">
                    <button class="action-btn view" onclick="lockVault.viewPassword(${password.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="lockVault.editPassword(${password.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="lockVault.deletePassword(${password.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="password-details">
                <div class="password-detail">
                    <span class="password-label">Username:</span>
                    <span class="password-value">${password.username}</span>
                </div>
                <div class="password-detail">
                    <span class="password-label">Password:</span>
                    <span class="password-value hidden" id="password-${password.id}">••••••••</span>
                </div>
                ${password.notes ? `
                    <div class="password-detail">
                        <span class="password-label">Notes:</span>
                        <span class="password-value">${password.notes}</span>
                    </div>
                ` : ''}
            </div>
        `;
        return card;
    }

    viewPassword(id) {
        const password = this.getPassword(id);
        if (!password) return;

        const passwordElement = document.getElementById(`password-${id}`);
        if (passwordElement.classList.contains('hidden')) {
            passwordElement.textContent = password.password;
            passwordElement.classList.remove('hidden');
        } else {
            passwordElement.textContent = '••••••••';
            passwordElement.classList.add('hidden');
        }
    }

    editPassword(id) {
        const password = this.getPassword(id);
        if (!password) return;

        // Redirect to edit page with password ID
        window.location.href = `pages/edit.html?id=${id}`;
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showAlert('Copied to clipboard!', 'success');
        }).catch(() => {
            this.showAlert('Failed to copy to clipboard', 'error');
        });
    }

    redirectToLogin() {
        // Go up one folder if already in /pages/
        const path = window.location.pathname.includes('/pages/')
            ? '../pages/login.html'
            : 'pages/login.html';
        window.location.href = path;
    }

    redirectToDashboard() {
        // Go up one folder if already in /pages/
        const path = window.location.pathname.includes('/pages/')
            ? '../pages/dashboard.html'
            : 'pages/dashboard.html';
        window.location.href = path;
    }


    // Form Validation
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            const errorElement = input.parentNode.querySelector('.form-error');
            
            if (!input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else if (input.type === 'email' && !this.validateEmail(input.value)) {
                this.showFieldError(input, 'Please enter a valid email address');
                isValid = false;
            } else if (input.type === 'password' && input.id === 'password' && !this.validatePassword(input.value)) {
                this.showFieldError(input, 'Password must be at least 8 characters with uppercase, lowercase, number, and special character');
                isValid = false;
            } else if (input.id === 'confirmPassword') {
                const password = form.querySelector('#password');
                if (password && input.value !== password.value) {
                    this.showFieldError(input, 'Passwords do not match');
                    isValid = false;
                }
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        input.classList.add('error');
        const errorElement = input.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.form-error');
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Event Listeners
    setupEventListeners() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
                e.preventDefault();
                this.logout();
            }
        });

        // Form submissions
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'register-form') {
                e.preventDefault();
                this.handleRegister(form);
            } else if (form.id === 'login-form') {
                e.preventDefault();
                this.handleLogin(form);
            } else if (form.id === 'add-password-form') {
                e.preventDefault();
                this.handleAddPassword(form);
            } else if (form.id === 'edit-password-form') {
                e.preventDefault();
                this.handleEditPassword(form);
            } else if (form.id === 'contact-form') {
                e.preventDefault();
                this.handleContact(form);
            }
        });

        // Password generator
        const generateBtn = document.getElementById('generate-password');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                this.handlePasswordGeneration();
            });
        }

        // Copy password button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-password')) {
                const password = e.target.getAttribute('data-password');
                this.copyToClipboard(password);
            }
        });
    }

    // Form Handlers
    handleRegister(form) {
        if (!this.validateForm('register-form')) return;

        const formData = new FormData(form);
        const username = formData.get('username');
        const email = formData.get('email');
        const password = formData.get('password');

        if (this.register(username, email, password)) {
            form.reset();
            setTimeout(() => {
                window.location.href = 'pages/login.html';
            }, 1500);
        }
    }

    handleLogin(form) {
        if (!this.validateForm('login-form')) return;

        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');

        if (this.login(username, password)) {
            form.reset();
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1500);
        }
    }

    handleAddPassword(form) {
        if (!this.validateForm('add-password-form')) return;

        const formData = new FormData(form);
        const website = formData.get('website');
        const username = formData.get('username');
        const password = formData.get('password');
        const notes = formData.get('notes');

        if (this.addPassword(website, username, password, notes)) {
            form.reset();
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1500);
        }
    }

    handleEditPassword(form) {
        if (!this.validateForm('edit-password-form')) return;

        const urlParams = new URLSearchParams(window.location.search);
        const passwordId = parseInt(urlParams.get('id'));

        const formData = new FormData(form);
        const website = formData.get('website');
        const username = formData.get('username');
        const password = formData.get('password');
        const notes = formData.get('notes');

        if (this.updatePassword(passwordId, website, username, password, notes)) {
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1500);
        }
    }

    handleContact(form) {
        if (!this.validateForm('contact-form')) return;

        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        // Simulate form submission
        this.showAlert('Thank you for your message! We\'ll get back to you soon.', 'success');
        form.reset();
    }

    handlePasswordGeneration() {
        const length = parseInt(document.getElementById('password-length').value) || 12;
        const includeUppercase = document.getElementById('include-uppercase').checked;
        const includeLowercase = document.getElementById('include-lowercase').checked;
        const includeNumbers = document.getElementById('include-numbers').checked;
        const includeSymbols = document.getElementById('include-symbols').checked;

        const options = {
            length,
            includeUppercase,
            includeLowercase,
            includeNumbers,
            includeSymbols
        };

        const password = this.generatePassword(options);
        if (password) {
            document.getElementById('generated-password').textContent = password;
            this.updatePasswordStrength(password);
        }
    }

    updatePasswordStrength(password) {
        const strength = this.getPasswordStrength(password);
        const strengthBar = document.querySelector('.strength-fill');
        const strengthLabel = document.querySelector('.strength-label span');

        if (strengthBar) {
            strengthBar.className = `strength-fill strength-${strength.level}`;
        }

        if (strengthLabel) {
            strengthLabel.textContent = strength.level.charAt(0).toUpperCase() + strength.level.slice(1);
        }
    }

    // Initialize sample data
    initializeSampleData() {
        if (this.currentUser) return;

        // Check if sample data already exists
        const users = this.getUsers();
        if (users.length > 0) return;

        // Create sample user
        const sampleUser = {
            id: 1,
            username: 'demo',
            email: 'demo@lockvault.com',
            password: this.hashPassword('Demo123!'),
            createdAt: new Date().toISOString()
        };

        users.push(sampleUser);
        localStorage.setItem('lockvault_users', JSON.stringify(users));

        // Create sample passwords
        const samplePasswords = [
            {
                id: 1,
                website: 'Gmail',
                username: 'demo@gmail.com',
                password: this.encryptPassword('SamplePass123!'),
                notes: 'Main email account',
                createdAt: new Date().toISOString(),
                userId: 1
            },
            {
                id: 2,
                website: 'Facebook',
                username: 'demo_user',
                password: this.encryptPassword('FbPass456!'),
                notes: 'Social media account',
                createdAt: new Date().toISOString(),
                userId: 1
            },
            {
                id: 3,
                website: 'GitHub',
                username: 'demo_dev',
                password: this.encryptPassword('GitHub789!'),
                notes: 'Development platform',
                createdAt: new Date().toISOString(),
                userId: 1
            }
        ];

        localStorage.setItem('lockvault_passwords_1', JSON.stringify(samplePasswords));
    }
}

// Initialize the application
const lockVault = new LockVault();

// Page-specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if user needs to be redirected
    const currentPage = window.location.pathname;
    const protectedPages = ['/pages/dashboard.html', '/pages/add.html', '/pages/edit.html', '/pages/generator.html', '/pages/profile.html'];
    
    if (protectedPages.some(page => currentPage.includes(page))) {
        if (!lockVault.currentUser) {
            lockVault.redirectToLogin();
        }
    }

    // Load password data for edit page
    if (currentPage.includes('edit.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const passwordId = parseInt(urlParams.get('id'));
        
        if (passwordId) {
            const password = lockVault.getPassword(passwordId);
            if (password) {
                document.getElementById('website').value = password.website;
                document.getElementById('username').value = password.username;
                document.getElementById('password').value = password.password;
                document.getElementById('notes').value = password.notes || '';
            }
        }
    }

    // Initialize password generator
    if (currentPage.includes('generator.html')) {
        lockVault.handlePasswordGeneration();
    }
});
