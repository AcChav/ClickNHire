import { auth } from '../db/firebase_init.js';
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { applyForJob } from '../functions/apply.js';

const db = getFirestore();  // Initialize Firestore

// Function to render the job details modal
export async function renderJobDetailsModal(data, showButtons = false, showTimestamp = true) {
    const modalContent = document.getElementById('modalContent');
    const db = getFirestore();

    // Determine location using multiple fields if necessary
    const location = data.location || `${data.region || ''} ${data.province || ''} ${data.city || ''} ${data.barangayStreet || ''}`.trim() || 'Not specified';

    // Format the number of positions based on gender and count
    let numberOfPositionsFormatted = 'Not specified';
    if (data.gender === 'Both gender') {
        numberOfPositionsFormatted = `${data.numberOfFemales || 0} Females & ${data.numberOfMales || 0} Males`;
    } else if (data.gender === 'Male' || data.gender === 'Female') {
        numberOfPositionsFormatted = `${data.numberOfPositions || 0}`;
    }

    // Fetch the role of the current user
    let userRole = null;
    const user = auth.currentUser;
    if (user) {
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDocRef);
            if (userSnapshot.exists()) {
                userRole = userSnapshot.data().role; // Assuming role field exists in user document
                console.log("User role:", userRole);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
        }
    }

    // Render the modal content with job details
    modalContent.innerHTML = `
        <h2 class="text-xl font-bold mb-4">Job Details</h2>
        <div class="space-y-2">
            <div>
                <p><strong>Company Name:</strong> ${data.companyName || data.company || 'Not specified'}</p>
                <p><strong>Contact Person:</strong> ${data.contactPerson || 'Not specified'}</p>
                <p><strong>Contact Email:</strong> ${data.contactEmail || 'Not specified'}</p>
                <p><strong>Contact Phone:</strong> ${data.contactPhone || 'Not specified'}</p>
            </div>
            <div>
                <p><strong>Job Title:</strong> ${data.jobTitle || data.title || 'Not specified'}</p>
                <p><strong>Employment Type:</strong> ${data.employmentType || 'Not specified'}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Salary Range:</strong> ${data.salaryRange || 'Not specified'}</p>
                <p><strong>Sex:</strong> ${data.gender || 'Not specified'}</p>
            </div>
            <div>
                <p><strong>Number of Positions:</strong> ${numberOfPositionsFormatted}</p>
                <p><strong>Required Experience:</strong> ${data.requiredExperience || 'Not specified'} years</p>
                <p><strong>Education:</strong> ${data.educationLevel || 'Not specified'}</p>
            </div>
            <div>
                <p><strong>Job Description:</strong> ${data.description || data.jobDescription || 'Not specified'}</p>
                <p><strong>Skills:</strong> ${data.skills || 'Not specified'}</p>
                <p><strong>Qualifications:</strong> ${data.qualifications || 'Not specified'}</p>
            </div>
            ${userRole === 'hr' || userRole === 'client' ? `
            <div>
                <p><strong>Status:</strong> ${data.status || 'Pending'}</p>
                ${data.status === 'Rejected' ? `<p><strong>Rejection Reason:</strong> ${data.rejectionReason || 'Not specified'}</p>` : ''}
                ${data.status === 'Rejected' ? `<p><strong>Rejected At:</strong> ${data.rejectedAt ? new Date(data.rejectedAt.seconds * 1000).toLocaleString() : 'Not specified'}</p>` : ''}
                ${showTimestamp ? `<p><strong>Submitted At:</strong> ${data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleString() : 'Not specified'}</p>` : ''}
            </div>` : ''}
        </div>
        <div class="mt-2 flex justify-between">
            ${showButtons ? '<button id="closeModal" class="text-red-500 hover:bg-red-200 py-2 px-4 rounded-md">Close</button>' : ''}
            ${showButtons ? '<button id="applyNow" class="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">Apply Now</button>' : ''}
        </div>
    `;

    document.getElementById('detailsModal').classList.remove('hidden'); // Show the modal

    // Attach event listeners to the buttons
    if (showButtons) {
        const closeModalButton = document.getElementById('closeModal');
        if (closeModalButton) {
            closeModalButton.addEventListener('click', () => {
                document.getElementById('detailsModal').classList.add('hidden');
            });
        }

        const applyNowButton = document.getElementById('applyNow'); // Get the Apply Now button
        applyNowButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to apply for this job?')) {
                if (data.jobId) {
                    await applyForJob(data.jobId); // Ensure jobId is passed correctly
                } else {
                    console.error('Job ID is missing');
                    alert('An error occurred. Please try again later.');
                }
            }
        });
    }
}

