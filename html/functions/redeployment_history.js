import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import db from '../db/firebase_firestore.js'; // Firebase setup

let redeploymentHistory = []; // Store all redeployment history

document.addEventListener('DOMContentLoaded', async () => {
    const historyList = document.getElementById('redeploymentHistoryList');
    const searchInput = document.getElementById('searchRedeploymentInput');

    try {
        // Query all redeployments from Firestore
        const q = query(collection(db, "redeployments"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            historyList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No redeployment history found.</td></tr>`;
            return;
        }

        // Store and render redeployment history
        redeploymentHistory = querySnapshot.docs.map(doc => doc.data());
        renderHistory(redeploymentHistory);

        // Set up search functionality
        searchInput.addEventListener('input', () => applySearch());

    } catch (error) {
        console.error("Error fetching redeployment history: ", error);
        historyList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center text-red-500">Error loading data.</td></tr>`;
    }
});

// Filter and render redeployment history based on search
function applySearch() {
    const searchText = document.getElementById('searchRedeploymentInput').value.toLowerCase();
    const filteredHistory = redeploymentHistory.filter(history => {
        const { employeeName, redeploymentLocation } = history;
        return (employeeName.toLowerCase().includes(searchText) || redeploymentLocation.toLowerCase().includes(searchText));
    });

    renderHistory(filteredHistory);
}

// Render history to the table
function renderHistory(history) {
    const historyList = document.getElementById('redeploymentHistoryList');
    historyList.innerHTML = ''; // Clear existing content

    if (history.length === 0) {
        historyList.innerHTML = `<tr><td colspan="4" class="py-4 px-4 text-center">No matching redeployments found.</td></tr>`;
        return;
    }

    history.forEach(({ employeeName, redeploymentDate, redeploymentLocation, justification }) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4">${employeeName}</td>
            <td class="py-2 px-4">${new Date(redeploymentDate).toLocaleDateString()}</td>
            <td class="py-2 px-4">${redeploymentLocation}</td>
            <td class="py-2 px-4">${justification || 'Not specified'}</td>
        `;

        historyList.appendChild(tr);
    });
}
