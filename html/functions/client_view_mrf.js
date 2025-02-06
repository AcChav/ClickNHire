// client_view_mrf.js

import { db, auth } from '../db/firebase_init.js';
import { collection, query, where, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { renderJobDetailsModal } from './job_details.js';

const mrfList = document.getElementById('mrf-list');
const loadingIndicator = document.getElementById('loadingIndicator');
const modal = document.getElementById('detailsModal');

// Function to load MRFs submitted by the client
async function loadClientMRFs() {
    loadingIndicator.classList.remove('hidden');

    try {
        const q = query(collection(db, 'mrf_submissions'), where('client_id', '==', auth.currentUser.uid));
        const querySnapshot = await getDocs(q);

        console.log('Query Snapshot:', querySnapshot); // Debugging: Check if the query returns any documents

        if (querySnapshot.empty) {
            console.log('No MRF submissions found for this user.');
            mrfList.innerHTML = '<p>No submissions found.</p>'; // Show message if no data
        } else {
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Document Data:', data); // Debugging: Check the data being retrieved

                const mrfItem = document.createElement('div');
                mrfItem.classList.add('bg-white', 'p-4', 'border', 'border-gray-300', 'shadow', 'rounded-lg', 'flex', 'justify-between', 'items-center');

                // Format number of positions
                let numberOfPositionsFormatted = 'Not specified';
                if (data.gender === 'Both gender') {
                    numberOfPositionsFormatted = `${data.numberOfFemales || 0} Females & ${data.numberOfMales || 0} Males`;
                } else if (data.gender === 'Male' || data.gender === 'Female') {
                    numberOfPositionsFormatted = `${data.numberOfPositions || 0}`;
                }

                mrfItem.innerHTML = `
                    <div>
                        <p><strong>Company Name:</strong> ${data.companyName}</p>
                        <p><strong>Job Title:</strong> ${data.jobTitle}</p>
                        <p><strong>Employment Type:</strong> ${data.employmentType}</p>
                        <p><strong>Number of Positions:</strong> ${numberOfPositionsFormatted}</p>
                        <p><strong>Submitted At:</strong> ${new Date(data.timestamp.seconds * 1000).toLocaleString()}</p>
                    </div>
                    <button class="view-details-btn bg-green-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" data-id="${doc.id}">
                        View Details
                    </button>
                `;
                mrfList.appendChild(mrfItem);
            });

            document.querySelectorAll('.view-details-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const docId = e.target.getAttribute('data-id');
                    const docRef = doc(db, 'mrf_submissions', docId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        renderJobDetailsModal(docSnap.data());  // Use the shared modal rendering function
                    } else {
                        alert("No such document!");
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error loading MRFs:", error);
        alert("There was an error loading your MRFs.");
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

auth.onAuthStateChanged((user) => {
    if (user) {
        loadClientMRFs();
    } else {
        window.location.href = 'login.html';
    }
});

window.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.classList.add('hidden');
    }
});
