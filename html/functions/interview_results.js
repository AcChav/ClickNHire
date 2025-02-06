import { db } from '../db/firebase_init.js';
import { doc, getDoc, updateDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Function to open the interview result modal
export function openInterviewResultModal(applicationId, currentStatus) {
    const interviewResultModal = document.getElementById('interviewResultModal');
    interviewResultModal.setAttribute('data-application-id', applicationId);
    interviewResultModal.setAttribute('data-current-status', currentStatus);
    interviewResultModal.classList.remove('hidden');
}

// Function to close the interview result modal
export function closeInterviewResultModal() {
    const interviewResultModal = document.getElementById('interviewResultModal');
    interviewResultModal.classList.add('hidden');
    interviewResultModal.removeAttribute('data-application-id');
    interviewResultModal.removeAttribute('data-current-status');
}

// Function to update the interview result in the Firestore database
async function updateInterviewResult(applicationId, result) {
    try {
        const applicationRef = doc(db, "applications", applicationId);
        let updateData;

        if (result === 'Interview Passed') {
            const currentStatus = document.getElementById('interviewResultModal').getAttribute('data-current-status');
            if (currentStatus === 'Initial Interview') {
                updateData = { interviewType: 'Second Interview' };
            } else if (currentStatus === 'Second Interview') {
                updateData = { interviewType: 'Second Interview', status: 'Interview Passed' };
            }
        } else if (result === 'Interview Failed') {
            updateData = { status: 'Rejected' };
        }

        await updateDoc(applicationRef, updateData);
        alert(`Applicant has been marked as ${result}.`);

        closeInterviewResultModal();
        location.reload(); // Reload the page to reflect the changes
    } catch (error) {
        console.error("Error updating interview result: ", error);
        alert("Failed to update interview result.");
    }
}

// Event listener for the "Pass" button in the interview result modal
document.getElementById('interviewPassedButton').onclick = async () => {
    const applicationId = document.getElementById('interviewResultModal').getAttribute('data-application-id');
    await updateInterviewResult(applicationId, 'Interview Passed');
};

// Event listener for the "Fail" button in the interview result modal
document.getElementById('interviewFailedButton').onclick = () => {
    const interviewResultModal = document.getElementById('interviewResultModal');
    const rejectionReasonModal = document.getElementById('rejectionReasonModal');

    // Get application ID from the interview result modal
    const applicationId = interviewResultModal.getAttribute('data-application-id');

    // Store application ID on the rejection reason modal
    rejectionReasonModal.setAttribute('data-application-id', applicationId);

    // Hide the interview result modal and show the rejection reason modal
    interviewResultModal.classList.add('hidden');
    rejectionReasonModal.classList.remove('hidden');
};

// Handle rejection reason submission
document.getElementById('submitRejectionReasonButton').onclick = async () => {
    const rejectionReasonModal = document.getElementById('rejectionReasonModal');
    const applicationId = rejectionReasonModal.getAttribute('data-application-id');
    const rejectionReason = document.getElementById('rejectionReasonInput').value;

    if (!rejectionReason.trim()) {
        alert("Please provide a rejection reason.");
        return;
    }

    try {
        const applicationRef = doc(db, "applications", applicationId);

        // Update Firestore with rejection status and reason
        await updateDoc(applicationRef, {
            status: 'Rejected',
            rejectionReason: rejectionReason.trim()
        });

        alert("Rejection reason has been recorded.");
        rejectionReasonModal.classList.add('hidden');
        location.reload(); // Reload the page to reflect changes
    } catch (error) {
        console.error("Error updating rejection reason: ", error);
        alert("Failed to record rejection reason.");
    }
};

// Handle modal cancel action
document.getElementById('closeRejectionReasonModal').onclick = () => {
    const rejectionReasonModal = document.getElementById('rejectionReasonModal');
    rejectionReasonModal.classList.add('hidden');
};

// Event listener for the "Close" button in the interview result modal
document.getElementById('closeInterviewResultModal').onclick = () => {
    closeInterviewResultModal();
};
