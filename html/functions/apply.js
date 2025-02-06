/**
 * This script handles the job application process. It checks the user's authentication status, 
 * ensures the user is eligible to apply, verifies if the user has already applied for the job, 
 * and then submits the application to Firebase Firestore.
 */

import { auth } from '../db/firebase_init.js';
import db from '../db/firebase_firestore.js';
import { doc, getDoc, setDoc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Function to handle the job application process
export async function applyForJob(jobId) {
    const user = auth.currentUser;  // Get the currently authenticated user

    // Debugging logs to check if user ID and job ID are correctly passed
    console.log('user.uid:', user ? user.uid : 'User not logged in');
    console.log('jobId:', jobId);

    // Check if the user is logged in
    if (!user) {
        // If not logged in, redirect to the login page
        window.location.href = '/login.html';
        return;
    }

    // Check if the jobId is valid
    if (!jobId) {
        console.error('Error: jobId is undefined');
        alert('An error occurred. Please try again later.');
        return;
    }

    // Reference to the user's document in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    // Check if the user's role is 'applicant'
    if (!userDoc.exists() || userDoc.data().role !== 'applicant') {
        alert('You must be an applicant to apply for jobs.');
        return;
    }

    // Query to check if the user has already applied for this job
    const applicationsRef = collection(db, 'applications');
    const applicationQuery = query(applicationsRef, where('userId', '==', user.uid), where('jobId', '==', jobId));
    const applicationSnapshot = await getDocs(applicationQuery);

    // If the user has already applied, notify them and redirect to the status page
    if (!applicationSnapshot.empty) {
        alert('You have already applied for this job. Redirecting to status page...');
        window.location.href = '../applicant/status.html';
        return;
    }

    // Proceed with the job application if the user has not already applied
    await setDoc(doc(applicationsRef), {
        userId: user.uid,
        jobId: jobId,
        status: 'Applied',
        appliedAt: new Date()
    });

    // Notify the user of successful application and redirect to the job board
    alert('Application successful! Redirecting to job board...');
    window.location.href = '../applicant/job_board.html';
}
