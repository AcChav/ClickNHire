import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js"; // Firestore imports
import  db  from '../db/firebase_firestore.js';
import { auth } from '../db/firebase_init.js'; // Firebase auth

// Function to initialize the rejection modal logic
export function initRejectionModal(screeningApplicantName, jobDoc, applicationId) {
    const rejectionModal = document.getElementById('rejectionModal'); // The new rejection modal
    const closeRejectionModalButton = document.getElementById('closeRejectionModalButton'); // Close button
    const submitRejectionButton = document.getElementById('submitRejectionButton'); // Submit button
    const rejectedApplicantName = document.getElementById('rejectedApplicantName'); // Display applicant name
    const rejectionReasonInput = document.getElementById('rejectionReason'); // Textarea for rejection reason

    // Show rejection modal and set applicant name
    rejectedApplicantName.textContent = screeningApplicantName; 
    rejectionModal.classList.remove('hidden');

    // Close the modal when close button is clicked
    closeRejectionModalButton.onclick = () => {
        rejectionModal.classList.add('hidden');
    };

    // Submit rejection reason
    submitRejectionButton.onclick = async () => {
        const rejectionReason = rejectionReasonInput.value.trim();
        if (!rejectionReason) {
            alert("Please provide a reason for rejection.");
            return;
        }

        try {
            const rejectionData = {
                reason: rejectionReason,
                rejectedBy: auth.currentUser.uid,
                applicantName: screeningApplicantName,
                jobTitle: jobDoc.title,
                date: new Date().toISOString(),
            };

            // Update Firestore with rejection data
            await updateDoc(doc(db, "applications", applicationId), {
                status: 'Rejected',
                rejectionDetails: rejectionData,
            });

            alert("Application rejected successfully.");
            rejectionModal.classList.add('hidden'); // Hide the modal after success
            window.location.reload(); // Refresh the page
        } catch (error) {
            console.error("Error rejecting application: ", error);
            alert("Failed to reject the application. Please try again.");
        }
    };
}
