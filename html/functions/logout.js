// Handles user logout using Firebase Authentication
import { auth } from '../../db/firebase_init.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const logoutLink = document.querySelector('a[href="logout.html"]');

    // Handle click event on logout link
    logoutLink.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default link behavior

        // Sign out the user and handle success or error
        auth.signOut().then(() => {
            console.log('User signed out'); // Log successful sign out
            window.location.href = '../../index.html'; // Redirect to the homepage
        }).catch((error) => {
            console.error('Error signing out: ', error); // Log sign out error
        });
    });
});
