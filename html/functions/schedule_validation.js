// schedule_validation.js

document.addEventListener('DOMContentLoaded', () => {
    const interviewDateInput = document.getElementById('interviewDate');
    
    // Ensure interview date input does not allow past dates
    interviewDateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    
    interviewDateInput.addEventListener('input', (event) => {
        const selectedDate = new Date(event.target.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison

        if (selectedDate < today) {
            alert("You cannot select a past date for the interview.");
            event.target.value = today.toISOString().split('T')[0];
        }
    });
});
