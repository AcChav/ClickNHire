// evaluation_average.js

// Function to calculate the weighted average of the evaluation form
function calculateWeightedAverage(evaluationData) {
    let totalScore = 0;
    let totalQuestions = 0;

    // Iterate through each section in the evaluation data
    for (let section in evaluationData) {
        evaluationData[section].forEach(question => {
            totalScore += parseInt(question.answer); // Add the score (answer) for each question
            totalQuestions++; // Increment the question count
        });
    }

    // Calculate the weighted average
    const weightedAverage = totalScore / totalQuestions;

    console.log(`Total Score: ${totalScore}, Total Questions: ${totalQuestions}`);
    console.log(`Weighted Average: ${weightedAverage.toFixed(2)}`);

    return weightedAverage.toFixed(2); // Return the average rounded to 2 decimal places
}

// Function to display the weighted average after the form is submitted
function displayWeightedAverage() {
    const evaluationData = gatherEvaluationData(); // Ensure this function exists and returns the evaluation data
    const average = calculateWeightedAverage(evaluationData);

    // Log the weighted average to the console for debugging
    console.log(`Weighted Average Score: ${average}`);

    // Optionally display the average to the user
    alert(`Weighted Average Score: ${average}`);
}

// Attach the display function to the form's submit event (assuming this runs after DOM is loaded)
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById('evaluation-form');
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent form submission
            displayWeightedAverage(); // Calculate and display the weighted average
            form.submit(); // Optionally submit the form after displaying the average
        });
    }
});
