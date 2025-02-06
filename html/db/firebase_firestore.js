// html/db/firebase-firestore.js

/**
 * firebase-firestore.js
 * 
 * Provides Firebase Firestore service.
 */

import { app } from './firebase_init.js';
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Initialize Firestore and get a reference to the service
const db = getFirestore(app);

export default db;
