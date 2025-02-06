// html/functions/modal.js

/**
 * modal.js
 * 
 * Handles displaying modals for registration success or failure.
 */

document.addEventListener('DOMContentLoaded', function () {

    // Function to show the modal with the given message
    function showModal(message, isSuccess) {
        const modal = document.getElementById('modal');
        const modalMessage = document.getElementById('modalMessage');
        const modalCloseButton = document.getElementById('modalCloseButton');

        modalMessage.textContent = message;
        modal.style.display = 'block';

        if (isSuccess) {
            modal.classList.remove('bg-red-100', 'border-red-500');
            modal.classList.add('bg-green-100', 'border-green-500');
        } else {
            modal.classList.remove('bg-green-100', 'border-green-500');
            modal.classList.add('bg-red-100', 'border-red-500');
        }

        modalCloseButton.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    }

    // Export the showModal function for use in other scripts
    window.showModal = showModal;
});
