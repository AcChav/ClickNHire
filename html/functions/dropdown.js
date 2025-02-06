// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const accountButton = document.getElementById('accountButton');
    const accountDropdown = document.getElementById('accountDropdown');

    if (accountButton && accountDropdown) {
        // Toggle dropdown visibility and update accessibility attribute
        const toggleDropdown = (event) => {
            event.stopPropagation();
            const isOpen = accountDropdown.classList.toggle('hidden');
            accountButton.setAttribute('aria-expanded', !isOpen);
        };

        // Close dropdown if click occurs outside the button or dropdown
        const closeDropdown = (event) => {
            if (!accountButton.contains(event.target) && !accountDropdown.contains(event.target)) {
                accountDropdown.classList.add('hidden');
                accountButton.setAttribute('aria-expanded', false);
            }
        };

        // Attach event listeners for dropdown toggle and close
        accountButton.addEventListener('click', debounce(toggleDropdown, 200));
        document.addEventListener('click', closeDropdown);
    }
});

// Debounce function to limit the rate of event firing
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
