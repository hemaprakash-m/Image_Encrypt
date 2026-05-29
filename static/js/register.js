// register.js - Registration page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirm_password"]');
    const submitButton = document.querySelector('.btn-submit');

    // Real-time password strength indicator
    if (passwordInput) {
        const strengthIndicator = document.createElement('div');
        strengthIndicator.className = 'password-strength';
        strengthIndicator.style.cssText = `
            height: 4px;
            background-color: #e0e0e0;
            border-radius: 2px;
            margin-top: 8px;
            overflow: hidden;
        `;
        
        const strengthBar = document.createElement('div');
        strengthBar.style.cssText = `
            height: 100%;
            width: 0%;
            transition: all 0.3s ease;
        `;
        strengthIndicator.appendChild(strengthBar);
        
        const strengthText = document.createElement('small');
        strengthText.style.cssText = `
            display: block;
            margin-top: 5px;
            font-size: 0.75rem;
            color: var(--text-dim);
        `;
        
        passwordInput.parentElement.appendChild(strengthIndicator);
        passwordInput.parentElement.appendChild(strengthText);

        passwordInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            strengthBar.style.width = strength.percent + '%';
            strengthBar.style.backgroundColor = strength.color;
            strengthText.textContent = strength.text;
        });
    }

    // Form validation
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Clear previous errors
            clearErrors();

            let isValid = true;
            let errors = [];

            // Name validation
            const name = nameInput.value.trim();
            if (!name) {
                errors.push('Name is required');
                isValid = false;
                markInputError(nameInput);
            } else if (name.length < 2) {
                errors.push('Name must be at least 2 characters');
                isValid = false;
                markInputError(nameInput);
            }

            // Email validation
            const email = emailInput.value.trim();
            if (!email) {
                errors.push('Email is required');
                isValid = false;
                markInputError(emailInput);
            } else if (!isValidEmail(email)) {
                errors.push('Please enter a valid email address');
                isValid = false;
                markInputError(emailInput);
            }

            // Password validation
            const password = passwordInput.value;
            if (!password) {
                errors.push('Password is required');
                isValid = false;
                markInputError(passwordInput);
            } else if (password.length < 8) {
                errors.push('Password must be at least 8 characters');
                isValid = false;
                markInputError(passwordInput);
            }

            // Confirm password validation
            const confirmPassword = confirmPasswordInput.value;
            if (!confirmPassword) {
                errors.push('Please confirm your password');
                isValid = false;
                markInputError(confirmPasswordInput);
            } else if (password !== confirmPassword) {
                errors.push('Passwords do not match');
                isValid = false;
                markInputError(confirmPasswordInput);
            }

            if (!isValid) {
                showError(errors[0]); // Show first error
                return false;
            }

            // Show loading state and submit
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            this.submit();
        });
    }

    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Password strength calculator
    function calculatePasswordStrength(password) {
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.length >= 12) strength += 25;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
        if (/\d/.test(password)) strength += 12.5;
        if (/[^a-zA-Z\d]/.test(password)) strength += 12.5;

        let color, text;
        if (strength < 25) {
            color = '#ff4d4d';
            text = 'Weak';
        } else if (strength < 50) {
            color = '#ffa500';
            text = 'Fair';
        } else if (strength < 75) {
            color = '#4ecca3';
            text = 'Good';
        } else {
            color = '#00cc66';
            text = 'Strong';
        }

        return {
            percent: strength,
            color: color,
            text: text
        };
    }

    // Mark input with error
    function markInputError(input) {
        input.style.borderColor = '#ff4d4d';
        input.style.animation = 'shake 0.5s';
        
        setTimeout(() => {
            input.style.borderColor = '';
            input.style.animation = '';
        }, 500);
    }

    // Clear all errors
    function clearErrors() {
        [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
            if (input) {
                input.style.borderColor = '';
            }
        });
    }

    // Show error message
    function showError(message) {
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background-color: #ff4d4d;
            color: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9rem;
            animation: slideDown 0.3s ease;
        `;
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

        registerForm.insertBefore(errorDiv, registerForm.firstChild);

        setTimeout(() => {
            errorDiv.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
    }

    // Password visibility toggles
    [passwordInput, confirmPasswordInput].forEach((input, index) => {
        if (input) {
            const toggleBtn = document.createElement('span');
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            toggleBtn.style.cssText = `
                position: absolute;
                right: 18px;
                top: 50%;
                transform: translateY(-50%);
                cursor: pointer;
                color: var(--text-dim);
            `;
            
            input.parentElement.style.position = 'relative';
            input.parentElement.appendChild(toggleBtn);
            input.style.paddingRight = '45px';

            toggleBtn.addEventListener('click', function() {
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
            });
        }
    });
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
`;
document.head.appendChild(style);
