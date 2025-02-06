import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import db from '../db/firebase_firestore.js'; // Firebase setup

let rejectedMRFs = []; // Store all rejected MRFs

document.addEventListener('DOMContentLoaded', async () => {
    const rejectedMRFList = document.getElementById('rejectedMRFList');
    const searchMRFInput = document.getElementById('searchMRFInput');  // Search input for MRFs

    try {
        // Query to get all rejected MRFs
        const q = query(collection(db, "mrf_submissions"), where("status", "==", "Rejected"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            rejectedMRFList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No rejected MRFs found.</td></tr>`;
            return;
        }

        // Store all rejected MRF data
        rejectedMRFs = querySnapshot.docs.map((doc) => doc.data());

        // Initial rendering of rejected MRFs
        renderMRFs(rejectedMRFs);

        // Set up event listener for search input
        searchMRFInput.addEventListener('input', () => applySearch());

    } catch (error) {
        console.error("Error fetching rejected MRFs: ", error);
        rejectedMRFList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center text-red-500">Error loading data.</td></tr>`;
    }
});

// Function to apply search
function applySearch() {
    const searchText = searchMRFInput.value.toLowerCase();

    // Filter MRFs based on search input
    const filteredMRFs = rejectedMRFs.filter(mrf => {
        const { companyName, jobTitle } = mrf;
        return (companyName.toLowerCase().includes(searchText) || jobTitle.toLowerCase().includes(searchText));
    });

    renderMRFs(filteredMRFs);
}

// Function to render MRFs in the table
function renderMRFs(mrfsToRender) {
    const rejectedMRFList = document.getElementById('rejectedMRFList');
    rejectedMRFList.innerHTML = ''; // Clear existing content

    if (mrfsToRender.length === 0) {
        rejectedMRFList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No matching MRFs found.</td></tr>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    mrfsToRender.forEach(({ companyName, jobTitle, rejectionReason, rejectedAt }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4">${companyName}</td>
            <td class="py-2 px-4">${jobTitle}</td>
            <td class="py-2 px-4">${rejectionReason || 'Not specified'}</td>
            <td class="py-2 px-4">${new Date(rejectedAt.seconds * 1000).toLocaleDateString()}</td>
        `;

        fragment.appendChild(tr);
    });

    rejectedMRFList.appendChild(fragment);
}
