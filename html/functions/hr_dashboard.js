import { initializeEventListeners, loadJobs } from './events.js';
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js';

document.addEventListener('DOMContentLoaded', function () {
    auth.onAuthStateChanged((user) => {
        if (user) {
            toggleLoadingState(true);  // Show loading indicator

            setTimeout(() => {
                user.getIdTokenResult().then((idTokenResult) => {
                    // You can add role-based logic here if needed
                }).catch((error) => {
                    console.error("Error fetching user claims:", error);
                }).finally(() => {
                    toggleLoadingState(false);  // Hide loading indicator after delay
                });
            }, 1000); // 1-second delay
        } else {
            console.log("No user is signed in.");
        }
    });

    // Initialize event listeners and load jobs on page load
    initializeEventListeners();
    loadJobs();

    // Search and filter event listeners
    document.getElementById('searchInput').addEventListener('input', loadJobs);
    document.getElementById('employmentTypeFilter').addEventListener('change', loadJobs);
    document.getElementById('locationFilter').addEventListener('change', loadJobs);
});
