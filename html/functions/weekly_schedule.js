import { db } from '../db/firebase_init.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth();
    const viewWeekScheduleBtn = document.getElementById('viewWeekScheduleBtn');
    const weekScheduleModal = document.getElementById('weekScheduleModal');
    const weekScheduleList = document.getElementById('weekScheduleList');
    const closeWeekScheduleModal = document.getElementById('closeWeekScheduleModal');

    viewWeekScheduleBtn.addEventListener('click', async () => {
        weekScheduleList.innerHTML = ''; // Clear the list
        const user = auth.currentUser;

        if (!user) {
            alert("You need to be signed in to view the schedule.");
            return;
        }

        const hrId = user.uid;

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Set to the start of the week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // Set to the end of the week (Saturday)

        const q = query(
            collection(db, "applications"),
            where("status", "==", "Interview Scheduled"),
            where("hrId", "==", hrId) // Filter by the currently signed-in HR
        );

        const querySnapshot = await getDocs(q);
        const interviewsByDay = {};

        const promises = querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const interviewDate = new Date(`${data.interviewDate}T${data.interviewTime}`);

            if (interviewDate >= startOfWeek && interviewDate <= endOfWeek) {
                const userDocRef = doc(db, "users", data.userId);
                const jobDocRef = doc(db, "jobs", data.jobId);

                const [userDoc, jobDoc] = await Promise.all([
                    getDoc(userDocRef),
                    getDoc(jobDocRef)
                ]);

                const fullName = userDoc.exists() ? `${userDoc.data().firstName || ''} ${userDoc.data().lastName || ''}`.trim() : 'Unknown';
                const jobTitle = jobDoc.exists() ? jobDoc.data().title || 'Not specified' : 'Not specified';

                const dayKey = interviewDate.toDateString();
                if (!interviewsByDay[dayKey]) {
                    interviewsByDay[dayKey] = [];
                }

                interviewsByDay[dayKey].push({
                    fullName,
                    jobTitle,
                    interviewDate,
                });
            }
        });

        await Promise.all(promises);

        if (Object.keys(interviewsByDay).length === 0) {
            const noInterviews = document.createElement('li');
            noInterviews.textContent = "No interviews scheduled for this week.";
            weekScheduleList.appendChild(noInterviews);
        } else {
            const fragment = document.createDocumentFragment();

            for (const [day, interviewsForDay] of Object.entries(interviewsByDay)) {
                const dayContainer = document.createElement('div');
                const dayHeader = document.createElement('button');
                const arrowIcon = document.createElement('span');
                const interviewList = document.createElement('ul');

                arrowIcon.className = 'transform transition-transform duration-200 ease-in-out ml-2';
                arrowIcon.innerHTML = '&#9654;'; // Right arrow

                dayHeader.className = 'w-full text-left font-bold py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-t-lg focus:outline-none flex items-center justify-between';
                dayHeader.textContent = day;

                const titleWrapper = document.createElement('div');
                titleWrapper.className = 'flex-1';
                titleWrapper.textContent = day;
                dayHeader.innerHTML = '';
                dayHeader.appendChild(titleWrapper);
                dayHeader.appendChild(arrowIcon);

                interviewList.className = 'space-y-4 p-4 bg-white border border-gray-300 rounded-b-lg hidden';

                dayHeader.addEventListener('click', () => {
                    interviewList.classList.toggle('hidden');
                    arrowIcon.classList.toggle('rotate-90');
                });

                dayContainer.appendChild(dayHeader);
                dayContainer.appendChild(interviewList);

                interviewsForDay.sort((a, b) => a.interviewDate - b.interviewDate);

                for (const interview of interviewsForDay) {
                    const listItem = document.createElement('li');
                    listItem.className = 'p-4 bg-gray-100 rounded-lg border border-gray-300 shadow flex items-start justify-between';

                    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
                    const formattedTime = interview.interviewDate.toLocaleTimeString([], timeOptions);

                    listItem.innerHTML = `
                        <div>
                            <h4 class="text-lg font-bold">${interview.fullName || 'Unknown'}</h4>
                            <p>${formattedTime}</p>
                            <p>Job Title: ${interview.jobTitle || 'Not specified'}</p>
                            <p>Interviewer: You</p>
                        </div>
                    `;

                    interviewList.appendChild(listItem);
                }

                fragment.appendChild(dayContainer);
            }

            weekScheduleList.appendChild(fragment);
        }

        weekScheduleModal.classList.remove('hidden');
    });

    closeWeekScheduleModal.addEventListener('click', () => {
        weekScheduleModal.classList.add('hidden');
    });
});
