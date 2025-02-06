// Import necessary Firebase services
import db from '../db/firebase_firestore.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js'; // Import the loading function

document.addEventListener('DOMContentLoaded', function () {

    // Function to fetch job details based on jobId
    async function fetchJobDetails(jobId) {
        const jobDocRef = doc(db, "jobs", jobId);
        const jobDoc = await getDoc(jobDocRef);
        if (jobDoc.exists()) {
            return jobDoc.data();
        }
        return { title: "Unknown Job", company: "Unknown Company" };
    }

    // Function to fetch applications for the current user
    async function fetchApplications(user) {
        const q = query(collection(db, "applications"), where("userId", "==", user.uid));
        return await getDocs(q);
    }

    // Function to load application status and display it in the modal
    async function loadApplicationStatus(applicationId) {
        try {
            toggleLoadingState(true); // Show loading indicator
            const applicationDocRef = doc(db, "applications", applicationId);
            const applicationDoc = await getDoc(applicationDocRef);

            if (applicationDoc.exists()) {
                const applicationData = applicationDoc.data();
                const jobData = await fetchJobDetails(applicationData.jobId);

                // Update modal content with job and application details
                document.getElementById('statusJobTitle').textContent = jobData.title || 'N/A';
                document.getElementById('statusCompany').textContent = jobData.company || 'N/A';
                document.getElementById('statusApplication').textContent = applicationData.status || 'N/A';

                // Display interview information
                if (applicationData.interviewDate && applicationData.interviewTime) {
                    document.getElementById('statusInterview').textContent = `Schedule: ${applicationData.interviewDate} at ${applicationData.interviewTime}`;
                } else {
                    document.getElementById('statusInterview').textContent = "No interview scheduled yet.";
                }

                // Display interview mode
                const interviewMode = applicationData.interviewMode || "Not specified";
                document.getElementById('statusInterviewMode').textContent = interviewMode;

                // Display meeting link if interview mode is online and link is available
                if (interviewMode === 'Online' && applicationData.meetingLink) {
                    const meetingLinkElement = document.getElementById('statusMeetingLink');
                    meetingLinkElement.innerHTML = `<p><strong>Meeting Link:</strong>  <a href="${applicationData.meetingLink}" target="_blank" class="text-blue-500 hover:underline">${applicationData.meetingLink}</a></p>`;
                    meetingLinkElement.classList.remove('hidden');
                } else {
                    document.getElementById('statusMeetingLink').classList.add('hidden');
                }

                // Update other status sections
                document.getElementById('statusDocuments').textContent = applicationData.documentStatus ? `Document Submission: ${applicationData.documentStatus}` : "";
                document.getElementById('statusOnboarding').textContent = applicationData.onboardingStatus ? `Onboarding: ${applicationData.onboardingStatus}` : "";
                document.getElementById('statusDeployment').textContent = applicationData.deploymentStatus ? `Deployment: ${applicationData.deploymentStatus}` : "";

                // Fetch deployment details using userId and jobId if deploymentId is not available
                let deploymentData = null;
                if (applicationData.deploymentId) {
                    const deploymentDocRef = doc(db, "deployments", applicationData.deploymentId);
                    const deploymentDoc = await getDoc(deploymentDocRef);
                    if (deploymentDoc.exists()) {
                        deploymentData = deploymentDoc.data();
                    }
                } else {
                    // If deploymentId is not present, query using userId and jobId
                    const deploymentQuery = query(collection(db, 'deployments'), where('userId', '==', applicationData.userId), where('jobId', '==', applicationData.jobId));
                    const deploymentSnapshot = await getDocs(deploymentQuery);
                    if (!deploymentSnapshot.empty) {
                        deploymentData = deploymentSnapshot.docs[0].data();
                    }
                }

                if (deploymentData) {
                    document.getElementById('statusDeploymentDate').textContent = deploymentData.deploymentDate || 'N/A';
                    document.getElementById('statusDeploymentLocation').textContent = deploymentData.deploymentLocation || 'N/A';
                    document.getElementById('statusManagerEmail').textContent = deploymentData.managerEmail || 'N/A';

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
                    document.getElementById('statusRequirements').innerHTML = requirementsList;

                    // Add redirect button to submit requirements
                    const redirectButtonId = 'submitRequirementsButton';
                    if (!document.getElementById(redirectButtonId)) { 
                        const redirectButton = document.createElement('button');
                        redirectButton.id = redirectButtonId;
                        redirectButton.textContent = "Submit Requirements";
                        redirectButton.classList.add('bg-blue-500', 'hover:bg-blue-600', 'text-white', 'px-4', 'py-2', 'rounded', 'mt-4');
                        redirectButton.addEventListener('click', () => {
                            window.location.href = "../applicant/requirements.html";
                        });
                        document.getElementById('statusRequirements').parentElement.appendChild(redirectButton);
                    }
                } else {
                    console.error("No deployment details found.");
                    // Hide elements if no deployment details
                    document.getElementById('statusDeploymentDate').parentElement.style.display = 'none';
                    document.getElementById('statusDeploymentLocation').parentElement.style.display = 'none';
                    document.getElementById('statusManagerEmail').parentElement.style.display = 'none';
                    document.getElementById('statusRequirements').parentElement.style.display = 'none';
                }

                document.getElementById('statusModal').classList.remove('hidden');
            } else {
                console.log("No application found.");
            }
        } catch (error) {
            console.error("Error loading application status: ", error);
        } finally {
            toggleLoadingState(false); // Hide loading indicator
        }
    }

    // Authentication state observer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                toggleLoadingState(true); // Show loading indicator
                const querySnapshot = await fetchApplications(user);

                if (querySnapshot.empty) {
                    console.log("No applications found for this user.");

                    // Show notice and button if no applications are found
                    const applicationsList = document.getElementById('applicationsList');
                    applicationsList.innerHTML = `
                        <div class="text-center p-8 bg-white shadow rounded-lg">
                            <div class="flex items-center justify-center">
                                <img src="../../assets/explore.jpg" alt="Explore" class="object-contain h-48 w-106">
                            </div>
                            <p class="text-gray-500 text-lg mb-6">You haven't applied to any jobs yet.</p>
                            <a href="job_board.html" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full">Explore Jobs</a>
                        </div>
                    `;
                    return;
                }

                const applicationsList = document.getElementById('applicationsList');
                const jobDetailsPromises = querySnapshot.docs.map(async (docSnapshot) => {
                    const application = docSnapshot.data();
                    const jobData = await fetchJobDetails(application.jobId);
                    return { application, jobData, docId: docSnapshot.id };
                });

                const jobDetailsArray = await Promise.all(jobDetailsPromises);

                jobDetailsArray.forEach(({ application, jobData, docId }) => {
                    const div = document.createElement('div');
                    div.classList.add('mb-4', 'p-4', 'bg-gray-100', 'rounded-lg', 'flex', 'justify-between', 'items-center');
                    div.innerHTML = `
                        <div>
                            <h3 class="text-lg font-bold">${jobData.title}</h3>
                            <p>Company: ${jobData.company}</p>
                            <p>Status: ${application.status}</p>
                        </div>
                        <button class="viewStatusButton bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded" data-id="${docId}">View Status</button>
                    `;
                    applicationsList.appendChild(div);

                    // Event listener for "View Status" button
                    const viewStatusButton = div.querySelector('.viewStatusButton');
                    viewStatusButton.addEventListener('click', async () => {
                        await loadApplicationStatus(docId);
                    });
                });

            } catch (error) {
                console.error("Error loading applications: ", error);
            } finally {
                toggleLoadingState(false); // Hide loading indicator
            }
        } else {
            console.log("No user is signed in.");
        }
    });

    // Event listener for close modal button
    const closeModalButton = document.getElementById('closeStatusModalButton');
    closeModalButton.addEventListener('click', () => {
        document.getElementById('statusModal').classList.add('hidden');
    });
});
