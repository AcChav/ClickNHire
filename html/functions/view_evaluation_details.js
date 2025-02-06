import { auth, db } from '../db/firebase_init.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getEvaluationCriteria } from '../../functions/dm_evaluation.js'; // Import getEvaluationCriteria

document.addEventListener("DOMContentLoaded", async () => {
    const evaluationDetails = document.getElementById('evaluation-details');

    // Retrieve the evaluationId from sessionStorage
    const evaluationId = sessionStorage.getItem('selectedEvaluationId');

    if (!evaluationId) {
        evaluationDetails.innerHTML = '<p>No evaluation ID provided.</p>';
        return;
    }

    try {
        // Fetch the specific evaluation document by its document ID
        const evaluationDoc = await getDoc(doc(db, 'evaluations', evaluationId));

        if (!evaluationDoc.exists()) {
            evaluationDetails.innerHTML = '<p>Evaluation not found.</p>';
            return;
        }

        const evaluationData = evaluationDoc.data();
        console.log('Evaluation Data:', evaluationData);  // Log the evaluationData for debugging

        // Interpretation map for the answers
        const scoreInterpretation = {
            "1": "Poor",
            "2": "Fair",
            "3": "Good",
            "4": "Excellent"
        };

        // Extract and log interpreted answers, total scores, and averages
        const interpretedAnswers = {};
        const sectionScores = {}; // Track total scores for each section
        const sectionAverages = {}; // Track average scores for each section
        const sectionInterpretations = {}; // Track the interpretation of the average score
        let totalAverage = 0; // For calculating the grand average
        let sectionCount = 0; // Track the number of sections

        for (let sectionKey in evaluationData.evaluationData) {
            let sectionTotalScore = 0;
            interpretedAnswers[sectionKey] = evaluationData.evaluationData[sectionKey].map(item => {
                const answerScore = parseInt(item.answer);
                sectionTotalScore += answerScore; // Sum up the scores for the section
                return scoreInterpretation[item.answer] || "No answer";
            });

            // Calculate the average for the section
            const numberOfQuestions = evaluationData.evaluationData[sectionKey].length;
            const sectionAverage = (sectionTotalScore / numberOfQuestions).toFixed(2); // Rounded to 2 decimal places
            totalAverage += parseFloat(sectionAverage); // Add to total for grand average
            sectionCount++;

            // Interpret the average score
            let interpretation;
            if (sectionAverage >= 3.5) {
                interpretation = "Excellent";
            } else if (sectionAverage >= 2.5) {
                interpretation = "Good";
            } else if (sectionAverage >= 1.5) {
                interpretation = "Fair";
            } else {
                interpretation = "Poor";
            }

            sectionScores[sectionKey] = sectionTotalScore; // Store total score
            sectionAverages[sectionKey] = sectionAverage; // Store average score
            sectionInterpretations[sectionKey] = interpretation; // Store interpretation
        }

        console.log('Interpreted Answers:', interpretedAnswers);  // Log interpreted answers
        console.log('Section Scores:', sectionScores);  // Log section scores
        console.log('Section Averages:', sectionAverages);  // Log section averages
        console.log('Section Interpretations:', sectionInterpretations);  // Log section interpretations

        // Calculate the grand average
        const grandAverage = (totalAverage / sectionCount).toFixed(2);

        // Interpretation of the grand average
        let grandAverageInterpretation;
        if (grandAverage >= 3.5) {
            grandAverageInterpretation = "Excellent";
        } else if (grandAverage >= 2.5) {
            grandAverageInterpretation = "Good";
        } else if (grandAverage >= 1.5) {
            grandAverageInterpretation = "Fair";
        } else {
            grandAverageInterpretation = "Poor";
        }

        const applicationId = evaluationData.employeeName; // This is the document ID in the applications collection

        // Fetch the application to retrieve the userId
        const applicationDoc = await getDoc(doc(db, 'applications', applicationId));
        if (!applicationDoc.exists()) {
            evaluationDetails.innerHTML = '<p>Application not found.</p>';
            return;
        }

        const applicationData = applicationDoc.data();
        const userId = applicationData.userId; // Extract the userId from the application document

        // Fetch the user data to retrieve the employee's first and last name
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            evaluationDetails.innerHTML = '<p>User not found.</p>';
            return;
        }

        const userData = userDoc.data();
        const fullName = `${userData.firstName} ${userData.lastName}`; // Combine first and last name

        // Fetch the criteria for displaying questions
        const criteria = getEvaluationCriteria();

        const comments = evaluationData.comments || "No comments available.";

        // Add the print button
        let detailsHTML = `
            <h3 class="text-lg font-semibold mb-4">Employee Information</h3>
            <p><strong>Employee Name:</strong> ${fullName}</p> <!-- Display the full name -->
            <p><strong>Employee ID:</strong> ${evaluationData.employeeId}</p>
            <p><strong>Company:</strong> ${evaluationData.company}</p>
            <p><strong>Manager Name:</strong> ${evaluationData.managerName}</p>
            <p><strong>Date Submitted:</strong> ${evaluationData.submittedAt ? evaluationData.submittedAt.toDate().toLocaleDateString() : 'N/A'}</p>
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold mt-6 mb-4">Interpreted Evaluation Answers</h3>
                <button id="print-btn" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">Print Evaluation</button>
            </div>
            <table class="min-w-full border border-black border-collapse">
                <thead>
                    <tr>
                        <th class="border border-black px-4 py-2">Section</th>
                        <th class="border border-black px-4 py-2">Interpreted Answers</th>
                        <th class="border border-black px-4 py-2">Total Score</th>
                        <th class="border border-black px-4 py-2">Average Score</th>
                        <th class="border border-black px-4 py-2">Interpretation</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Sort the interpretedAnswers keys based on the sectionNumber
        const sortedSections = Object.keys(interpretedAnswers).sort((a, b) => {
            const sectionA = parseInt(a.split('.')[0]);
            const sectionB = parseInt(b.split('.')[0]);
            return sectionA - sectionB;
        });

        // Loop through the sorted interpreted answers and render them in a new table
        for (let sectionKey of sortedSections) {
            detailsHTML += `
                <tr>
                    <td class="border border-black px-4 py-2">${formatKey(sectionKey)}</td>
                    <td class="border border-black px-4 py-2">${interpretedAnswers[sectionKey].join(', ')}</td>
                    <td class="border border-black px-4 py-2">${sectionScores[sectionKey]}</td>
                    <td class="border border-black px-4 py-2">${sectionAverages[sectionKey]}</td>
                    <td class="border border-black px-4 py-2">${sectionInterpretations[sectionKey]}</td>
                </tr>
            `;
        }

        // Add the grand average row
        detailsHTML += `
            <tr>
                <td colspan="3" class="border border-black px-4 py-2 font-bold text-left">Grand Average</td>
                <td class="border border-black px-4 py-2 font-bold">${grandAverage}</td>
                <td class="border border-black px-4 py-2 font-bold">${grandAverageInterpretation}</td>
            </tr>
        `;

        detailsHTML += `</tbody></table>`;

        // Add the comments section
        detailsHTML += `
                <h3 class="text-lg font-semibold mt-6 mb-4">Comments</h3>
                <p>${comments}</p>
            `;

        // Add the Evaluation Details table after the Interpreted Evaluation table
        detailsHTML += `
            <h3 class="text-lg font-semibold mt-6 mb-4">Evaluation Details</h3>
            <table class="min-w-full border border-black border-collapse">
                <thead>
                    <tr>
                        <th class="border border-black px-4 py-2">Question</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let sectionNumber = 1; // Start section numbering

        // Iterate over the criteria and render questions without answers
        for (let sectionKey in criteria) {
            detailsHTML += `<tr><td colspan="2" class="font-semibold border border-black px-4 py-2">${sectionNumber}. ${formatKey(sectionKey)}</td></tr>`;

            criteria[sectionKey].forEach((question, index) => {
                // Generate question number in format: sectionNumber.subQuestionNumber
                const questionNumber = `${sectionNumber}.${index + 1}`;

                // Display the question in the table
                detailsHTML += `
                    <tr>
                        <td class="border border-black px-4 py-2">${questionNumber} ${question}</td>
                    </tr>
                `;
            });

            sectionNumber++; // Increment section number
        }

        detailsHTML += `</tbody></table>`;

        evaluationDetails.innerHTML = detailsHTML;

        // Add the print functionality
        const printButton = document.getElementById('print-btn');
        printButton.addEventListener('click', () => {
            const elementToPrint = document.getElementById('evaluation-details'); // The element you want to print

            // Hide the print button before printing
            printButton.style.display = 'none';

            // Use html2pdf to generate a PDF and download it
            html2pdf()
                .from(elementToPrint)
                .set({
                    margin: 0.5,
                    filename: `Evaluation-${userData.lastName}-${userData.firstName}.pdf`, // Using the last name in the filename
                    html2canvas: { scale: 2 },
                    jsPDF: { orientation: 'portrait', unit: 'in', format: 'letter' }
                })
                .save()
                .then(() => {
                    // Show the print button again after downloading the PDF
                    printButton.style.display = 'block';
                });
        });

    } catch (error) {
        console.error('Error fetching evaluation details:', error);
        evaluationDetails.innerHTML = '<p>Error loading evaluation details. Please try again later.</p>';
    }
});

// Utility function to format the criteria key into a human-readable string
function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}
