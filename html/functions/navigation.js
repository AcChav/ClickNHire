document.addEventListener('DOMContentLoaded', () => {
    const navApplicantsSchedule = document.getElementById('navApplicantsSchedule');
    const navRescheduleCancel = document.getElementById('navRescheduleCancel');
    const navInterviewResults = document.getElementById('navInterviewResults');

    // Scroll to Applicants Schedule section
    navApplicantsSchedule.addEventListener('click', () => {
        document.getElementById('interviewApplicants').scrollIntoView({ behavior: 'smooth' });
    });

    // Scroll to Reschedule/Cancel Interview section
    navRescheduleCancel.addEventListener('click', () => {
        document.getElementById('rescheduleCancelSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Scroll to Interview Results section
    navInterviewResults.addEventListener('click', () => {
        document.getElementById('interviewResultsSection').scrollIntoView({ behavior: 'smooth' });
    });
});
