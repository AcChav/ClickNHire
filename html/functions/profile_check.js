function dismissNotice() {
    // Hide the notice section
    const noticeSection = document.getElementById('noticeSection');
    noticeSection.classList.add('hidden');
    
    // Store the dismissal in local storage
    localStorage.setItem('jobBoardNoticeDismissed', 'true');
    
    // Optionally, set focus to the main content after dismissal for accessibility
    const mainContent = document.querySelector('main');
    if (mainContent) {
        mainContent.focus();
    }
}

// Check if the notice was previously dismissed
document.addEventListener('DOMContentLoaded', () => {
    const isDismissed = localStorage.getItem('jobBoardNoticeDismissed');
    const noticeSection = document.getElementById('noticeSection');
    
    if (isDismissed === 'true' && noticeSection) {
        noticeSection.classList.add('hidden');
    }
});
