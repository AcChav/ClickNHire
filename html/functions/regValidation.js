export function validatePasswordInput(passwordInput, confirmPasswordInput, passwordStrengthText) {
    // Remove spaces in the password field and validate its strength
    passwordInput.addEventListener('input', function () {
        passwordInput.value = passwordInput.value.replace(/\s/g, ''); // Remove spaces from password
        validatePasswordStrength(passwordInput.value, passwordStrengthText); // Check password strength
    });

    // Remove spaces in the confirm password field
    confirmPasswordInput.addEventListener('input', function () {
        confirmPasswordInput.value = confirmPasswordInput.value.replace(/\s/g, ''); // Remove spaces from confirm password
    });
}

// Function to validate password strength
function validatePasswordStrength(password, passwordStrengthText) {
    let strengthMessage = ''; // Message indicating the strength of the password
    let color = ''; // Color to represent the password strength

    // Determine password strength based on length and complexity
    if (password.length < 6) {
        strengthMessage = 'Password too short. Must be at least 6 characters.'; // Weak password if less than 6 characters
        color = 'red';
    } else if (password.length < 8) {
        strengthMessage = 'Weak password. Consider making it longer.'; // Weak password if between 6 and 8 characters
        color = 'orange';
    } else {
        // Check for presence of uppercase, lowercase, numbers, and special characters
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars) {
            strengthMessage = 'Strong password'; // Strong password if all conditions are met
            color = 'green';
        } else {
            strengthMessage = 'Password should include uppercase, lowercase, numbers, and special characters.'; // Suggest improvement if missing criteria
            color = 'orange';
        }
    }

    // Update the UI with the strength message and corresponding color
    passwordStrengthText.textContent = strengthMessage;
    passwordStrengthText.style.color = color;
}
