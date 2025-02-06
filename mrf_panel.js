// functions/mrf_panel.js

import { db } from '../db/firebase_init.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { renderJobDetailsModal } from './job_details.js'; // Import the shared modal rendering function

const mrfList = document.getElementById('mrf-list');
const loadingIndicator = document.getElementById('loadingIndicator');
const modal = document.getElementById('detailsModal');

// Function to approve the MRF and post it as a job
async function approveMRF(mrfDoc, mrfId) {
    const data = mrfDoc.data();
    const jobData = {
        title: data.jobTitle || 'Not specified',
        company: data.companyName || 'Not specified',
        location: `${data.region || 'Not specified'}, ${data.province || 'Not specified'}, ${data.city || 'Not specified'}, ${data.barangayStreet || 'Not specified'}`,
        employmentType: data.employmentType || 'Not specified',
        description: data.jobDescription || 'Not specified',
        salaryRange: data.salaryRange || 'Not specified',
        numberOfPositions: data.numberOfPositions || 'Not specified',
        requiredExperience: data.requiredExperience || 'Not specified',
        skills: data.skills || 'Not specified',
        qualifications: data.qualifications || 'Not specified',
        contactPerson: data.contactPerson || 'Not specified',
        contactEmail: data.contactEmail || 'Not specified',
        contactPhone: data.contactPhone || 'Not specified',
        department: data.department || 'Not specified',
        gender: data.gender || 'Not specified',
        timestamp: new Date(),
    };

    const approvedAt = new Date();

    try {
        // Add the job data to the "jobs" collection in Firestore
        console.log("Job Data being stored:", jobData); // Debugging log
        await setDoc(doc(db, "jobs", mrfId), jobData);

        // Update the MRF status to "Approved" and add the approvedAt timestamp
        await updateDoc(doc(db, "mrf_submissions", mrfId), { status: 'Approved', approvedAt });

        alert("MRF approved and job posted successfully!");
        closeModal();
        loadMRFs(); // Reload MRFs to reflect the updated status
    } catch (error) {
        console.error("Error approving MRF:", error);
        alert("There was an error approving the MRF. Please try again.");
    }
}

// Function to load all MRFs for HR to review
async function loadMRFs() {
    loadingIndicator.classList.remove('hidden'); // Show the loading indicator

    try {
        const querySnapshot = await getDocs(collection(db, 'mrf_submissions'));
        const mrfData = [];
        const companies = new Set();
        let approvedMRFCount = 0;
        let pendingMRFCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            mrfData.push({ id: doc.id, data });

            // Track unique companies
            companies.add(data.companyName);

            // Count approved and pending MRFs
            if (data.status === 'Approved') {
                approvedMRFCount++;
            } else if (data.status === 'Pending' || !data.status) {
                pendingMRFCount++;
            }
        });

        // Display the statistics
        document.getElementById('totalCompaniesCount').textContent = companies.size;
        document.getElementById('approvedMRFCount').textContent = approvedMRFCount;
        document.getElementById('pendingMRFCount').textContent = pendingMRFCount;

        renderMRFList(mrfData); // Initial render of the MRFs
        populateFilterOptions(mrfData); // Populate dynamic filter options

        // Event listeners for search and filters
        document.getElementById('searchInput').addEventListener('input', () => filterMRFList(mrfData));
        document.getElementById('companyFilter').addEventListener('change', () => filterMRFList(mrfData));
        document.getElementById('employmentTypeFilter').addEventListener('change', () => filterMRFList(mrfData));
        document.getElementById('statusFilter').addEventListener('change', () => filterMRFList(mrfData));

    } catch (error) {
        console.error("Error fetching MRFs:", error);
    } finally {
        loadingIndicator.classList.add('hidden'); // Hide the loading indicator
    }
}

function renderMRFList(mrfData) {
    mrfList.innerHTML = ''; // Clear the list
    mrfData.forEach(({ id, data }) => {
        const mrfItem = document.createElement('div');
        mrfItem.classList.add('bg-white', 'p-4', 'shadow', 'rounded-lg', 'flex', 'justify-between', 'items-center');
        mrfItem.innerHTML = `
            <div>
                <p><strong>Company Name:</strong> ${data.companyName}</p>
                <p><strong>Job Title:</strong> ${data.jobTitle}</p>
                <p><strong>Department:</strong> ${data.department}</p>
                <p><strong>Employment Type:</strong> ${data.employmentType}</p>
                <p><strong>Status:</strong> ${data.status || 'Pending'}</p>
                <p><strong>Submitted At:</strong> ${new Date(data.timestamp.seconds * 1000).toLocaleString()}</p>
            </div>
            <button class="view-details-btn bg-green-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" data-id="${id}">
                View Details
            </button>
        `;
        mrfList.appendChild(mrfItem);
    });
}

function filterMRFList(mrfData) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const company = document.getElementById('companyFilter').value;
    const employmentType = document.getElementById('employmentTypeFilter').value;
    const status = document.getElementById('statusFilter').value;

    const filteredMRFs = mrfData.filter(({ data }) => {
        const matchesSearch = data.jobTitle.toLowerCase().includes(searchTerm);
        const matchesCompany = !company || data.companyName === company;
        const matchesEmploymentType = !employmentType || data.employmentType === employmentType;
        const matchesStatus = !status || data.status === status;

        return matchesSearch && matchesCompany && matchesEmploymentType && matchesStatus;
    });

    renderMRFList(filteredMRFs);
}

function populateFilterOptions(mrfData) {
    const companies = new Set(mrfData.map(({ data }) => data.companyName));
    const employmentTypes = new Set(mrfData.map(({ data }) => data.employmentType));
    const statuses = new Set(mrfData.map(({ data }) => data.status || 'Pending'));

    const companyFilter = document.getElementById('companyFilter');
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company;
        option.textContent = company;
        companyFilter.appendChild(option);
    });

    const employmentTypeFilter = document.getElementById('employmentTypeFilter');
    employmentTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        employmentTypeFilter.appendChild(option);
    });

    const statusFilter = document.getElementById('statusFilter');
    statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });
}

// Close the modal
function closeModal() {
    modal.classList.add('hidden');
}

// Initialize the MRF loading process when the script runs
loadMRFs();

// Close modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target == modal) {
        closeModal();
    }
});
