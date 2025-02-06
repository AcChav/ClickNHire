// Handles user login using Firebase Authentication
import auth from '../db/firebase_auth.js';
import db from '../db/firebase_firestore.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const maxAttempts = 3; // Maximum allowed attempts

    // Handle form submission for login
    form.addEventListener('submit', async function (event) {
        event.preventDefault(); // Prevent default form submission

        const email = document.getElementById('email').value.trim(); // Get email value
        const password = document.getElementById('password').value.trim(); // Get password value

        // Retrieve stored data for this email
        let attemptCount = parseInt(localStorage.getItem(`${email}_attemptCount`)) || 0;
        let lockoutTime = parseInt(localStorage.getItem(`${email}_lockoutTime`)) || 0;

        // Check if the user is still locked out
        if (Date.now() < lockoutTime) {
            alert('Your account is temporarily locked. Please try again later.');
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password); // Sign in the user
            const user = userCredential.user; // Get the signed-in user

            const userDoc = await getDoc(doc(db, "users", user.uid)); // Retrieve user data from Firestore

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const role = userData.role;

                // Redirect user based on their role
                switch (role) {
                    case 'applicant':
                        window.location.href = '../roles/applicant/job_board.html'; // Redirect to applicant dashboard
                        break;
                    case 'hr':
                        window.location.href = '../roles/hr/hr_dashboard.html'; // Redirect to HR dashboard
                        break;
                    case 'client':
                        window.location.href = '../roles/client/mrf.html'; // Redirect to client dashboard
                        break;
                    default:
                        alert('Unknown role, please contact support.');
                }
            } else {
                throw new Error('No user data found.'); // Handle missing user data
            }

            // Reset attempt count on successful login
            localStorage.removeItem(`${email}_attemptCount`);
            localStorage.removeItem(`${email}_lockoutTime`);

        } catch (error) {
            attemptCount++; // Increment attempt count on error
            localStorage.setItem(`${email}_attemptCount`, attemptCount); // Store attempt count for this email

            if (attemptCount >= maxAttempts) {
                lockoutTime = Date.now() + 1 * 60 * 1000; // Lock account for 15 minutes
                localStorage.setItem(`${email}_lockoutTime`, lockoutTime); // Store lockout time for this email
                alert('Maximum login attempts exceeded. Your account is temporarily locked for 15 minutes.');
            } else {
                console.error("Error logging in:", error); // Log and display login error
                alert(`Login failed: ${error.message}. Attempts remaining: ${maxAttempts - attemptCount}`);
            }
        }
    });
});
