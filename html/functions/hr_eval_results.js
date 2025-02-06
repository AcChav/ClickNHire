import { db } from '../../db/firebase_init.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getEvaluationCriteria } from './dm_evaluation.js';  // Import the questions

document.addEventListener('DOMContentLoaded', async () => {
    const evaluationDetails = document.getElementById('evaluationDetails');

    // Fetch the stored document ID from local storage
    const evaluationId = localStorage.getItem('selectedEvaluationId');

    if (!evaluationId) {
        evaluationDetails.innerHTML = '<p>Error: No evaluation ID found. Please select an evaluation from the list.</p>';
        return;
    }

    try {
        // Fetch the evaluation details using the document ID from local storage
        const docRef = doc(db, 'evaluations', evaluationId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            evaluationDetails.innerHTML = '<p>Evaluation not found.</p>';
            return;
        }

        const data = docSnap.data();

        // Fetch the application document to get the userId
        const applicationId = data.employeeName;  // This is the document ID in the applications collection
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));

        if (!applicationDoc.exists()) {
            evaluationDetails.innerHTML = '<p>Application not found.</p>';
            return;
        }

        const applicationData = applicationDoc.data();
        const userId = applicationData.userId; // Extract the userId

        // Fetch the user document to get the employee's name
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            evaluationDetails.innerHTML = '<p>User not found.</p>';
            return;
        }

        const userData = userDoc.data();
        const fullName = `${userData.firstName} ${userData.lastName}`; // Combine first and last name

        // Display evaluation data (First table with answers)
        evaluationDetails.innerHTML = `
          <h3 class="text-xl font-semibold">Employee: ${fullName}</h3> <!-- Display the full name here -->
          <p class="text-gray-600">Company: ${data.company}</p>
          <p class="text-gray-600">Manager: ${data.managerName}</p>
          <p class="text-gray-600 mb-4">Submitted: ${data.submittedAt ? data.submittedAt.toDate().toLocaleString() : 'N/A'}</p>

          <!-- Table for Questions and Answers -->
          <h4 class="text-lg font-semibold">Evaluation with Answers</h4>
          <table class="table-auto w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th class="border border-gray-300 px-4 py-2">Question</th>
                <th class="border border-gray-300 px-4 py-2">Answer</th>
              </tr>
            </thead>
            <tbody id="evaluationTableBody">
            </tbody>
          </table>

          <!-- Table for Only Questions -->
          <h4 class="text-lg font-semibold mt-8">All Evaluation Questions</h4>
          <table class="table-auto w-full border-collapse border border-gray-400">
            <thead>
              <tr>
                <th class="border border-gray-300 px-4 py-2">Question</th>
              </tr>
            </thead>
            <tbody id="questionsTableBody">
            </tbody>
          </table>
        `;

        const evaluationTableBody = document.getElementById('evaluationTableBody');
        const questionsTableBody = document.getElementById('questionsTableBody');
        const evaluationData = data.evaluationData;

        // First table: Populate with answers
        const sortedSections = Object.keys(evaluationData).sort((a, b) => {
            return parseInt(a.split('.')[0], 10) - parseInt(b.split('.')[0], 10);
        });

        sortedSections.forEach(section => {
            // Add the section name as a row header (spanning both columns)
            evaluationTableBody.innerHTML += `
              <tr>
                <td class="bg-gray-200 font-bold border border-gray-300 px-4 py-2" colspan="2">${section}</td>
              </tr>
            `;

            evaluationData[section].forEach((q, index) => {
                const questionNumber = `Q${index + 1}`;
                const rowHTML = `
                  <tr>
                    <td class="border border-gray-300 px-4 py-2">${questionNumber}</td>
                    <td class="border border-gray-300 px-4 py-2">${interpretScore(q.answer)}</td>
                  </tr>
                `;
                evaluationTableBody.innerHTML += rowHTML;
            });
        });

        // Second table: Populate with only questions from getEvaluationCriteria
        const criteria = getEvaluationCriteria();

        Object.keys(criteria).forEach(section => {
            // Add the section name as a row header (spanning both columns)
            questionsTableBody.innerHTML += `
              <tr>
                <td class="bg-gray-200 font-bold border border-gray-300 px-4 py-2" colspan="1">${section.replace(/([A-Z])/g, ' $1').trim()}</td>
              </tr>
            `;

            criteria[section].forEach((question, index) => {
                const rowHTML = `
                  <tr>
                    <td class="border border-gray-300 px-4 py-2">Q${index + 1}: ${question}</td>
                  </tr>
                `;
                questionsTableBody.innerHTML += rowHTML;
            });
        });

    } catch (error) {
        console.error('Error fetching evaluation details:', error);
        evaluationDetails.innerHTML = '<p>Error loading evaluation details. Please try again later.</p>';
    }
});

// Helper function to interpret the scores
function interpretScore(score) {
    const scoreMap = {
        '1': 'Poor',
        '2': 'Fair',
        '3': 'Good',
        '4': 'Excellent'
    };
    return scoreMap[score] || 'No answer';
}
