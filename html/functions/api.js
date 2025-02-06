
import db from '../db/firebase_firestore.js';
import { collection, addDoc, updateDoc, deleteDoc, getDocs, doc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Fetch all jobs from Firestore
export async function fetchJobs() {
    // Example function to fetch jobs from Firestore
    try {
        const jobsSnapshot = await getDocs(collection(db, "jobs"));
        const jobsList = jobsSnapshot.docs.map(doc => {
            console.log("Job Data:", doc.data());  // Debugging line to ensure data is correct
            return { id: doc.id, ...doc.data() };
        });
        return jobsList;
    } catch (error) {
        console.error("Error fetching jobs: ", error);
    }
}

// Add a new job to Firestore
export async function addJob(jobData) {
    try {
        const docRef = await addDoc(collection(db, 'jobs'), jobData);
    } catch (error) {
        console.error("Error adding job: ", error);
        throw new Error(`Could not add job: ${error.message}`);
    }
}

// Update an existing job in Firestore
export async function updateJob(jobId, jobData) {
    try {
        const jobRef = doc(db, 'jobs', jobId);
        await updateDoc(jobRef, jobData);
    } catch (error) {
        console.error("Error updating job: ", error);
        throw new Error(`Could not update job: ${error.message}`);
    }
}

// Delete a job from Firestore
export async function deleteJob(jobId) {
    try {
        const jobRef = doc(db, 'jobs', jobId);
        await deleteDoc(jobRef);
    } catch (error) {
        console.error("Error deleting job: ", error);
        throw new Error(`Could not delete job: ${error.message}`);
    }
}
