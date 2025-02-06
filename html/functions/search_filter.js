document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const interviewPassedList = document.getElementById('interviewPassedList');
    const employeesList = document.getElementById('employeesList');

    const filterApplicants = () => {
        const searchQuery = searchInput.value.toLowerCase();
        const statusQuery = statusFilter.value;

        [interviewPassedList, employeesList].forEach(list => {
            Array.from(list.children).forEach(item => {
                const fullName = item.querySelector('h4').textContent.toLowerCase();
                const jobTitle = item.querySelector('p').textContent.toLowerCase();
                const status = item.querySelectorAll('p')[1].textContent;

                const matchesSearch = fullName.includes(searchQuery) || jobTitle.includes(searchQuery);
                const matchesStatus = !statusQuery || status.includes(statusQuery);

                item.style.display = matchesSearch && matchesStatus ? '' : 'none';
            });
        });
    };

    searchInput.addEventListener('input', filterApplicants);
    statusFilter.addEventListener('change', filterApplicants);
});
