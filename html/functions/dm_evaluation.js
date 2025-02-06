import { auth, db } from '../db/firebase_init.js';
import { collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
    const sectionsContainer = document.getElementById("evaluation-sections");

    // Only proceed if the sectionsContainer exists
    if (sectionsContainer) {
        const criteria = getEvaluationCriteria(); // Get the evaluation criteria data
        let criteriaCounter = 1; // Counter for the criteria sections

        // Iterate over each criterion to generate form sections
        for (let key in criteria) {
            let questionCounter = 1;
            const section = document.createElement("div");
            section.classList.add("form-group");
            section.innerHTML = `
                <h4 class="text-lg font-semibold mt-4">${criteriaCounter}. ${formatKey(key)}</h4>
                <div class="mt-2 space-y-4">
                    ${criteria[key].map((question, index) => `
                        <div class="mt-2">
                            <p class="text-sm text-gray-700 mb-1">${criteriaCounter}.${questionCounter++} ${question}</p>
                            <div class="flex flex-col space-y-2">
                                ${generateRadioOptions(key, index)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            sectionsContainer.appendChild(section); // Add the section to the form
            criteriaCounter++;
        }
    }

    const form = document.getElementById('evaluation-form');
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault(); // Prevent default form submission behavior

            const employeeName = document.getElementById('employeeName').value;
            const employeeId = document.getElementById('employeeId').value;
            const company = document.getElementById('company').value;
            const managerName = document.getElementById('managerName').value;
            const comments = document.getElementById('comments').value;
            const evaluationData = gatherEvaluationData(); // Function to collect evaluation data

            try {
                // Save the evaluation data to Firestore
                const docRef = await addDoc(collection(db, 'evaluations'), {
                    employeeName,
                    employeeId,
                    company,
                    managerName,
                    comments,
                    evaluationData,
                    submittedBy: auth.currentUser.uid,
                    submittedAt: Timestamp.now()
                });

                // Notify HR and client
                notifyHRAndClient(docRef.id, company);

                alert('Evaluation submitted successfully!');
            } catch (error) {
                console.error('Error submitting evaluation: ', error);
                alert('Error submitting evaluation. Please try again.');
            }
        });
    }
});

// Function to gather evaluation data from the form
function gatherEvaluationData() {
    const sections = document.querySelectorAll('#evaluation-sections .form-group');
    const evaluationData = {};

    sections.forEach(section => {
        const sectionTitle = section.querySelector('h4').textContent.trim();
        const questions = section.querySelectorAll('input[type="radio"]:checked');
        evaluationData[sectionTitle] = [];

        questions.forEach(question => {
            evaluationData[sectionTitle].push({
                question: question.name,
                answer: question.value
            });
        });
    });

    return evaluationData;
}

// Function to notify HR and Client (placeholder function)
async function notifyHRAndClient(evaluationId, company) {
    try {
        // Example: Save a notification entry in Firestore
        await addDoc(collection(db, 'notifications'), {
            evaluationId,
            company,
            type: 'evaluation_submitted',
            recipients: ['hr', 'client'],
            createdAt: Timestamp.now()
        });

        console.log(`Notification sent for evaluation ID: ${evaluationId} for company: ${company}`);
    } catch (error) {
        console.error('Error notifying HR and Client: ', error);
    }
}

// Function to return the evaluation criteria data
export function getEvaluationCriteria() {
    return {
        qualityOfWork: [
            "Does the employee consistently meet or exceed quality standards in their work?",
            "How accurate and thorough is the employee's work?",
            "Does the employee take pride in their work and ensure tasks are completed to the best of their ability?",
            "How often does the employee produce work that requires little or no revision?",
            "Does the employee show attention to detail in their tasks?"
        ],
        teamwork: [
            "Does the employee collaborate effectively with team members?",
            "Is the employee willing to assist others in achieving common goals?",
            "How well does the employee communicate within the team?",
            "Does the employee respect and consider the opinions and contributions of others?",
            "How effectively does the employee resolve conflicts within the team?"
        ],
        communicationSkills: [
            "How clearly does the employee convey information in verbal and written communication?",
            "Does the employee actively listen and respond appropriately during discussions?",
            "How well does the employee tailor their communication style to different audiences?",
            "Does the employee provide constructive feedback to peers and subordinates?",
            "How effectively does the employee communicate in high-pressure or challenging situations?"
        ],
        initiative: [
            "Does the employee proactively identify areas for improvement or innovation?",
            "How often does the employee volunteer for new tasks or challenges?",
            "Does the employee take ownership of their work and drive projects forward?",
            "How effectively does the employee seek out new skills or knowledge on their own?",
            "Does the employee demonstrate resourcefulness in solving problems without needing direction?"
        ],
        problemSolving: [
            "How effectively does the employee analyze problems to identify root causes?",
            "Does the employee develop creative and effective solutions to challenges?",
            "How well does the employee anticipate potential problems and take preventative action?",
            "Does the employee remain calm and focused when faced with complex issues?",
            "How successfully does the employee implement solutions to achieve desired outcomes?"
        ]
    };
}

// Function to format the criteria key into a human-readable string
function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Function to generate radio button options for each question
function generateRadioOptions(key, index) {
    const options = ["Poor", "Fair", "Good", "Excellent"];
    return options.map((option, i) => `
        <label class="inline-flex items-center">
            <input type="radio" name="${key}_${index}" value="${i + 1}" class="form-radio text-blue-600" required>
            <span class="ml-2">${option}</span>
        </label>
    `).join('');
}
