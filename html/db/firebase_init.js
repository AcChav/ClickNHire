// firebase_init.js

/**
 * firebase_init.js
 * 
 * Initializes Firebase services for the application.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js";

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyAPfFZ54aJ3p7wCirtxf5Fk_hhAE2gygaI",
    authDomain: "erecruitment-9846f.firebaseapp.com",
    projectId: "erecruitment-9846f",
    storageBucket: "erecruitment-9846f.appspot.com",
    messagingSenderId: "720475466483",
    appId: "1:720475466483:web:2026336dea108ccbf56586",
    measurementId: "G-37RL8QZZ7E"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
