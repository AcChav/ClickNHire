import db from '../db/firebase_firestore.js';
import { collection, getDocs, doc, getDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js';
import { renderJobDetailsModal } from './job_details.js';

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const jobList = document.getElementById('jobList');
    const recommendedJobList = document.getElementById('recommendedJobList');
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');
    const employmentFilter = document.getElementById('employmentFilter');

    let allJobs = [];

    // Fetch the jobs that the user has applied to
    async function fetchUserApplications(userId) {
        const applicationsRef = collection(db, 'applications');
        const applicationQuery = query(applicationsRef, where('userId', '==', userId));
        const applicationSnapshot = await getDocs(applicationQuery);
        return applicationSnapshot.docs.map(doc => doc.data().jobId);
    }

    // Fetch user's region based on their location in the users collection
    const fetchUserRegion = async () => {
        const user = auth.currentUser;
        if (!user) return null;

        try {
            const userDocRef = doc(db, "users", user.uid);
            const userSnapshot = await getDoc(userDocRef);
            if (userSnapshot.exists()) {
                const userLocation = userSnapshot.data().location;
                const userRegion = userLocation.split(',')[0].trim(); // Extract only the region
                return userRegion;
            }
        } catch (error) {
            console.error("Error fetching user's region:", error);
        }
        return null;
    };

    // Display recommended jobs based on user's region
    const displayRecommendedJobs = async (userRegion) => {
        if (!allJobs || allJobs.length === 0) {
            console.log("No jobs available to filter.");
            recommendedJobList.innerHTML = `<p class="text-gray-500">No recommended jobs available in your region.</p>`;
            return;
        }

        // Filter jobs by region as before
        const recommendedJobs = allJobs.filter(job => {
            if (job.location) {
                const jobRegion = job.location.split(',')[0].trim();
                return jobRegion === userRegion;
            } else {
                return false;
            }
        });

        recommendedJobList.innerHTML = ''; // Clear any previous recommendations

        if (recommendedJobs.length === 0) {
            recommendedJobList.innerHTML = `<p class="text-gray-500">No recommended jobs available in your region.</p>`;
            return;
        }

        recommendedJobs.forEach(job => {
            const jobCard = createJobCard(job);
            recommendedJobList.appendChild(jobCard);
        });
    };

    // Fetch jobs from Firestore and initialize filters and job list
    const fetchJobs = async () => {
        try {
            toggleLoadingState(true); // Show loading indicator

            // Update job positions based on applications (decrement logic)
            await decrementJobPositions();

            const querySnapshot = await getDocs(collection(db, "jobs"));

            // Populate allJobs with data from Firestore
            allJobs = querySnapshot.docs.map(docSnapshot => {
                const jobData = { id: docSnapshot.id, ...docSnapshot.data() };
                return jobData;
            });

            const user = auth.currentUser;

            if (user) {
                // Fetch user's region and applications if logged in
                const userRegion = await fetchUserRegion();
                const userAppliedJobs = await fetchUserApplications(user.uid);

                // Mark jobs as applied if the user has applied
                allJobs = allJobs.map(job => ({
                    ...job,
                    hasApplied: userAppliedJobs.includes(job.id),
                }));

                // Display recommended jobs based on the user's region
                if (userRegion) {
                    displayRecommendedJobs(userRegion);
                }
            } else {
                console.warn("User is not authenticated. Displaying all jobs.");
            }

            populateFilters();
            renderJobs(allJobs);
        } catch (error) {
            console.error("Error fetching jobs:", error);
        } finally {
            toggleLoadingState(false); // Hide loading indicator
        }
    };

    // Render job cards based on the filtered or fetched job data
    const renderJobs = (jobs) => {
        jobList.innerHTML = '';

        if (jobs.length === 0) {
            jobList.classList.remove('grid', 'gap-6', 'lg:grid-cols-2', 'xl:grid-cols-3');
            jobList.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[200px]');

            jobList.innerHTML = `
            <div class="text-center text-gray-500">
                <svg class="w-16 h-16 mb-4 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p>No jobs available at the moment. Please check back later.</p>
            </div>
        `;
            return;
        }

        jobList.classList.add('grid', 'gap-6', 'lg:grid-cols-2', 'xl:grid-cols-3');
        jobList.classList.remove('flex', 'flex-col', 'items-center', 'justify-center', 'min-h-[200px]');

        jobs.forEach(job => {
            const jobCard = createJobCard(job);
            jobList.appendChild(jobCard);
        });
        attachDetailEventHandlers();
    };

    // Create and return a job card element for a job
    const createJobCard = (job) => {
        const jobCard = document.createElement('div');
        jobCard.classList.add('bg-white', 'p-6', 'rounded-lg', 'shadow-lg', 'hover:shadow-xl', 'transition', 'duration-200', 'flex', 'flex-col', 'justify-between');

        const viewDetailsButton = job.hasApplied
            ? `<a href="#" class="viewDetails block text-center bg-gray-500 text-white py-2 rounded-md cursor-not-allowed" data-id="${job.id}" disabled>Already Applied</a>`
            : `<a href="#" class="viewDetails block text-center bg-green-500 text-white py-2 rounded-md hover:bg-green-600" data-id="${job.id}">View Details</a>`;

        jobCard.innerHTML = `
            <div>
                <h3 class="text-2xl font-bold">${job.title}</h3>
                <h4>${job.company}</h4>
                <p class="text-sm mt-4">Location: ${job.location}</p>
                <p class="my-2">Employment Type: ${job.employmentType}</p>
            </div>
            <div class="mt-4">
                ${viewDetailsButton}
            </div>
        `;
        return jobCard;
    };

    // Populate location and employment type filters based on job data
    const populateFilters = () => {
        const regionProvinceList = [...new Set(allJobs.map(job => {
            const [region, province] = job.location.split(',').map(part => part.trim());
            return `${region}, ${province}`;
        }))];
        populateFilter(locationFilter, regionProvinceList);
        populateFilter(employmentFilter, [...new Set(allJobs.map(job => job.employmentType))]);
    };

    const populateFilter = (filterElement, items) => {
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item;
            option.textContent = item;
            filterElement.appendChild(option);
        });
    };

    const filterJobs = () => {
        const searchQuery = searchInput.value.toLowerCase();
        const selectedLocation = locationFilter.value;
        const selectedEmploymentType = employmentFilter.value;

        const filteredJobs = allJobs.filter(job => {
            const [region, province] = job.location.split(',').map(part => part.trim());
            const regionProvince = `${region}, ${province}`;
            const matchesSearch = job.title.toLowerCase().includes(searchQuery) || job.company.toLowerCase().includes(searchQuery);
            const matchesLocation = selectedLocation ? regionProvince === selectedLocation : true;
            const matchesEmploymentType = selectedEmploymentType ? job.employmentType === selectedEmploymentType : true;
            return matchesSearch && matchesLocation && matchesEmploymentType;
        });

        renderJobs(filteredJobs);
    };

    const attachDetailEventHandlers = () => {
        document.querySelectorAll('.viewDetails').forEach(button => {
            button.addEventListener('click', handleViewDetails);
        });
    };

    const handleViewDetails = async (event) => {
        event.preventDefault();

        if (event.target.classList.contains('cursor-not-allowed')) {
            return;
        }

        const jobId = event.target.getAttribute('data-id');
        try {
            toggleLoadingState(true);
            const jobDocRef = doc(db, "jobs", jobId);
            const jobSnapshot = await getDoc(jobDocRef);
            if (jobSnapshot.exists()) {
                const job = {
                    ...jobSnapshot.data(),
                    jobId: jobSnapshot.id
                };
                renderJobDetailsModal(job, true, false);
            } else {
                console.error("No such document!");
            }
        } catch (error) {
            console.error("Error retrieving job details:", error);
        } finally {
            toggleLoadingState(false);
        }
    };

    searchInput.addEventListener('input', debounce(filterJobs, 300));
    locationFilter.addEventListener('change', filterJobs);
    employmentFilter.addEventListener('change', filterJobs);

    fetchJobs();
});

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Function to decrement job positions based on employee status
export async function decrementJobPositions() {
    try {
        const applicationsRef = collection(db, "applications");

        // Query applications with status "Employee" and either no isDecremented field or isDecremented = false
        const employeeQuery = query(applicationsRef, where("status", "==", "Employee"), where("isDecremented", "==", false));
        const employeeSnapshots = await getDocs(employeeQuery);

        if (employeeSnapshots.empty) {
            console.log("No new applications to process for decrementing positions.");
            return;
        }

        const jobDecrementMap = new Map();

        employeeSnapshots.forEach(docSnap => {
            const applicationData = docSnap.data();
            const jobId = applicationData.jobId;
            const userId = applicationData.userId; // Assuming userId exists in the application document

            if (jobId && userId) {
                const existingUsers = jobDecrementMap.get(jobId) || [];
                existingUsers.push({ userId, applicationId: docSnap.id });
                jobDecrementMap.set(jobId, existingUsers);
            }
        });

        const jobPromises = Array.from(jobDecrementMap.keys()).map(async jobId => {
            const jobRef = doc(db, "jobs", jobId);
            const jobSnap = await getDoc(jobRef);

            if (jobSnap.exists()) {
                const jobData = jobSnap.data();
                const usersToDecrement = jobDecrementMap.get(jobId);

                const updates = {};

                for (const { userId, applicationId } of usersToDecrement) {
                    // Fetch user to determine gender
                    const userRef = doc(db, "users", userId);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const userGender = userData.gender; // Assume `gender` field in user document

                        if (jobData.gender === "Both gender") {
                            // Decrement based on user gender
                            if (userGender === "Male" && jobData.numberOfMales > 0) {
                                updates.numberOfMales = (jobData.numberOfMales || 0) - 1;
                            } else if (userGender === "Female" && jobData.numberOfFemales > 0) {
                                updates.numberOfFemales = (jobData.numberOfFemales || 0) - 1;
                            }
                        } else if (jobData.gender === userGender) {
                            // Decrement for single-gender jobs
                            updates.numberOfPositions = Math.max(0, (jobData.numberOfPositions || 0) - 1);
                        }
                    }

                    // Mark the application as decremented
                    const applicationRef = doc(db, "applications", applicationId);
                    await updateDoc(applicationRef, { isDecremented: true });
                }

                // Apply the updates to the job document
                if (Object.keys(updates).length > 0) {
                    await updateDoc(jobRef, updates);
                }
            }
        });

        await Promise.all(jobPromises);
    } catch (error) {
        console.error("Error decrementing job positions:", error);
    }
}



