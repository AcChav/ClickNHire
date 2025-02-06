/**
 * This script handles the calendar functionality for scheduling, rescheduling, and canceling 
 * interviews. It displays a monthly calendar, fetches and shows scheduled interviews, and allows 
 * HR personnel to manage interview schedules through Firebase Firestore.
 */

import { db } from '../db/firebase_init.js';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, limit, startAfter } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { openInterviewResultModal } from './interview_results.js'; // Import the modal function

// Cache for frequently accessed data
const cache = new Map();

document.addEventListener('DOMContentLoaded', async function () {
    const calendar = document.getElementById('days');
    const monthTitle = document.getElementById('calendarMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const applicantList = document.getElementById('applicantList');
    const rescheduleCancelList = document.getElementById('rescheduleCancelList');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    const today = new Date();

    // Debounce function to limit how often the calendar renders
    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Debounced renderCalendar to prevent excessive re-renders
    const debouncedRenderCalendar = debounce(renderCalendar, 300);

    // Renders the calendar for the given month and year
    async function renderCalendar(month, year) {
        calendar.innerHTML = ''; // Clear existing calendar

        const firstDay = new Date(year, month).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        monthTitle.textContent = `${monthNames[month]} ${year}`;

        const interviews = await fetchInterviewsForMonth(month + 1, year); // Fetch interviews for the selected month

        // Create empty divs for days before the first of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            calendar.appendChild(emptyDiv);
        }

        // Populate the calendar with days and interview details
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'p-4 bg-gray-200 rounded-lg hover:bg-blue-300 cursor-pointer transition text-lg md:text-xl';
            dayDiv.textContent = day;

            const currentDay = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const interviewsForDay = interviews.filter(interview => {
                const interviewDate = interview.interviewDate.trim(); // Ensure no trailing spaces
                return interviewDate === currentDay;
            });

            // Highlight days with scheduled interviews
            if (interviewsForDay.length > 0) {
                dayDiv.classList.add('bg-green-500', 'text-white', 'font-bold');
                dayDiv.innerHTML = `<p>${day}</p>`;
            }

            // Highlight the current day
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('bg-blue-500', 'text-white', 'font-bold');
                dayDiv.classList.remove('bg-gray-200', 'hover:bg-blue-300');
            }

            calendar.appendChild(dayDiv);
        }

    }

    // Smooth scroll to the reschedule/cancel section
    function scrollToRescheduleCancelSection() {
        const rescheduleCancelSection = document.getElementById('rescheduleCancelSection');
        rescheduleCancelSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Fetches applicants scheduled for interviews
    async function fetchInterviewApplicants() {
        try {
            applicantList.innerHTML = '';
            const fragment = document.createDocumentFragment();

            const q = query(collection(db, "applications"), where("status", "==", "Interview Pending"));
            const querySnapshot = await getDocs(q);

            // Handle the case when no applicants are found
            if (querySnapshot.empty) {
                const noApplicants = document.createElement('li');
                noApplicants.textContent = "No applicants scheduled for an interview.";
                fragment.appendChild(noApplicants);
            } else {
                // Populate the list with applicants scheduled for interviews
                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    const fullName = await getCachedUserFullName(data.userId);

                    const jobDocRef = doc(db, "jobs", data.jobId);
                    const jobDoc = await getDoc(jobDocRef);
                    const jobData = jobDoc.exists() ? jobDoc.data() : { title: "Not specified" };

                    const listItem = document.createElement('li');
                    listItem.className = 'p-4 bg-gray-100 border border-gray-300 rounded-lg shadow flex items-center justify-between';

                    listItem.innerHTML = `
                        <div>
                            <h4 class="text-lg font-bold">${fullName}</h4>
                            <p>Job Title: ${jobData.title || 'Not specified'}</p>
                            <p>Approved By: ${data.hrApprovedBy}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="scheduleButton bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600" data-application-id="${docSnap.id}">Schedule</button>
                        </div>
                    `;

                    fragment.appendChild(listItem);
                }
            }
            applicantList.appendChild(fragment);
        } catch (error) {
            console.error("Error fetching applicants: ", error);
        }
    }

    // Fetches and displays the interview results
    async function fetchInterviewResults() {
        try {
            const resultsList = document.getElementById('interviewResultsList');
            resultsList.innerHTML = '';
            const fragment = document.createDocumentFragment();

            const q = query(collection(db, "applications"), where("status", "==", "Interview Passed"));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                const noResults = document.createElement('li');
                noResults.textContent = "No interview results available.";
                fragment.appendChild(noResults);
            } else {
                for (const docSnap of querySnapshot.docs) {
                    const data = docSnap.data();
                    const fullName = await getCachedUserFullName(data.userId);

                    const jobDocRef = doc(db, "jobs", data.jobId);
                    const jobDoc = await getDoc(jobDocRef);
                    const jobData = jobDoc.exists() ? jobDoc.data() : { title: "Not specified" };

                    const resultItem = document.createElement('li');
                    resultItem.className = 'p-4 bg-gray-100 border border-gray-300 rounded-lg shadow';

                    resultItem.innerHTML = `
                    <div>
                        <h4 class="text-lg font-bold">${fullName}</h4>
                        <p>Job Title: ${jobData.title || 'Not specified'}</p>
                        <p>Status: ${data.status}</p>
                    </div>
                `;

                    fragment.appendChild(resultItem);
                }
            }
            resultsList.appendChild(fragment);
        } catch (error) {
            console.error("Error fetching interview results: ", error);
        }
    }

    // Fetches interviews scheduled for a specific month
    async function fetchInterviewsForMonth(month, year) {
        const interviews = [];
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        // Set both startDate and endDate to midnight to ensure proper comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const q = query(collection(db, "applications"), where("status", "==", "Interview Scheduled"));
        const querySnapshot = await getDocs(q);

        // Filter interviews within the selected month
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const interviewDate = new Date(data.interviewDate);


            if (interviewDate >= startDate && interviewDate <= endDate) {
                const fullName = await getCachedUserFullName(data.userId);
                interviews.push({ ...data, fullName, applicationId: doc.id });

                // Additional logging to check if August 31 is processed correctly
                if (interviewDate.getDate() === 31 && interviewDate.getMonth() === 7) { // August is month 7 in JS
                }
            } else {
                console.log(`Interview on ${interviewDate.toISOString()} is out of range.`);
            }
        }

        return interviews;
    }

    // Retrieves and caches the user's full name based on userId
    async function getCachedUserFullName(userId) {
        if (cache.has(userId)) {
            return cache.get(userId);
        }
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
            cache.set(userId, fullName);
            return fullName || "Unknown User";
        } else {
            console.log("No such user!");
            return "Unknown User";
        }
    }

    async function openScheduleModal(applicantData) {
        const hrPersonSelect = document.getElementById('hrPerson');
        const interviewDateInput = document.getElementById('interviewDate');
        const interviewTimeInput = document.getElementById('interviewTime');
        const interviewTypeSelect = document.getElementById('interviewType');
        const meetingLinkInput = document.getElementById('meetingLink');
        const interviewModeSelect = document.getElementById('interviewMode'); // New Mode of Interview select

        hrPersonSelect.innerHTML = ''; // Clear existing HR options

        try {
            // Fetch HR personnel from Firestore and populate the dropdown
            const hrQuery = query(collection(db, "users"), where("role", "==", "hr"));
            const hrSnapshot = await getDocs(hrQuery);

            hrSnapshot.forEach((doc) => {
                const hrData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${hrData.firstName} ${hrData.lastName}`;
                option.selected = (doc.id === applicantData.hrId);
                hrPersonSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error fetching HR users: ", error);
        }

        // Set initial values based on applicant data if available
        if (applicantData.interviewDate) {
            interviewDateInput.value = applicantData.interviewDate;
        }
        if (applicantData.interviewTime) {
            interviewTimeInput.value = applicantData.interviewTime;
        }
        if (applicantData.interviewType) {
            interviewTypeSelect.value = applicantData.interviewType;
        }
        if (applicantData.meetingLink) {
            meetingLinkInput.value = applicantData.meetingLink;
        }

        // Show/hide meeting link based on selected mode of interview
        interviewModeSelect.addEventListener('change', (event) => {
            const mode = event.target.value;
            if (mode === 'Online') {
                meetingLinkInput.parentElement.style.display = 'block';
            } else {
                meetingLinkInput.parentElement.style.display = 'none';
            }
        });

        // Set initial visibility for meeting link based on applicant data or default mode
        if (applicantData.interviewMode === 'Online' || !applicantData.interviewMode) {
            interviewModeSelect.value = 'Online';
            meetingLinkInput.parentElement.style.display = 'block';
        } else {
            interviewModeSelect.value = 'Face to Face';
            meetingLinkInput.parentElement.style.display = 'none';
        }

        // Display the modal
        const scheduleModal = document.getElementById('scheduleModal');
        scheduleModal.classList.remove('hidden');

        // Event listener for the Cancel button
        document.getElementById('cancelButton').addEventListener('click', () => {
            scheduleModal.classList.add('hidden');
        });

        // Event listener for the Save button
        document.getElementById('saveButton').addEventListener('click', async () => {
            const selectedDate = interviewDateInput.value;
            const selectedTime = interviewTimeInput.value;
            const selectedHrId = hrPersonSelect.value;
            const selectedInterviewType = interviewTypeSelect.value;
            const selectedInterviewMode = interviewModeSelect.value;
            const meetingLink = meetingLinkInput.value;

            // Validate inputs
            if (selectedDate && selectedTime && selectedHrId && selectedInterviewType &&
                (selectedInterviewMode === 'Face to Face' || (selectedInterviewMode === 'Online' && meetingLink))) {
                try {
                    const interviewDetails = {
                        interviewDate: selectedDate,
                        interviewTime: selectedTime,
                        hrId: selectedHrId,
                        interviewType: selectedInterviewType,
                        interviewMode: selectedInterviewMode,
                        meetingLink: selectedInterviewMode === 'Online' ? meetingLink : null,
                        status: "Interview Scheduled"
                    };

                    const applicationRef = doc(db, "applications", applicantData.applicationId);
                    await updateDoc(applicationRef, interviewDetails);

                    alert("Interview scheduled successfully!");
                    scheduleModal.classList.add('hidden');
                    location.reload(); // Refresh the page after scheduling
                } catch (error) {
                    console.error("Error scheduling interview:", error);
                    alert("Failed to schedule interview.");
                }
            } else {
                alert("Please fill in all required fields.");
            }
        });
    }

    // Event listener to refresh the list when the HR filter is changed
    document.getElementById('hrFilter').addEventListener('change', showRescheduleCancelList);

    // Populates the HR filter dropdown with available HR personnel
    async function populateHRFilter() {
        const hrFilter = document.getElementById('hrFilter');
        hrFilter.innerHTML = '<option value="">All</option>'; // Reset options

        try {
            const hrQuery = query(collection(db, "users"), where("role", "==", "hr"));
            const hrSnapshot = await getDocs(hrQuery);

            // Populate the filter dropdown with HR personnel
            hrSnapshot.forEach((doc) => {
                const hrData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${hrData.firstName} ${hrData.lastName}`;
                hrFilter.appendChild(option);
            });
        } catch (error) {
            console.error("Error populating HR filter: ", error);
        }
    }

    // Displays the list of interviews scheduled for reschedule or cancellation
    async function showRescheduleCancelList() {
        const hrFilter = document.getElementById('hrFilter').value;
        rescheduleCancelList.innerHTML = '';
        const fragment = document.createDocumentFragment();

        let q = query(collection(db, "applications"), where("status", "==", "Interview Scheduled"));
        if (hrFilter) {
            q = query(q, where("hrId", "==", hrFilter));
        }

        const querySnapshot = await getDocs(q);
        const createDrawer = (title) => {
            const drawer = document.createElement('div');
            const drawerHeader = document.createElement('button');
            const arrowIcon = document.createElement('span');

            arrowIcon.className = 'transform transition-transform duration-200 ease-in-out ml-2';
            arrowIcon.innerHTML = '&#9654;'; // Right arrow

            drawerHeader.className = 'w-full text-left font-bold py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-t-lg focus:outline-none flex items-center justify-between';
            drawerHeader.textContent = title;

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'flex-1';
            titleWrapper.textContent = title;
            drawerHeader.innerHTML = '';
            drawerHeader.appendChild(titleWrapper);
            drawerHeader.appendChild(arrowIcon);

            const drawerContent = document.createElement('ul');
            drawerContent.className = 'space-y-4 p-4 bg-white border border-gray-300 rounded-b-lg hidden';

            // Automatically expand the drawer if it has content
            if (drawerContent.children.length > 0) {
                drawerContent.classList.remove('hidden');
                arrowIcon.classList.add('rotate-90');
            }

            drawerHeader.addEventListener('click', () => {
                drawerContent.classList.toggle('hidden');
                arrowIcon.classList.toggle('rotate-90');
            });

            drawer.appendChild(drawerHeader);
            drawer.appendChild(drawerContent);
            return { drawer, drawerContent };
        };

        const firstInterviewDrawer = createDrawer('1st Interviews');
        const secondInterviewDrawer = createDrawer('2nd Interviews');

        if (querySnapshot.empty) {
            const noApplicants = document.createElement('li');
            noApplicants.textContent = "No interviews scheduled.";
            fragment.appendChild(noApplicants);
        } else {
            for (const docSnap of querySnapshot.docs) {
                const data = docSnap.data();
                const fullName = await getCachedUserFullName(data.userId);

                const jobDocRef = doc(db, "jobs", data.jobId);
                const jobDoc = await getDoc(jobDocRef);
                const jobData = jobDoc.exists() ? jobDoc.data() : { title: "Not specified" };

                const hrDocRef = doc(db, "users", data.hrId);
                const hrDoc = await getDoc(hrDocRef);
                const hrData = hrDoc.exists() ? hrDoc.data() : { firstName: "Unknown", lastName: "HR" };
                const hrFullName = `${hrData.firstName} ${hrData.lastName}`.trim();

                const listItem = document.createElement('li');
                listItem.className = 'p-4 bg-gray-100 rounded-lg border border-gray-300 shadow flex items-center justify-between';

                listItem.innerHTML = `
                    <div>
                        <h4 class="text-lg font-bold">${fullName}</h4>
                        <p>Job Title: ${jobData.title || 'Not specified'}</p>
                        <p>Scheduled Date: ${data.interviewDate}</p>
                        <p>Interviewer: ${hrFullName}</p>
                        <p>Interview Type: ${data.interviewType || 'Not specified'}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button class="assessButton bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600" data-application-id="${docSnap.id}" data-current-status="${data.interviewType}">Assess</button>
                        <button class="rescheduleButton bg-yellow-500 text-white py-2 px-4 rounded-md hover:bg-yellow-600" data-application-id="${docSnap.id}">Schedule/Reschedule</button>
                        <button class="cancelButton bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600" data-application-id="${docSnap.id}">Cancel</button>
                    </div>
                `;

                if (data.interviewType === 'Initial Interview') {
                    firstInterviewDrawer.drawerContent.appendChild(listItem);
                } else if (data.interviewType === 'Second Interview') {
                    secondInterviewDrawer.drawerContent.appendChild(listItem);
                } else {
                    firstInterviewDrawer.drawerContent.appendChild(listItem);
                }
            }
        }

        fragment.appendChild(firstInterviewDrawer.drawer);
        fragment.appendChild(secondInterviewDrawer.drawer);

        rescheduleCancelList.appendChild(fragment);
    }

    // Delegate event listeners for dynamically created buttons
    document.addEventListener('click', async (event) => {
        if (event.target.classList.contains('scheduleButton')) {
            const applicationId = event.target.getAttribute('data-application-id');
            const docSnap = await getDoc(doc(db, "applications", applicationId));
            const applicantData = { ...docSnap.data(), applicationId };
            openScheduleModal(applicantData);
        } else if (event.target.classList.contains('assessButton')) {
            const applicationId = event.target.getAttribute('data-application-id');
            const currentStatus = event.target.getAttribute('data-current-status');
            openInterviewResultModal(applicationId, currentStatus);
        } else if (event.target.classList.contains('rescheduleButton')) {
            const applicationId = event.target.getAttribute('data-application-id');
            const docSnap = await getDoc(doc(db, "applications", applicationId));
            const applicantData = { ...docSnap.data(), applicationId };
            openScheduleModal(applicantData);
        } else if (event.target.classList.contains('cancelButton')) {
            const applicationId = event.target.getAttribute('data-application-id');
            if (confirm('Are you sure you want to cancel this interview?')) {
                try {
                    const applicationRef = doc(db, "applications", applicationId);
                    await updateDoc(applicationRef, { status: "Interview Canceled" });
                    alert("Interview canceled successfully.");
                    location.reload(); // Auto-refresh to update the list and calendar
                } catch (error) {
                    console.error("Error canceling interview:", error);
                    alert("Failed to cancel interview.");
                }
            }
        }
    });

    // Event listeners for navigating between months
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        debouncedRenderCalendar(currentMonth, currentYear);
        showRescheduleCancelList();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        debouncedRenderCalendar(currentMonth, currentYear);
        showRescheduleCancelList();
    });

    // Initial render of the calendar and fetching data
    renderCalendar(currentMonth, currentYear);
    showRescheduleCancelList();
    fetchInterviewApplicants();
    fetchInterviewResults();
    populateHRFilter();
});
