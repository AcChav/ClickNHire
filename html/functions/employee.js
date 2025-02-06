import { db, auth } from '../db/firebase_init.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc } from 'https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js';

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Define UI elements
            const interviewPassedList = document.getElementById('interviewPassedList');
            const employeesList = document.getElementById('employeesList');
            const confirmationModal = document.getElementById('confirmationModal');
            const confirmButton = document.getElementById('confirmButton');
            const cancelButton = document.getElementById('cancelButton');
            const deploymentDetailsModal = document.getElementById('deploymentDetailsModal');
            const deploymentConfirmButton = document.getElementById('deploymentConfirmButton');
            const deploymentDateInput = document.getElementById('deploymentDate');
            const deploymentLocationInput = document.getElementById('deploymentLocation');
            const viewDeploymentDetailsModal = document.getElementById('viewDeploymentDetailsModal');
            const viewDeploymentDateInput = document.getElementById('viewDeploymentDate');
            const viewDeploymentLocationInput = document.getElementById('viewDeploymentLocation');
            const closeViewDeploymentDetailsButton = document.getElementById('closeViewDeploymentDetailsButton');
            let currentApplicantId = null;
            let decision = null;
            let currentJobId = null;
            let currentUserId = null;

            // Function to fetch district managers and populate the dropdown
            async function populateDistrictManagers() {
                const districtManagerSelect = document.getElementById('districtManagerSelect');
                const managerEmailInput = document.getElementById('managerEmail');

                // Fetch district managers from Firestore
                const districtManagersQuery = query(collection(db, 'users'), where('role', '==', 'district-manager'));
                const districtManagersSnapshot = await getDocs(districtManagersQuery);

                districtManagerSelect.innerHTML = ''; // Clear existing options

                districtManagersSnapshot.forEach(doc => {
                    const data = doc.data();
                    const option = document.createElement('option');
                    option.value = data.email;
                    option.textContent = `${data.firstName} ${data.lastName}`;
                    districtManagerSelect.appendChild(option);
                });

                // Display the email of the selected district manager
                districtManagerSelect.addEventListener('change', () => {
                    managerEmailInput.value = districtManagerSelect.value;
                });

                // Trigger change event to display email of the first district manager
                if (districtManagerSelect.options.length > 0) {
                    districtManagerSelect.dispatchEvent(new Event('change'));
                }
            }

            // Show the confirmation modal
            const showModal = (applicantId, action, userId, jobId) => {
                currentApplicantId = applicantId;
                decision = action;
                currentUserId = userId;
                currentJobId = jobId;
                document.getElementById('modalMessage').textContent = `Are you sure you want to ${action} this applicant?`;
                confirmationModal.classList.remove('hidden');
            };

            // Hide the confirmation modal
            const hideModal = () => {
                confirmationModal.classList.add('hidden');
                currentApplicantId = null;
                decision = null;
            };

            // Show the deployment details modal for setting details
            const showDeploymentDetailsModal = () => {
                populateDistrictManagers(); // Load district managers
                deploymentDetailsModal.classList.remove('hidden');
            };

            // Hide the deployment details modal for setting details
            const hideDeploymentDetailsModal = () => {
                deploymentDetailsModal.classList.add('hidden');
            };

            // Show the modal to view deployment details
            const showViewDeploymentDetailsModal = () => {
                viewDeploymentDetailsModal.classList.remove('hidden');
            };

            // Hide the modal to view deployment details
            const hideViewDeploymentDetailsModal = () => {
                viewDeploymentDetailsModal.classList.add('hidden');
            };

            // Event Listener for Cancel Button in the Deployment Details Modal
            const deploymentCancelButton = document.getElementById('deploymentCancelButton');
            deploymentCancelButton.addEventListener('click', () => {
                hideDeploymentDetailsModal();
            });

            // Event Listener for Cancel Button in the Confirmation Modal
            cancelButton.addEventListener('click', () => {
                hideModal();
            });

            // Event Listener for Confirm Button in the Confirmation Modal
            confirmButton.addEventListener('click', async () => {
                if (currentApplicantId && decision) {
                    const newStatus = decision === 'accept' ? 'Employee' : 'Rejected';
                    const applicationRef = doc(db, 'applications', currentApplicantId);

                    const updateData = { status: newStatus };

                    // Add isDecremented flag if the status is Employee
                    if (newStatus === 'Employee') {
                        updateData.isDecremented = false;
                    }

                    // Update the application document
                    await updateDoc(applicationRef, updateData);

                    hideModal();

                    if (newStatus === 'Employee') {
                        showDeploymentDetailsModal();
                    } else {
                        location.reload();  // Refresh the page to reflect the changes
                    }
                }
            });

            // Event Listener for Deployment Confirm Button
            deploymentConfirmButton.addEventListener('click', async (event) => {
                event.preventDefault();

                const deploymentDate = deploymentDateInput.value;
                const deploymentLocation = deploymentLocationInput.value;
                const selectedManagerEmail = document.getElementById('managerEmail').value;

                if (currentUserId && currentJobId && deploymentDate && deploymentLocation && selectedManagerEmail) {
                    // Add deployment details to the 'deployments' collection and use the document ID as the employee ID
                    const deploymentRef = await addDoc(collection(db, 'deployments'), {
                        userId: currentUserId,
                        jobId: currentJobId,
                        deploymentDate: deploymentDate,
                        deploymentLocation: deploymentLocation,
                        managerEmail: selectedManagerEmail
                    });

                    const employeeId = deploymentRef.id; // Use the document ID as the employee ID

                    // Optionally update the user document with the new employeeId
                    await updateDoc(doc(db, 'users', currentUserId), {
                        employeeId: employeeId,
                    });

                    hideDeploymentDetailsModal();
                    location.reload();  // Refresh the page to reflect the changes
                } else {
                    alert('Please fill in all deployment details.');
                }
            });

            // Event Listener to View Deployment Details
            document.addEventListener('click', async function (event) {
                if (event.target.classList.contains('viewDeploymentDetailsButton')) {
                    const deploymentDocId = event.target.dataset.deploymentDocId;

                    console.log('Fetching deployment details for documentId:', deploymentDocId);  // Log documentId for debugging

                    // Fetch deployment details using the document ID
                    const deploymentDoc = await getDoc(doc(db, 'deployments', deploymentDocId));
                    if (deploymentDoc.exists()) {
                        const deploymentData = deploymentDoc.data();

                        // Log the fetched deployment details for debugging
                        console.log('Deployment Data:', deploymentData);

                        viewDeploymentDateInput.value = deploymentData.deploymentDate;
                        viewDeploymentLocationInput.value = deploymentData.deploymentLocation;

                        // Display the list of requirements
                        const requirementsList = `
                            <ul class="list-disc pl-6">
                                <li>NBI Clearance</li>
                                <li>Police Clearance</li>
                                <li>Barangay Clearance</li>
                                <li>Medical Certificate</li>
                                <li>Birth Certificate (PSA)</li>
                                <li>SSS, PhilHealth, and Pag-IBIG Memberships</li>
                                <li>Certificate of Employment (if applicable)</li>
                                <li>Proof of Residence</li>
                                <li>TIN (Tax Identification Number)</li>
                                <li>Passport (for overseas work)</li>
                            </ul>
                        `;
                        document.getElementById('requirementsList').innerHTML = requirementsList;

                        showViewDeploymentDetailsModal();
                    } else {
                        console.log('No deployment details found for documentId:', deploymentDocId);  // Log when no details are found
                        alert('No deployment details found.');
                    }
                }
            });

            // Event Listener for Closing the View Deployment Details Modal
            closeViewDeploymentDetailsButton.addEventListener('click', () => {
                hideViewDeploymentDetailsModal();
            });

            // Event Delegation for Accept/Reject Buttons
            document.addEventListener('click', function (event) {
                if (event.target.classList.contains('acceptButton')) {
                    const applicantId = event.target.dataset.id;
                    const jobId = event.target.dataset.jobId;
                    const userId = event.target.dataset.userId;
                    showModal(applicantId, 'accept', userId, jobId);
                } else if (event.target.classList.contains('rejectButton')) {
                    const applicantId = event.target.dataset.id;
                    showModal(applicantId, 'reject');
                }
            });

            // Fetch and display employees and applicants
            try {
                const approvedMRFQuery = query(
                    collection(db, 'mrf_submissions'),
                    where('client_id', '==', user.uid),
                    where('approvedAt', '!=', null)
                );
                const approvedMRFSnapshot = await getDocs(approvedMRFQuery);

                if (approvedMRFSnapshot.empty) {
                    const noResults = document.createElement('li');
                    noResults.textContent = 'No approved MRFs found for this client.';
                    interviewPassedList.appendChild(noResults);
                } else {
                    const companyNames = new Set();
                    approvedMRFSnapshot.forEach(doc => {
                        const companyName = doc.data().companyName;
                        if (companyName) companyNames.add(companyName);
                    });

                    if (companyNames.size > 0) {
                        const jobsQuery = query(
                            collection(db, 'jobs'),
                            where('company', 'in', Array.from(companyNames))
                        );
                        const jobsSnapshot = await getDocs(jobsQuery);
                        const jobIds = [];

                        jobsSnapshot.forEach(jobDoc => jobIds.push(jobDoc.id));

                        if (jobIds.length > 0) {
                            const applicationsQuery = query(
                                collection(db, 'applications'),
                                where('jobId', 'in', jobIds)
                            );
                            const applicationsSnapshot = await getDocs(applicationsQuery);

                            if (applicationsSnapshot.empty) {
                                const noResults = document.createElement('li');
                                noResults.textContent = 'No applicants found for these jobs.';
                                interviewPassedList.appendChild(noResults);
                            } else {
                                applicationsSnapshot.forEach(async (docSnap) => {
                                    const data = docSnap.data();
                                    const userId = data.userId;
                                    const jobId = data.jobId;
                                    const applicationId = docSnap.id;

                                    const userDoc = await getDoc(doc(db, 'users', userId));
                                    const userData = userDoc.exists() ? userDoc.data() : null;
                                    const fullName = userData ? `${userData.firstName} ${userData.lastName}` : 'Unknown';
                                    const email = userData ? userData.email : 'No Email Provided';

                                    const jobDoc = await getDoc(doc(db, 'jobs', jobId));
                                    const jobData = jobDoc.exists() ? jobDoc.data() : null;
                                    const jobTitle = jobData ? jobData.jobTitle || jobData.title || 'N/A' : 'N/A';

                                    const deploymentQuery = query(collection(db, 'deployments'), where('userId', '==', userId), where('jobId', '==', jobId));
                                    const deploymentSnapshot = await getDocs(deploymentQuery);

                                    let deploymentDocId = '';
                                    if (!deploymentSnapshot.empty) {
                                        deploymentDocId = deploymentSnapshot.docs[0].id;
                                    }

                                    const listItem = document.createElement('li');
                                    listItem.className = 'p-4 bg-gray-100 rounded-lg border border-gray-300 shadow flex items-center justify-between';

                                    listItem.innerHTML = `
                                        <div>
                                            <h4 class="text-lg font-bold">${fullName}</h4>
                                            <p>Job Title: ${jobTitle}</p>
                                            <p>Status: ${data.status}</p>
                                            <p>Email: <a href="mailto:${email}" class="text-blue-500 hover:underline">${email}</a></p>
                                        </div>
                                        <div class="flex space-x-4">
                                            ${data.status === 'Interview Passed' ? `
                                                <button data-id="${applicationId}" data-user-id="${userId}" data-job-id="${jobId}" class="acceptButton bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">Accept</button>
                                                <button data-id="${applicationId}" class="rejectButton bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">Reject</button>
                                            ` : `
                                                <button data-deployment-doc-id="${deploymentDocId}" class="viewDeploymentDetailsButton bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
                                                    View Deployment Details
                                                </button>
                                            `}
                                        </div>
                                    `;

                                    if (data.status === 'Interview Passed') {
                                        interviewPassedList.appendChild(listItem);
                                    } else if (data.status === 'Employee') {
                                        employeesList.appendChild(listItem);
                                    }
                                });
                            }
                        } else {
                            const noJobs = document.createElement('li');
                            noJobs.textContent = 'No jobs found for the approved MRFs.';
                            interviewPassedList.appendChild(noJobs);
                        }
                    }
                }
            } catch (error) {
                const errorItem = document.createElement('li');
                errorItem.textContent = 'Failed to load applicants.';
                interviewPassedList.appendChild(errorItem);
            }
        } else {
            window.location.href = 'login.html';
        }
    });
});
