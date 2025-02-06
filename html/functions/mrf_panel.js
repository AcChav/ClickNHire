// functions/mrf_panel.js

import { db } from '../db/firebase_init.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';
import { renderJobDetailsModal } from './job_details.js';
const mrfList = document.getElementById('mrf-list');
const loadingIndicator = document.getElementById('loadingIndicator');
const modal = document.getElementById('detailsModal');

emailjs.init("WVp8sLBHenluHgKhn");

// Function to send an email notification
async function sendEmailNotification(templateId, params, mrfId) {
    try {
        await emailjs.send("service_khu467f", templateId, params);

        // Update Firestore to mark email as sent
        await updateDoc(doc(db, "mrf_submissions", mrfId), {
            emailSent: true,
        });

        console.log("Email sent successfully and emailSent flag updated.");
    } catch (error) {
        console.error("Error sending email:", error);
        alert("Failed to send email notification.");
    }
}

// Function to approve the MRF and post it as a job
async function approveMRF(mrfDoc, mrfId) {
    const data = mrfDoc.data();

    // Check if email has already been sent
    if (data.emailSent) {
        console.log("Email notification already sent for this MRF.");
        return;
    }

    const jobData = {
        title: data.jobTitle || 'Not specified',
        company: data.companyName || 'Not specified',
        location: `${data.region || 'Not specified'}, ${data.province || 'Not specified'}, ${data.city || 'Not specified'}, ${data.barangayStreet || 'Not specified'}`,
        employmentType: data.employmentType || 'Not specified',
        description: data.jobDescription || 'Not specified',
        salaryRange: data.salaryRange || 'Not specified',
        numberOfPositions: data.numberOfPositions || 'Not specified',
        numberOfMales: data.numberOfMales || '0',
        numberOfFemales: data.numberOfFemales || '0',
        requiredExperience: data.requiredExperience || 'Not specified',
        educationLevel: data.educationLevel || 'Not specified',
        skills: data.skills || 'Not specified',
        qualifications: data.qualifications || 'Not specified',
        contactPerson: data.contactPerson || 'Not specified',
        contactEmail: data.contactEmail || 'Not specified',
        contactPhone: data.contactPhone || 'Not specified',
        gender: data.gender || 'Not specified',
        timestamp: new Date(),
    };

    const approvedAt = new Date();

    try {
        // Add the job data to the "jobs" collection in Firestore
        await setDoc(doc(db, "jobs", mrfId), jobData);

        // Update the MRF status to "Approved" and add the approvedAt timestamp
        await updateDoc(doc(db, "mrf_submissions", mrfId), { status: 'Approved', approvedAt });

        alert("MRF approved and job posted successfully!");
        closeModal();
        loadMRFs(); // Reload MRFs to reflect the updated status

        // Send email notification for approval
        const emailParams = {
            to_email: data.contactEmail,
            job_title: data.jobTitle,
            company_name: data.companyName,
            approval_date: approvedAt.toLocaleString(),
        };

        sendEmailNotification("template_2hxucen", emailParams);

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
        let rejectedMRFCount = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            mrfData.push({ id: doc.id, data });

            // Track unique companies
            companies.add(data.companyName);

            // Count approved, pending, and rejected MRFs
            if (data.status === 'Approved') {
                approvedMRFCount++;
            } else if (data.status === 'Pending' || !data.status) {
                pendingMRFCount++;
            } else if (data.status === 'Rejected') {
                rejectedMRFCount++;
            }
        });

        // Display the statistics
        document.getElementById('totalCompaniesCount').textContent = companies.size;
        document.getElementById('approvedMRFCount').textContent = approvedMRFCount;
        document.getElementById('pendingMRFCount').textContent = pendingMRFCount;
        document.getElementById('rejectedMRFCount').textContent = rejectedMRFCount;

        // Sort MRFs by status: Pending first, then Approved, then Rejected
        mrfData.sort((a, b) => {
            const statusOrder = { 'Pending': 1, 'Approved': 2, 'Rejected': 3 };
            const statusA = a.data.status || 'Pending'; // Default to 'Pending' if status is undefined
            const statusB = b.data.status || 'Pending'; // Default to 'Pending' if status is undefined
            return statusOrder[statusA] - statusOrder[statusB];
        });

        renderMRFList(mrfData); // Render the sorted list
        // Initial render of the MRFs
        populateFilterOptions(mrfData); // Populate dynamic filter options

        // Event listeners for search and filters
        document.getElementById('searchInput').addEventListener('input', () => filterMRFList(mrfData));
        document.getElementById('companyFilter').addEventListener('change', () => filterMRFList(mrfData));
        document.getElementById('employmentTypeFilter').addEventListener('change', () => filterMRFList(mrfData));
        document.getElementById('statusFilter').addEventListener('change', () => filterMRFList(mrfData));

        // Add event listeners to the "View Details" buttons
        document.querySelectorAll('.view-details-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const docId = e.target.getAttribute('data-id');
                const docRef = doc(db, 'mrf_submissions', docId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    renderJobDetailsModal(data);

                    const actionContainer = modal.querySelector('.flex.justify-end') || document.createElement('div');
                    actionContainer.className = 'flex justify-end mt-4';
                    modal.querySelector('#modalContent').appendChild(actionContainer);

                    // Approve Button Logic
                    let approveButton = document.getElementById('approveButton');
                    if (!approveButton) {
                        approveButton = document.createElement('button');
                        approveButton.id = 'approveButton';
                        approveButton.className = 'bg-green-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';
                        approveButton.textContent = 'Approve';
                        actionContainer.appendChild(approveButton);
                    }
                    approveButton.onclick = () => {
                        console.log('Approve button clicked');
                        approveMRF(docSnap, docId);
                    };

                    // Disapprove Button Logic
                    let disapproveButton = document.getElementById('disapproveButton');
                    if (!disapproveButton) {
                        disapproveButton = document.createElement('button');
                        disapproveButton.id = 'disapproveButton';
                        disapproveButton.className = 'bg-red-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-2';
                        disapproveButton.textContent = 'Disapprove';
                        actionContainer.appendChild(disapproveButton);
                    }

                    disapproveButton.onclick = () => {
                        console.log('Disapprove button clicked');
                        const rejectionModal = document.getElementById('rejectionModal');
                        if (rejectionModal) {
                            rejectionModal.classList.remove('hidden'); // Show the rejection modal

                            // Add an event listener to the submit button with the correct mrfId
                            const submitRejectionReason = document.getElementById('submitRejectionReason');
                            submitRejectionReason.onclick = async () => {
                                const rejectionReason = document.getElementById('rejectionReason').value.trim();
                                if (!rejectionReason) {
                                    alert("Please provide a reason for rejection.");
                                    return;
                                }

                                try {
                                    await updateDoc(doc(db, "mrf_submissions", docId), {
                                        status: 'Rejected',
                                        rejectionReason: rejectionReason,
                                        rejectedAt: new Date(), // Add the rejected timestamp
                                    });

                                    alert("MRF rejected successfully.");
                                    rejectionModal.classList.add('hidden'); // Hide the rejection modal
                                    closeModal(); // Close the details modal
                                    loadMRFs(); // Reload the MRF list to reflect changes
                                } catch (error) {
                                    console.error("Error rejecting MRF:", error);
                                    alert("Failed to reject MRF. Please try again.");
                                }
                            };
                        } else {
                            console.error("Rejection modal not found");
                        }
                    };

                    // Submit Rejection Reason Logic
                    const submitRejectionReason = document.getElementById('submitRejectionReason');
                    submitRejectionReason.onclick = async () => {
                        const rejectionReason = document.getElementById('rejectionReason').value.trim();
                        const rejectionModal = document.getElementById('rejectionModal');

                        if (!rejectionReason) {
                            alert("Please provide a reason for rejection.");
                            return;
                        }

                        try {
                            await updateDoc(doc(db, "mrf_submissions", mrfId), {
                                status: 'Rejected',
                                rejectionReason: rejectionReason,
                                rejectedAt: new Date(), // Add the rejected timestamp
                            });

                            alert("MRF rejected successfully.");
                            rejectionModal.classList.add('hidden'); // Hide the rejection modal
                            closeModal(); // Close the details modal
                            loadMRFs(); // Reload the MRF list to reflect changes
                        } catch (error) {
                            console.error("Error rejecting MRF:", error);
                            alert("Failed to reject MRF. Please try again.");
                        }
                    };

                    // Show or hide buttons based on MRF status
                    if (data.status === 'Pending' || !data.status) {
                        approveButton.classList.remove('hidden');
                        disapproveButton.classList.remove('hidden');
                    } else {
                        approveButton.classList.add('hidden');
                        disapproveButton.classList.add('hidden');
                    }

                    modal.classList.remove('hidden'); // Show the modal
                } else {
                    alert('No such document!');
                }
            });
        });

    } catch (error) {
        console.error('Error fetching MRFs:', error);
    } finally {
        loadingIndicator.classList.add('hidden'); // Hide the loading indicator
    }
}

function renderMRFList(mrfData) {
    mrfList.innerHTML = ''; // Clear the list
    mrfData.forEach(({ id, data }) => {
        const mrfItem = document.createElement('div');
        mrfItem.classList.add('bg-white', 'p-4', 'shadow', 'border', 'border-gray-300', 'rounded-lg', 'flex', 'justify-between', 'items-center');
        mrfItem.innerHTML = `
            <div>
                <p><strong>Company Name:</strong> ${data.companyName}</p>
                <p><strong>Job Title:</strong> ${data.jobTitle}</p>
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

// Function to disapprove the MRF
async function disapproveMRF(mrfDoc, mrfId) {
    const rejectionReason = document.getElementById('rejectionReason').value;
    if (!rejectionReason) {
        alert("Please provide a reason for rejection.");
        return;
    }

    try {
        // Update the MRF status to "Rejected" and add rejectionReason and rejectedAt fields
        await updateDoc(doc(db, "mrf_submissions", mrfId), {
            status: 'Rejected',
            rejectionReason: rejectionReason,
            rejectedAt: new Date(),  // Add rejected timestamp
        });

        alert("MRF has been disapproved.");
        document.getElementById('rejectionModal').classList.add('hidden');
        closeModal();
        loadMRFs(); // Reload MRFs to reflect the updated status

        // Hide the approve and disapprove buttons
        document.getElementById('approveButton').classList.add('hidden');
        document.getElementById('disapproveButton').classList.add('hidden');
    } catch (error) {
        console.error("Error disapproving MRF:", error);
        alert("There was an error disapproving the MRF. Please try again.");
    }
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
