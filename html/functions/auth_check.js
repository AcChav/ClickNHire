/**
 * This script manages user authentication and role verification. It ensures that only verified 
 * applicants can access certain parts of the application. If the user is not authenticated or 
 * not verified, they are redirected accordingly.
 */

import { auth } from '../db/firebase_init.js';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

const db = getFirestore();

// Monitor authentication state changes
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // Fetch user data from Firestore
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Check user role and verification status
                if ((userData.role === 'applicant' ||
                    userData.role === 'hr' ||
                    userData.role === 'client') && userData.verified) {
                    // Proceed with access if verified
                } else if ((userData.role === 'applicant' ||
                    userData.role === 'hr' ||
                    userData.role === 'client') && !userData.verified) {
                    console.log("Access denied: Unverified user role:", userData.role);
                    // Redirect unverified user to awaiting verification page
                    window.location.href = '../../await_verification.html';
                } else {
                    console.log("Access denied: Invalid role.");
                    // Redirect to error page if role is invalid
                    window.location.href = 'error.html';
                }
            } else {
                console.log("No user data found in Firestore.");
                // Redirect to error page if no user data is found
                window.location.href = 'error.html';
            }
        } catch (error) {
            console.error('Error fetching user data from Firestore:', error);
            // Redirect to error page if Firestore fetch fails
            window.location.href = 'error.html';
        }
    } else {
        console.log("No user is signed in. Redirecting to login.");
        // Redirect to login page if no user is signed in
        window.location.href = '../../login.html';
    }
});

