// html/db/firebase_auth.js

/**
 * firebase_auth.js
 * 
 * Provides Firebase Authentication service.
 */

import { app } from './firebase_init.js';
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export default auth;
