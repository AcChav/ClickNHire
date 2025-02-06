import { auth, db } from '../db/firebase_init.js';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

emailjs.init("WVp8sLBHenluHgKhn");

let evaluations = []; // Make evaluations globally accessible

document.addEventListener("DOMContentLoaded", async () => {
    const evaluationList = document.getElementById('evaluation-list');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Monitor authentication state and fetch evaluations when ready
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Fetch evaluations for the logged-in user
                await fetchEvaluations(user.uid);
            } catch (error) {
                console.error('Error during evaluations fetch:', error);
            }
        } else {
            console.error('No logged-in user found.');
            // You can redirect to the login page if necessary
            window.location.href = '../../login.html';
        }
    });

    async function fetchEvaluations(loggedInUserId) {
        try {
            const evaluationsSnapshot = await getDocs(collection(db, 'evaluations'));
            const terminationsSnapshot = await getDocs(collection(db, 'terminations'));
            const redeploymentsSnapshot = await getDocs(collection(db, 'redeployments'));
            const regularizationsSnapshot = await getDocs(collection(db, 'regularizations'));

            const terminatedEmployeeIds = new Set();
            terminationsSnapshot.forEach(doc => {
                terminatedEmployeeIds.add(doc.data().employeeId);
            });

            const redeployedEmployeeIds = new Set();
            redeploymentsSnapshot.forEach(doc => {
                redeployedEmployeeIds.add(doc.data().employeeId);
            });

            const regularizedEmployeeIds = new Set();
            regularizationsSnapshot.forEach(doc => {
                regularizedEmployeeIds.add(doc.data().employeeId);
            });

            evaluations = [];
            evaluationsSnapshot.forEach(async (evaluationDoc) => {
                const evaluationData = evaluationDoc.data();

                if (evaluationData.submittedBy === loggedInUserId) {
                    const employeeName = evaluationData.employeeName;
                    const applicationDoc = await getDoc(doc(db, 'applications', employeeName));

                    if (applicationDoc.exists()) {
                        const applicationData = applicationDoc.data();
                        const userId = applicationData.userId;

                        if (userId) {
                            const userDoc = await getDoc(doc(db, 'users', userId));
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                const firstName = userData.firstName || 'Unknown';
                                const lastName = userData.lastName || 'Unknown';
                                const submittedDate = evaluationData.submittedAt.toDate().toLocaleDateString();
                                const submittedTime = evaluationData.submittedAt.toDate().toLocaleTimeString();

                                let totalAverage = 0;
                                let sectionCount = 0;

                                for (let sectionKey in evaluationData.evaluationData) {
                                    const sectionData = evaluationData.evaluationData[sectionKey];
                                    const totalScore = sectionData.reduce((sum, item) => sum + parseInt(item.answer), 0);
                                    const average = totalScore / sectionData.length;

                                    totalAverage += average;
                                    sectionCount++;
                                }

                                const grandAverage = (totalAverage / sectionCount).toFixed(2);
                                let grandAverageInterpretation = "Poor";

                                if (grandAverage >= 3.5) {
                                    grandAverageInterpretation = "Excellent";
                                } else if (grandAverage >= 2.5) {
                                    grandAverageInterpretation = "Good";
                                } else if (grandAverage >= 1.5) {
                                    grandAverageInterpretation = "Fair";
                                }

                                evaluations.push({
                                    id: evaluationDoc.id,
                                    firstName,
                                    lastName,
                                    employeeId: evaluationData.employeeId,
                                    submittedDate,
                                    submittedTime,
                                    grandAverage,
                                    grandInterpretation: grandAverageInterpretation,
                                    comments: evaluationData.comments,
                                    isTerminated: terminatedEmployeeIds.has(evaluationData.employeeId),
                                    isRedeployed: redeployedEmployeeIds.has(evaluationData.employeeId),
                                    isRegularized: regularizedEmployeeIds.has(evaluationData.employeeId),
                                });

                                displayEvaluations(evaluations);
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching evaluations:', error);
        }
    }

    // Display evaluations in the table
    function displayEvaluations(evaluations) {
        const evaluationList = document.getElementById('evaluation-list');
        evaluationList.innerHTML = ''; // Clear the list
    
        const sortedEvaluations = evaluations.sort((a, b) => {
            if (a.isTerminated === b.isTerminated) {
                return 0;
            }
            return a.isTerminated ? 1 : -1; // Place terminated employees last
        });
    
        if (sortedEvaluations.length === 0) {
            const noEvaluationsRow = document.createElement('tr');
            noEvaluationsRow.innerHTML = `
                <td colspan="7" class="text-center px-4 py-2 text-gray-500">
                    No evaluations available.
                </td>
            `;
            evaluationList.appendChild(noEvaluationsRow);
        } else {
            sortedEvaluations.forEach((evaluation) => {
                let status = 'ACTIVE';
                let statusColor = 'text-gray-500'; // Default color
    
                if (evaluation.isTerminated) {
                    status = 'TERMINATED';
                    statusColor = 'text-red-500 font-bold';
                } else if (evaluation.isRedeployed) {
                    status = 'REDEPLOYED';
                    statusColor = 'text-blue-500 font-bold';
                } else if (evaluation.isRegularized) {
                    status = 'REGULARIZED';
                    statusColor = 'text-green-500 font-bold';
                }
    
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border px-4 py-2">${evaluation.firstName} ${evaluation.lastName}</td>
                    <td class="border px-4 py-2">${evaluation.submittedDate} ${evaluation.submittedTime}</td>
                    <td class="border px-4 py-2">${evaluation.grandAverage} (${evaluation.grandInterpretation})</td>
                    <td class="border px-4 py-2">
                        <button 
                            class="bg-green-500 text-white px-4 py-2 rounded ${evaluation.isTerminated ? 'opacity-50 cursor-not-allowed' : ''}" 
                            onclick="${evaluation.isTerminated ? '' : `evaluateEmployee('${evaluation.id}')`}" 
                            ${evaluation.isTerminated ? 'disabled' : ''}>
                            Evaluate
                        </button>
                    </td>
                    <td class="border px-4 py-2 ${statusColor}">${status}</td>
                    <td class="border px-4 py-2">
                        <button 
                            class="bg-blue-500 text-white px-4 py-2 rounded" 
                            onclick="viewEvaluation('${evaluation.id}')">
                            View Details
                        </button>
                    </td>
                `;
                evaluationList.appendChild(row);
            });
        }
    }
     
    // Attach search button event listener
    searchButton.addEventListener('click', () => {
        const query = searchInput.value;
        filterEvaluations(query);
    });

    // Filter evaluations based on search query
    function filterEvaluations(query) {
        const filteredEvaluations = evaluations.filter(evaluation => {
            const fullName = `${evaluation.firstName} ${evaluation.lastName}`.toLowerCase();
            const company = evaluation.company.toLowerCase();
            const managerName = evaluation.managerName.toLowerCase();
            const searchQuery = query.toLowerCase();

            return fullName.includes(searchQuery) || company.includes(searchQuery) || managerName.includes(searchQuery);
        });

        displayEvaluations(filteredEvaluations);
    }
});

// Existing function to view the evaluation details
window.viewEvaluation = function (evaluationId) {
    sessionStorage.setItem('selectedEvaluationId', evaluationId);
    window.location.href = 'view_evaluation_details.html';
};

// Function to open the modal and populate it with data
window.evaluateEmployee = function (evaluationId) {
    const selectedEvaluation = evaluations.find(e => e.id === evaluationId); // Find the selected evaluation

    if (selectedEvaluation) {
        // Populate modal fields
        document.getElementById('modalEmployeeName').textContent = `${selectedEvaluation.firstName} ${selectedEvaluation.lastName}`;
        document.getElementById('modalCompany').textContent = selectedEvaluation.company;
        document.getElementById('modalGrandAverage').textContent = selectedEvaluation.grandAverage || 'N/A';
        document.getElementById('modalGrandInterpretation').textContent = selectedEvaluation.grandInterpretation || 'N/A';
        document.getElementById('modalComments').textContent = selectedEvaluation.comments || 'No comments available';

        // Dynamically create dropdown based on the interpretation
        const dropdown = document.getElementById('modalActionDropdown');
        dropdown.innerHTML = ''; // Clear previous options

        let options = [];
        let defaultOption = '';

        switch (selectedEvaluation.grandInterpretation.toLowerCase()) {
            case 'poor':
                options = ['Terminate', 'Redeploy'];
                defaultOption = 'Terminate';
                break;
            case 'fair':
            case 'good':
                options = ['Redeploy', 'Terminate'];
                defaultOption = 'Redeploy';
                break;
            case 'excellent':
                options = ['Regularize'];
                defaultOption = 'Regularize';
                break;
            default:
                options = ['No actions available'];
                defaultOption = 'No actions available';
        }

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            if (option === defaultOption) {
                opt.selected = true; // Set default option
            }
            dropdown.appendChild(opt);
        });

        // Show the modal
        const modal = document.getElementById('evaluationModal');
        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }
};

document.getElementById('proceedButton').addEventListener('click', () => {
    const selectedAction = document.getElementById('modalActionDropdown').value;

    if (selectedAction === 'Redeploy') {
        const redeploymentModal = document.getElementById('redeploymentModal');
        redeploymentModal.classList.remove('hidden');
        redeploymentModal.classList.add('visible');
    } else if (selectedAction === 'Terminate') {
        const terminationModal = document.getElementById('terminationModal');
        // Populate the termination modal with employee data
        const employeeName = document.getElementById('modalEmployeeName').textContent;
        document.getElementById('terminationEmployeeName').textContent = employeeName;

        terminationModal.classList.remove('hidden');
        terminationModal.classList.add('visible');
    } else if (selectedAction === 'Regularize') {
        const regularizationModal = document.getElementById('regularizationModal');
        const employeeName = document.getElementById('modalEmployeeName').textContent;
        document.getElementById('regularizationEmployeeName').textContent = employeeName;

        regularizationModal.classList.remove('hidden');
        regularizationModal.classList.add('visible');
    }
});

document.getElementById('closeTerminationModalButton').addEventListener('click', () => {
    const terminationModal = document.getElementById('terminationModal');
    terminationModal.classList.remove('visible');
    terminationModal.classList.add('hidden');
});

// Close Redeployment Modal
document.getElementById('closeRedeploymentModalButton').addEventListener('click', () => {
    const redeploymentModal = document.getElementById('redeploymentModal');
    redeploymentModal.classList.remove('visible');
    redeploymentModal.classList.add('hidden');
});

// Add event listener to close the modal
document.getElementById('closeModalButton').addEventListener('click', () => {
    const modal = document.getElementById('evaluationModal');
    modal.classList.remove('visible');
    modal.classList.add('hidden');
});

document.getElementById('terminationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const terminationDate = document.getElementById('terminationDate').value;
    const terminationReason = document.getElementById('terminationReason').value;
    const finalComments = document.getElementById('finalComments').value;
    const employeeName = document.getElementById('terminationEmployeeName').textContent.trim();

    console.log("Employee Name from Modal:", employeeName); // Debugging employee name
    console.log("Evaluations Array:", evaluations); // Debugging evaluations array

    // Match employee from evaluations array using employeeName
    const selectedEvaluation = evaluations.find(
        e => `${e.firstName} ${e.lastName}`.trim() === employeeName.trim() // Match based on full name
    );

    console.log("Selected Evaluation:", selectedEvaluation); // Debugging matched evaluation

    // Handle missing evaluation
    if (!selectedEvaluation) {
        alert(`No evaluation found for "${employeeName}". Please verify the data.`);
        console.error("Error: Employee name mismatch:", employeeName);
        return;
    }

    // Handle missing required fields
    if (!terminationDate || !terminationReason) {
        alert('Please fill in all required fields.');
        return;
    }

    // Handle missing employeeId
    if (!selectedEvaluation || !selectedEvaluation.employeeId) {
        console.error("Employee ID not found in evaluations for:", employeeName);
        console.log("Evaluations being searched:", evaluations);
        return;
    }

    try {
        // Fetch the employee's email dynamically
        const employeeDoc = await getDoc(doc(db, 'users', selectedEvaluation.employeeId));
        const employeeEmail = employeeDoc.exists() ? employeeDoc.data().email : null;

        if (!employeeEmail || !employeeEmail.includes("@")) {
            alert("Invalid or missing email address for the employee.");
            return;
        }

        // Save termination details in Firestore
        const terminationRef = await addDoc(collection(db, 'terminations'), {
            employeeName,
            employeeId: selectedEvaluation.employeeId,
            terminationDate,
            terminationReason,
            finalComments,
            emailSent: false, // Initial emailSent flag
            timestamp: new Date()
        });

        // Send termination email via EmailJS
        const emailParams = {
            to_email: employeeEmail,
            employeeName,
            terminationDate: new Date(terminationDate).toLocaleDateString(),
            terminationReason,
            finalComments
        };

        emailjs.send("service_khu467f", "termination_notification", emailParams)
            .then(async (response) => {
                // Update Firestore to mark the email as sent
                await updateDoc(terminationRef, {
                    emailSent: true
                });
                alert('Termination recorded and email notification sent!');
            })
            .catch(async (error) => {
                console.error("Error sending email:", error);

                // Leave emailSent as false
                alert('Termination recorded, but email notification failed.');
            });

        // Close the modal
        const evaluationModal = document.getElementById('evaluationModal');
        evaluationModal.classList.remove('visible');
        evaluationModal.classList.add('hidden');

        const terminationModal = document.getElementById('terminationModal');
        terminationModal.classList.remove('visible');
        terminationModal.classList.add('hidden');
    } catch (error) {
        console.error('Error recording termination:', error);
        alert('Failed to record termination. Please try again.');
    }
});

document.getElementById('redeploymentJobName').addEventListener('change', (event) => {
    const otherJobNameField = document.getElementById('otherJobName');
    if (event.target.value === 'Others') {
        otherJobNameField.classList.remove('hidden');
    } else {
        otherJobNameField.classList.add('hidden');
        otherJobNameField.value = ''; // Clear input when not in use
    }
});

// REDEPLOYMENT
document.getElementById('redeploymentForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const redeploymentDate = document.getElementById('redeploymentDate').value;
    const redeploymentLocation = document.getElementById('redeploymentLocation').value;
    const justification = document.getElementById('redeploymentJustification').value;
    const jobNameSelection = document.getElementById('redeploymentJobName').value;
    const otherJobName = document.getElementById('otherJobName').value;
    const employeeName = document.getElementById('modalEmployeeName').textContent;

    const selectedEvaluation = evaluations.find(
        e => `${e.firstName} ${e.lastName}`.trim() === employeeName.trim()
    );

    // Determine the final job name
    const jobName = jobNameSelection === 'Others' ? otherJobName : jobNameSelection;

    if (!redeploymentDate || !redeploymentLocation || !justification || !jobName) {
        alert('Please fill in all required fields.');
        return;
    }

    if (!selectedEvaluation || !selectedEvaluation.employeeId) {
        // alert('Unable to find employee ID for the selected employee.');
        return;
    }

    try {
        // Fetch the employee's email dynamically
        const employeeDoc = await getDoc(doc(db, 'users', selectedEvaluation.employeeId));
        const employeeEmail = employeeDoc.exists() ? employeeDoc.data().email : null;

        if (!employeeEmail || !employeeEmail.includes("@")) {
            alert("Invalid or missing email address for the employee.");
            return;
        }

        // Save redeployment details in Firestore
        const redeploymentCollection = collection(db, 'redeployments');
        const redeploymentDocRef = await addDoc(redeploymentCollection, {
            employeeName,
            redeploymentDate,
            redeploymentLocation,
            jobName,
            justification,
            employeeId: selectedEvaluation.employeeId,
            emailSent: false,
            timestamp: new Date()
        });

        // Get the specific document reference
        const redeploymentRef = doc(db, 'redeployments', redeploymentDocRef.id);

        // Send acknowledgment email via EmailJS
        const emailParams = {
            to_email: employeeEmail,
            to_name: employeeName,
            redeploymentLocation,
            redeploymentDate: new Date(redeploymentDate).toLocaleDateString(),
            justification
        };

        emailjs.send("service_khu467f", "template_lt1kcqr", emailParams)
            .then(async (response) => {

                // Update Firestore with email sent status
                await updateDoc(redeploymentRef, {
                    emailSent: true
                });
                alert('Redeployment data saved and acknowledgment email sent!');
            })
            .catch(async (error) => {
                console.error("Error sending email:", error);

                // Leave emailSent as false
                alert('Redeployment saved, but email notification failed.');
            });

        // Close the modal
        const evaluationModal = document.getElementById('evaluationModal');
        evaluationModal.classList.remove('visible');
        evaluationModal.classList.add('hidden');

        const redeploymentModal = document.getElementById('redeploymentModal');
        redeploymentModal.classList.remove('visible');
        redeploymentModal.classList.add('hidden');
    } catch (error) {
        console.error('Error saving redeployment data:', error);
        alert('Failed to save redeployment data.');
    }
});

document.getElementById('regularizationForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const regularizationDate = document.getElementById('regularizationDate').value;
    const regularizationComments = document.getElementById('regularizationComments').value;
    const employeeName = document.getElementById('regularizationEmployeeName').textContent;

    const selectedEvaluation = evaluations.find(
        e => `${e.firstName} ${e.lastName}`.trim() === employeeName.trim()
    );

    if (!regularizationDate) {
        alert('Please fill in the regularization date.');
        return;
    }

    if (!selectedEvaluation || !selectedEvaluation.employeeId) {
        // alert('Unable to find employee ID for the selected employee.');
        return;
    }

    try {
        // Save regularization details to Firestore
        const regularizationRef = await addDoc(collection(db, 'regularizations'), {
            employeeName,
            employeeId: selectedEvaluation.employeeId,
            regularizationDate,
            comments: regularizationComments,
            emailSent: false, // Initial emailSent flag
            timestamp: new Date()
        });

        console.log("Regularization recorded successfully!");

        // Send regularization email via EmailJS
        const emailParams = {
            to_email: selectedEvaluation.email, // Replace with the employee's email dynamically fetched
            employeeName,
            regularizationDate: new Date(regularizationDate).toLocaleDateString(),
            comments: regularizationComments
        };

        emailjs.send("service_khu467f", "template_rxck5sc", emailParams)
            .then(async (response) => {
                console.log("Email sent successfully:", response.status, response.text);

                // Update Firestore to mark the email as sent
                await updateDoc(regularizationRef, {
                    emailSent: true
                });
                console.log("EmailSent field updated in Firestore!");
                alert('Regularization recorded and email notification sent!');

                // Close the modal
                const evaluationModal = document.getElementById('evaluationModal');
                evaluationModal.classList.remove('visible');
                evaluationModal.classList.add('hidden');

                const regularizationModal = document.getElementById('regularizationModal');
                regularizationModal.classList.remove('visible');
                regularizationModal.classList.add('hidden');
            })
            .catch(async (error) => {
                console.error("Error sending email:", error);

                // Leave emailSent as false
                alert('Regularization recorded, but email notification failed.');
            });
    } catch (error) {
        console.error('Error saving regularization:', error);
        alert('Failed to save regularization. Please try again.');
    }
});
