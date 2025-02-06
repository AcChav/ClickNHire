// FAQ Dropdown Handling
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const content = button.nextElementSibling;
            content.classList.toggle('hidden');
        });
    });
});