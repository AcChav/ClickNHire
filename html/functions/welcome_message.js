import { auth } from '../db/firebase_init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import db from '../db/firebase_firestore.js';

// DOM element for the profile header
const profileHeaderElement = document.getElementById('profileHeader');

auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                let displayName;

                if (userData.firstName && userData.lastName) {
                    displayName = `${userData.firstName} ${userData.lastName}`;
                } else if (userData.companyName) {
                    displayName = userData.companyName;
                } else {
                    displayName = 'User';
                }

                // Set the name in the <h2> tag
                profileHeaderElement.textContent = `Welcome, ${displayName}`;
            } else {
                console.error("User document not found");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    } else {
        console.error("No user is signed in.");
    }
});
