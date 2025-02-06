import auth from '../db/firebase_auth.js';
import db from '../db/firebase_firestore.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";
import { doc, setDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { validatePasswordInput } from './regValidation.js';

document.addEventListener('DOMContentLoaded', function () {
    // Get references to various form elements
    const form = document.getElementById('registrationForm');
    const roleSelect = document.getElementById('role');
    const companyNameField = document.getElementById('companyNameField');
    const companyNameInput = document.getElementById('companyNameInput');
    const companyNameDropdown = document.getElementById('companyNameDropdown');
    const firstNameField = document.getElementById('firstName').parentElement;
    const lastNameField = document.getElementById('lastName').parentElement;
    const locationField = document.getElementById('locationField');
    const locationInput = document.getElementById('location');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrengthText = document.getElementById('passwordStrength');
    const emailInput = document.getElementById('email');
    
    // Include email in the list of fields to be disabled initially
    const otherFields = [firstNameField, lastNameField, companyNameField, locationField, passwordInput, confirmPasswordInput, locationInput, emailInput];

    // Disable all fields initially
    otherFields.forEach(field => {
        if (field.tagName === "DIV") {
            field.querySelectorAll('input, select').forEach(input => input.disabled = true);
        } else {
            field.disabled = true;
        }
    });

    // Enable fields based on the selected role
    roleSelect.addEventListener('change', async function () {
        const selectedRole = roleSelect.value;

        if (selectedRole) {
            otherFields.forEach(field => {
                if (field.tagName === "DIV") {
                    field.querySelectorAll('input, select').forEach(input => input.disabled = false);
                } else {
                    field.disabled = false;
                }
            });

            // Role-specific form behavior
            if (selectedRole === 'hr' || selectedRole === 'applicant') {
                companyNameField.style.display = 'none';
                companyNameInput.removeAttribute('required');
                companyNameDropdown.removeAttribute('required');
                firstNameField.style.display = 'block';
                lastNameField.style.display = 'block';
                document.getElementById('firstName').setAttribute('required', 'required');
                document.getElementById('lastName').setAttribute('required', 'required');
            } else if (selectedRole === 'client') {
                companyNameField.style.display = 'block';
                companyNameInput.style.display = 'block';
                companyNameInput.setAttribute('required', 'required');
                companyNameDropdown.style.display = 'none';
                companyNameDropdown.removeAttribute('required');
                firstNameField.style.display = 'block';
                lastNameField.style.display = 'block';
                document.getElementById('firstName').setAttribute('required', 'required');
                document.getElementById('lastName').setAttribute('required', 'required');
            }

            // Show or hide location field based on role
            if (selectedRole === 'applicant' || selectedRole === 'client') {
                locationField.style.display = 'block';
                locationInput.setAttribute('required', 'required');
            } else {
                locationField.style.display = 'none';
                locationInput.removeAttribute('required');
            }
        } else {
            // If no role is selected, disable all fields
            otherFields.forEach(field => {
                if (field.tagName === "DIV") {
                    field.querySelectorAll('input, select').forEach(input => input.disabled = true);
                } else {
                    field.disabled = true;
                }
            });
        }
    });

    // Validate password input to enforce rules and show strength feedback
    validatePasswordInput(passwordInput, confirmPasswordInput, passwordStrengthText);

    // Handle form submission
    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const selectedRole = roleSelect.value;
        let formData = {};

        if (selectedRole === 'client') {
            formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                companyName: companyNameInput.value.trim(),
                email: document.getElementById('email').value.trim(),
                password: passwordInput.value.trim(),
                confirmPassword: confirmPasswordInput.value.trim(),
                role: selectedRole,
                location: locationInput.value.trim(),
                createdAt: new Date()
            };
        } else {
            formData = {
                firstName: document.getElementById('firstName').value.trim(),
                lastName: document.getElementById('lastName').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: passwordInput.value.trim(),
                confirmPassword: confirmPasswordInput.value.trim(),
                role: selectedRole,
                location: locationInput.value.trim(),
                createdAt: new Date()
            };
        }

        // Check if passwords match
        if (formData.password !== formData.confirmPassword) {
            showModal('Passwords do not match.', false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                firstName: formData.firstName || null,
                lastName: formData.lastName || null,
                companyName: formData.companyName || null,
                email: formData.email,
                role: formData.role,
                location: formData.location,
                createdAt: formData.createdAt,
                verified: true
            });

            showModal('Registration successful! Redirect to login page?', true);

            const modalCloseButton = document.getElementById('modalCloseButton');
            modalCloseButton.addEventListener('click', function () {
                window.location.href = 'login.html';
            });

        } catch (error) {
            console.error("Error registering user:", error);
            showModal(`Registration failed: ${error.message}`, false);
        }
    });

    // Monitor password input and show strength feedback
    passwordInput.addEventListener('input', function () {
        const password = passwordInput.value;
        const strength = getPasswordStrength(password);
        passwordStrengthText.textContent = strength.message;
        passwordStrengthText.style.color = strength.color;
    });

    // Determine password strength based on length and complexity
    function getPasswordStrength(password) {
        const strength = {
            message: '',
            color: ''
        };

        if (password.length < 6) {
            strength.message = 'Weak password';
            strength.color = 'red';
        } else if (password.length < 8) {
            strength.message = 'Medium strength password';
            strength.color = 'orange';
        } else {
            const strongPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
            if (strongPattern.test(password)) {
                strength.message = 'Strong password';
                strength.color = 'green';
            } else {
                strength.message = 'Medium strength password';
                strength.color = 'orange';
            }
        }

        return strength;
    }

    // Display modal with message, change based on success or failure
    function showModal(message, isSuccess) {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modalMessage');
        const modalTitle = document.getElementById('modalTitle');
        const modalCloseButton = document.getElementById('modalCloseButton');

        modalMessage.textContent = message;

        if (isSuccess) {
            modalTitle.textContent = 'Registration Successful!';
            modalCloseButton.textContent = 'Go to Login';
            modalCloseButton.onclick = function () {
                window.location.href = 'login.html';
            };
            modal.classList.remove('bg-red-100', 'border-red-500');
            modal.classList.add('bg-green-100', 'border-green-500');
        } else {
            modalTitle.textContent = 'Registration Failed';
            modalCloseButton.textContent = 'Close';
            modalCloseButton.onclick = function () {
                modal.classList.add('hidden');
            };
            modal.classList.remove('bg-green-100', 'border-green-500');
            modal.classList.add('bg-red-100', 'border-red-500');
        }

        modal.classList.remove('hidden');
    }
});
