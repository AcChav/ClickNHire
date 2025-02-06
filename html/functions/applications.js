/**
 * This script manages the job applications dashboard for HR. It fetches, displays, and filters 
 * applications, provides detailed views, and handles the screening and status updating of applicants 
 * through interactions with Firebase Firestore.
 */

import db from '../db/firebase_firestore.js';
import { collection, getDocs, query, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js';
import { handleResumeDownload } from './resume_download.js';
import { calculateTotalScore } from './matching.js';
import { renderStatusCards } from './status_Cards.js';
import { initRejectionModal } from './rejection_modal.js';

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const applicationList = document.getElementById('applicationList');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const statusCounts = document.getElementById('statusCounts');
    const closeModalButton = document.getElementById('closeApplicantModalButton');
    const screeningModal = document.getElementById('screeningModal');
    const closeScreeningModalButton = document.getElementById('closeScreeningModalButton');

    // Application data
    let applications = [];

    // Caches to avoid redundant database queries
    const userCache = {};
    const jobCache = {};

    // Handle user authentication state
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                toggleLoadingState(true); // Show loading indicator
                // Query the "applications" collection
                const q = query(collection(db, "applications"));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    console.log("No applications found.");
                    displayError("No applications found.");
                    return;
                }

                // Fetch application data along with user and job details
                applications = await Promise.all(querySnapshot.docs.map(fetchApplicationDetails));

                // Render the applications and status counts
                renderApplications(applications);
                renderStatusCards(applications);
            } catch (error) {
                console.error("Error loading applications: ", error);
                displayError("An error occurred while loading applications. Please try again later.");
            } finally {
                toggleLoadingState(false); // Hide loading indicator
            }
        } else {
            console.log("No user is signed in.");
        }
    });

    // Set up event listeners
    setupEventListeners();

    function setupEventListeners() {
        searchInput.addEventListener('input', debounce(filterApplications, 300));
        statusFilter.addEventListener('change', filterApplications);
        closeModalButton.addEventListener('click', closeApplicantModal);
        closeScreeningModalButton.addEventListener('click', closeScreeningModal);
    }

    // Fetch application details, including user and job data
    async function fetchApplicationDetails(docSnapshot) {
        const application = docSnapshot.data();
        const [userDoc, jobDoc] = await Promise.all([fetchUserData(application.userId), fetchJobData(application.jobId)]);

        // Calculate total score immediately
        const { totalScore } = await calculateTotalScore(userDoc, jobDoc);
        const scoreCategory = interpretScore(totalScore);

        // Determine if the applicant is qualified (totalScore > 0.5)
        const isQualified = totalScore > 0.5;

        return {
            applicationId: docSnapshot.id,
            fullName: `${userDoc.firstName} ${userDoc.lastName}`,
            email: userDoc.email || "No Email",
            resumeLink: userDoc.resume || "#",
            userLocation: userDoc.location || "Location not available",
            jobTitle: jobDoc.title,
            company: jobDoc.company,
            status: application.status,
            education: userDoc.education || "Not specified",
            skills: userDoc.skills || "Not specified",
            gender: userDoc.gender || "Not specified",
            experience: userDoc.experience || "Not specified",
            userId: application.userId,
            jobId: application.jobId,
            totalScore: totalScore,
            scoreCategory: scoreCategory,
            isQualified: isQualified // indicate qualification status
        };
    }

    // Fetch user data based on userId, utilizing a cache to avoid redundant database calls
    async function fetchUserData(userId) {
        if (userCache[userId]) return userCache[userId];
        try {
            const userDocRef = doc(db, "users", userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userCache[userId] = {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email || "No Email",
                    resume: userData.resumeURL || "#",
                    location: userData.location || "Location not available",
                    education: userData.education || "Not specified",
                    skills: userData.skills || "Not specified",
                    gender: userData.gender || "Not specified",
                    experience: userData.experience || "Not specified"
                };
            } else {
                throw new Error(`User with ID ${userId} does not exist.`);
            }
            return userCache[userId];
        } catch (error) {
            console.error(`Error fetching user data for userId ${userId}:`, error);
            return { firstName: "Unknown", lastName: "User", email: "No Email", resume: "#", location: "Location not available" };
        }
    }

    // Fetch job data based on jobId, utilizing a cache to avoid redundant database calls
    async function fetchJobData(jobId) {
        if (jobCache[jobId]) return jobCache[jobId];
        try {
            const jobDocRef = doc(db, "jobs", jobId);
            const jobDoc = await getDoc(jobDocRef);
            jobCache[jobId] = jobDoc.exists() ? jobDoc.data() : { title: "Unknown Job", company: "Unknown Company" };
            return jobCache[jobId];
        } catch (error) {
            console.error(`Error fetching job data for jobId ${jobId}:`, error);
            return { title: "Unknown Job", company: "Unknown Company" };
        }
    }

    // Filter applications based on search text and status filter
    function filterApplications() {
        const searchText = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        const filteredApplications = applications.filter(app => {
            const matchesSearch = (app.fullName?.toLowerCase() || '').includes(searchText)
                || (app.jobTitle?.toLowerCase() || '').includes(searchText)
                || (app.userLocation?.toLowerCase() || '').includes(searchText)
                || (app.company?.toLowerCase() || '').includes(searchText);

            const matchesStatus = !selectedStatus || app.status === selectedStatus;

            // Use the precomputed `isQualified` property instead of checking the score again
            if (!app.isQualified) {
                console.log(`Filtered Out: ${app.fullName} (${app.email}), Not Qualified`);
                return false;
            }

            return matchesSearch && matchesStatus;
        });

        renderApplications(filteredApplications);
    }

    function showReviewModal({ fullName, applicationId, userId, jobId, resumeLink }) {
        const reviewModal = document.getElementById('reviewModal'); // Assuming the modal exists
        const reviewApplicantName = document.getElementById('reviewApplicantName');
        const previewResumeButton = document.getElementById('previewResumeButton');
        const closeReviewModalButton = document.getElementById('closeReviewModalButton');
        const approveButton = document.getElementById('approveReviewButton');

        // Set the applicant's name in the modal
        reviewApplicantName.textContent = fullName;

        // Enable or disable the "Preview Resume" button based on resume availability
        if (resumeLink && resumeLink !== '#') {
            previewResumeButton.disabled = false;
            previewResumeButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
            previewResumeButton.classList.add('bg-blue-500', 'hover:bg-blue-700');
            previewResumeButton.onclick = () => window.open(resumeLink, '_blank');
        } else {
            previewResumeButton.disabled = true;
            previewResumeButton.classList.remove('bg-blue-500', 'hover:bg-blue-700');
            previewResumeButton.classList.add('bg-gray-400', 'cursor-not-allowed');
            previewResumeButton.onclick = null;
        }

        // Add functionality to close the modal
        closeReviewModalButton.onclick = () => {
            reviewModal.classList.add('hidden');
        };

        // Attach functionality for approve button
        approveButton.onclick = async () => {
            try {
                await updateApplicationStatus(applicationId, 'Interview Pending'); // Approve the applicant
                alert(`${fullName} has been approved for the next step.`);
                reviewModal.classList.add('hidden');
            } catch (error) {
                console.error("Error approving application:", error);
            }
        };

        // Show the modal
        reviewModal.classList.remove('hidden');
    }

    // Function to truncate a string with an ellipsis if it exceeds a certain length
    function truncateWithEllipsis(text, maxLength = 50) {
        if (text.length > maxLength) {
            return text.slice(0, maxLength) + '...';
        }
        return text;
    }

    // Render the applications list with "View Details" and "Screen Applicant" buttons
    function renderApplications(applicationsToRender) {
        // Sort applications so that "Applied" status comes first
        applicationsToRender.sort((a, b) => {
            // Prioritize qualified applications
            if (a.isQualified && !b.isQualified) {
                return -1; // a comes first
            } else if (!a.isQualified && b.isQualified) {
                return 1; // b comes first
            }

            // If both are either qualified or unqualified, sort by status
            if (a.status === 'Applied' && b.status !== 'Applied') {
                return -1; // a comes first
            } else if (a.status !== 'Applied' && b.status === 'Applied') {
                return 1; // b comes first
            }

            return 0; // no change in order
        });

        const fragment = document.createDocumentFragment();
        applicationsToRender.forEach(({ fullName, email, userLocation, jobTitle, company, status, resumeLink, education, skills, gender, experience, applicationId, userId, jobId, isQualified }) => {
            const li = document.createElement('li');
            li.classList.add('mb-4', 'border', 'border-gray-300', 'p-4', 'bg-gray-100', 'rounded-lg', 'flex', 'justify-between', 'items-center');

            // Truncate the location if it's too long
            const truncatedLocation = truncateWithEllipsis(userLocation, 50);

            // Determine qualification label
            const qualificationLabel = isQualified ? `<span class="text-green-600 font-bold">Qualified</span>` : `<span class="text-red-600 font-bold">Not Qualified</span>`;

            li.innerHTML = `
                <div>
                    <h3 class="text-lg font-bold">${escapeHTML(fullName)}</h3>
                    <p>Applied Job: ${escapeHTML(jobTitle)}</p>
                    <p>Company: ${escapeHTML(company)}</p>
                    <p class="mt-2">Location: <span title="${escapeHTML(userLocation)}">${escapeHTML(truncatedLocation)}</span></p>
                    <p>Status: ${escapeHTML(status)}</p>
                    <p>${qualificationLabel}</p>
                </div>
                <div class="flex items-center space-x-4">
                    <button aria-label="View details of ${escapeHTML(fullName)}" class="viewDetailsButton bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">View Details</button>
                    <button aria-label="${isQualified ? 'Screen applicant' : 'Review applicant'} ${escapeHTML(fullName)}" 
                        class="${isQualified ? 'screenApplicantButton bg-blue-600 hover:bg-blue-700' : 'reviewApplicantButton bg-yellow-500 hover:bg-yellow-600'} text-white px-4 py-2 rounded" 
                        ${isQualified ? '' : 'data-action="review"'}>${isQualified ? 'Screen Applicant' : 'Review'}</button>
                </div>
            `;

            fragment.appendChild(li);

            // Add event listener for the "View Details" button
            const viewDetailsButton = li.querySelector('.viewDetailsButton');
            viewDetailsButton.addEventListener('click', () => showApplicantDetails({ fullName, email, resumeLink, userLocation, education, skills, gender, experience }));

            // Add event listener for the "Screen Applicant" or "Review" button
            const actionButton = li.querySelector(isQualified ? '.screenApplicantButton' : '.reviewApplicantButton');
            if (isQualified) {
                actionButton.addEventListener('click', () => showScreeningModal({ fullName, applicationId, userId, jobId, actionButton }));
            } else {
                actionButton.addEventListener('click', () => showReviewModal({ fullName, applicationId, userId, jobId }));
            }
        });

        applicationList.innerHTML = '';
        applicationList.appendChild(fragment);
    }

    // Show applicant details in a modal
    function showApplicantDetails({ fullName, email, resumeLink, userLocation, education, skills, gender, experience }) {
        const applicantName = document.getElementById('applicantName');
        const applicantEmail = document.getElementById('applicantEmail');
        const applicantLocation = document.getElementById('applicantLocation');
        const resumeStatus = document.getElementById('resumeStatus');
        const applicantResumeButton = document.getElementById('applicantResumeButton');

        const applicantEducation = document.getElementById('applicantEducation');
        const applicantSkills = document.getElementById('applicantSkills');
        const applicantGender = document.getElementById('applicantGender');
        const applicantExperience = document.getElementById('applicantExperience');

        applicantName.textContent = fullName;
        applicantEmail.textContent = email;
        applicantLocation.textContent = userLocation;

        // Populate the new qualifications fields
        applicantEducation.textContent = education;
        applicantSkills.textContent = skills;
        applicantGender.textContent = gender;
        applicantExperience.textContent = experience;

        // Clear any previous event listeners
        applicantResumeButton.onclick = null;

        if (resumeLink && resumeLink !== '#') {
            resumeStatus.textContent = "Available";
            applicantResumeButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
            applicantResumeButton.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-700');
            applicantResumeButton.disabled = false;

            // Bind the correct download handler using the new function
            applicantResumeButton.onclick = () => handleResumeDownload(resumeLink, fullName);
        } else {
            resumeStatus.textContent = "Unavailable";
            applicantResumeButton.classList.add('bg-gray-400', 'cursor-not-allowed');
            applicantResumeButton.disabled = true;
        }

        document.getElementById('applicantModal').classList.remove('hidden');
    }

    // Show screening modal with applicant details
    async function showScreeningModal({ fullName, applicationId, userId, jobId, screenApplicantButton }) {
        const screeningApplicantName = document.getElementById('screeningApplicantName');
        screeningApplicantName.textContent = fullName;
        screeningModal.classList.remove('hidden');

        // Fetch user and job data (already fetched in fetchApplicationDetails)
        const userDoc = await fetchUserData(userId);
        const jobDoc = await fetchJobData(jobId);

        // Use the precomputed totalScore from the application object
        const application = applications.find(app => app.userId === userId && app.jobId === jobId);
        if (!application) {
            console.error("Application data not found.");
            return;
        }

        const totalScore = application.totalScore;
        const scoreCategory = application.scoreCategory;

        // Check if the applicant's total score is 0.5 or below
        if (totalScore <= 0.5) {
            console.log(`Attempted to screen low-scoring applicant: ${application.fullName}, Score: ${totalScore.toFixed(2)} (${scoreCategory})`);
            alert("This applicant does not meet the minimum score requirements.");
            return; // Exit the function early to prevent showing the modal
        }

        // Display the score in the modal
        const scoreDisplay = document.getElementById('totalScoreDisplay');
        if (scoreDisplay) {
            scoreDisplay.textContent = `${totalScore.toFixed(2)} (${scoreCategory})`;
        } else {
            console.error("Element 'totalScoreDisplay' not found.");
            return;
        }

        const acceptButton = document.getElementById('acceptApplicantButton');
        const rejectButton = document.getElementById('rejectApplicantButton');

        acceptButton.onclick = async () => {
            try {
                await updateApplicationStatus(applicationId, 'Interview Pending');
                acceptButton.disabled = true;
                rejectButton.disabled = true;
                if (screenApplicantButton) {
                    screenApplicantButton.disabled = true;
                    screenApplicantButton.classList.add('opacity-50', 'cursor-not-allowed');
                }
                window.location.href = 'hr_calendar.html';
            } catch (error) {
                console.error('Failed to update application status and redirect:', error);
            }
        };

        rejectButton.onclick = () => {
            initRejectionModal(screeningApplicantName.textContent, jobDoc, applicationId);
        };
    }

    // Function to interpret score into categories
    function interpretScore(score) {
        if (score >= 0.75) return 'Very Good';
        if (score >= 0.5) return 'Good';
        if (score >= 0.25) return 'Bad';
        return 'Very Bad';
    }

    // Function to update application status and store HR name
    async function updateApplicationStatus(applicationId, newStatus) {
        const applicationRef = doc(db, "applications", applicationId);

        try {
            // Get the current signed-in HR user
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No authenticated user found.");
            }

            // Fetch HR user details
            const hrDoc = await getDoc(doc(db, "users", user.uid));
            if (!hrDoc.exists()) {
                throw new Error("HR user document not found.");
            }

            const hrData = hrDoc.data();
            const hrName = `${hrData.firstName} ${hrData.lastName}`;

            // Update the application with the new status and HR name
            await updateDoc(applicationRef, {
                status: newStatus,
                hrApprovedBy: hrName
            });

            console.log(`Application status updated to ${newStatus} by ${hrName}`);
        } catch (error) {
            console.error("Error updating application status: ", error);
        }
    }

    // Close the screening modal
    function closeScreeningModal() {
        screeningModal.classList.add('hidden');
    }

    // Close the applicant details modal
    function closeApplicantModal() {
        document.getElementById('applicantModal').classList.add('hidden');
    }

    // Display error messages
    function displayError(message) {
        const applicationList = document.getElementById('applicationList');

        applicationList.innerHTML = `
            <div class="flex flex-col items-center justify-center mt-10">
                <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 16h-1v-4h-1m1-4h.01M12 9v.01M20.94 11c.14-2.33-.67-4.53-2.2-6.06a8.965 8.965 0 00-6.06-2.2C7.22 2.85 5.03 3.67 3.5 5.2S1.85 9.94 2 12.88c.14 2.33 1.17 4.53 2.7 6.06 1.53 1.53 3.73 2.56 6.06 2.7 2.94.14 5.73-1.17 7.8-3.5a8.965 8.965 0 002.2-6.06z"/>
                </svg>
                <h2 class="text-gray-600 text-lg">${message}</h2>
                <p class="text-gray-500">There's no application/s in the moment. Please check back later.</p>
            </div>
        `;
    }

    // Escape HTML to prevent XSS attacks
    function escapeHTML(str) {
        if (typeof str !== 'string') {
            return ''; // Return empty string if input is not a string
        }
        return str.replace(/[&<>"']/g, (match) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        })[match]);
    }

    // Debounce function to limit the rate of function execution
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});
