import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import db from '../db/firebase_firestore.js'; // Your Firebase setup

let applications = []; // Store all applications

document.addEventListener('DOMContentLoaded', async () => {
    const rejectedApplicantsList = document.getElementById('rejectedApplicantsList');
    const searchApplicantInput = document.getElementById('searchApplicantInput');  // Updated to match HTML element

    try {
        // Query to get all rejected applications
        const q = query(collection(db, "applications"), where("status", "==", "Rejected"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            rejectedApplicantsList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No rejected applicants found.</td></tr>`;
            return;
        }

        // Store all applications data
        applications = querySnapshot.docs.map((doc) => doc.data());

        // Initial rendering of rejected applicants
        renderApplications(applications);

        // Set up event listener for search input
        searchApplicantInput.addEventListener('input', () => applySearch());

    } catch (error) {
        console.error("Error fetching rejected applicants: ", error);
        rejectedApplicantsList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center text-red-500">Error loading data.</td></tr>`;
    }
});

// Function to apply search
function applySearch() {
    const searchText = searchApplicantInput.value.toLowerCase();

    // Filter applications based on search input
    const filteredApplications = applications.filter(app => {
        const { rejectionDetails } = app;
        const { applicantName, jobTitle } = rejectionDetails;

        return (applicantName.toLowerCase().includes(searchText) || jobTitle.toLowerCase().includes(searchText));
    });

    renderApplications(filteredApplications);
}

// Function to render applications in the table
function renderApplications(applicationsToRender) {
    const rejectedApplicantsList = document.getElementById('rejectedApplicantsList');
    rejectedApplicantsList.innerHTML = ''; // Clear existing content

    if (applicationsToRender.length === 0) {
        rejectedApplicantsList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No matching applicants found.</td></tr>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    applicationsToRender.forEach(({ rejectionDetails }) => {
        const { applicantName, jobTitle, reason, date } = rejectionDetails;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4">${applicantName}</td>
            <td class="py-2 px-4">${jobTitle}</td>
            <td class="py-2 px-4">${reason}</td>
            <td class="py-2 px-4">${new Date(date).toLocaleDateString()}</td>
        `;

        fragment.appendChild(tr);
    });

    rejectedApplicantsList.appendChild(fragment);
}
