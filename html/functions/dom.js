// dom.js

// Utility to show a modal
export function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// Utility to hide a modal
export function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Utility to display confirmation messages
export function showConfirmation(message) {
    const confirmationModal = document.getElementById('confirmationModal');
    const messageElement = confirmationModal.querySelector('.message');

    if (messageElement) {
        messageElement.textContent = message;
        showModal('confirmationModal');
    } else {
        console.error('Confirmation message element not found.');
    }
}

// Utility to escape HTML to prevent XSS attacks
export function escapeHTML(string) {
    const div = document.createElement('div');
    div.textContent = string;
    return div.innerHTML;
}

// Utility to populate dropdowns dynamically
export function populateDropdown(selectElement, options, defaultOption = "Select an option") {
    selectElement.innerHTML = `<option value="">${defaultOption}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        selectElement.appendChild(opt);
    });
}

// Renders the list of job postings and handles user interactions with each job.
export function renderJobList(jobs, handleView, handleEdit, handleDelete) {
    const jobListContainer = document.getElementById('jobList');
    jobListContainer.innerHTML = ''; // Clear the current job list

    const locationFilter = document.getElementById('locationFilter');

    // Initialize location options only if the dropdown is empty
    if (locationFilter.children.length === 1) { // Assuming the first child is the default option
        const locations = new Set(jobs.map(job => job.location));
        populateDropdown(locationFilter, Array.from(locations).map(loc => ({ value: loc, text: loc })), "Filter by Location");
    }

    jobs.forEach(job => {
        const jobItem = document.createElement('div');
        jobItem.className = 'job-item p-4 border border-gray-300 rounded-lg mb-4 bg-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center';

        // Conditional logic for numberOfPositions
        let numberOfPositionsText = 'Not specified';
        if (job.gender === 'Both gender') {
            numberOfPositionsText = `${job.numberOfFemales || 0} Females & ${job.numberOfMales || 0} Males`;
        } else if (job.gender === 'Male' || job.gender === 'Female') {
            numberOfPositionsText = job.numberOfPositions || 'Not specified';
        }

        jobItem.innerHTML = `
            <div class="content flex-1 mb-4 md:mb-0">
                <h3 class="text-lg font-semibold text-gray-800">Job title: ${escapeHTML(job.title)}</h3>
                <p class="font-medium text-gray-600">Number of Positions: ${escapeHTML(numberOfPositionsText)}</p>
                <p class="font-medium text-gray-600">Company Name: ${escapeHTML(job.company)}</p>
                <p class="font-medium text-gray-600">Employment Type: ${escapeHTML(job.employmentType)}</p>
                <p class="font-medium text-gray-600">Job Location: ${escapeHTML(job.location)}</p>
            </div>
            <div class="buttons flex space-x-2 mt-2 md:mt-0">
                <button class="view-btn px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" data-id="${job.id}">View</button>
                <button class="edit-btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" data-id="${job.id}">Edit</button>
                <button class="delete-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" data-id="${job.id}">Delete</button>
            </div>
        `;

        jobItem.querySelector('.view-btn').addEventListener('click', handleView);
        jobItem.querySelector('.edit-btn').addEventListener('click', handleEdit);
        jobItem.querySelector('.delete-btn').addEventListener('click', handleDelete);

        jobListContainer.appendChild(jobItem);
    });
}

// Render job details in a modal
export function renderJobDetailsModal(job) {
    document.getElementById('viewJobCompany').textContent = escapeHTML(job.company || 'Not specified');
    document.getElementById('viewJobContactPerson').textContent = escapeHTML(job.contactPerson || 'Not specified');
    document.getElementById('viewJobContactEmail').textContent = escapeHTML(job.contactEmail || 'Not specified');
    document.getElementById('viewJobContactPhone').textContent = escapeHTML(job.contactPhone || 'Not specified');
    document.getElementById('viewJobTitle').textContent = escapeHTML(job.title || 'Not specified');
    document.getElementById('viewJobEmploymentType').textContent = escapeHTML(job.employmentType || 'Not specified');
    document.getElementById('viewJobLocation').textContent = escapeHTML(job.location || 'Not specified');
    document.getElementById('viewJobSalaryRange').textContent = escapeHTML(job.salaryRange || 'Not specified');
    document.getElementById('viewJobGender').textContent = escapeHTML(job.gender || 'Not specified');

    let numberOfPositionsText = 'Not specified';
    if (job.gender === 'Both gender') {
        numberOfPositionsText = `${job.numberOfFemales || 0} Females & ${job.numberOfMales || 0} Males`;
    } else if (job.gender === 'Male' || job.gender === 'Female') {
        numberOfPositionsText = job.numberOfPositions || 'Not specified';
    }
    document.getElementById('viewJobNumberOfPositions').textContent = escapeHTML(numberOfPositionsText);

    document.getElementById('viewJobRequiredExperience').textContent = escapeHTML(job.requiredExperience || 'Not specified');
    document.getElementById('viewJobEducation').textContent = escapeHTML(job.educationLevel || 'Not specified');
    document.getElementById('viewJobDescription').textContent = escapeHTML(job.description || 'Not specified');
    document.getElementById('viewJobSkills').textContent = escapeHTML(job.skills || 'Not specified');
    document.getElementById('viewJobQualifications').textContent = escapeHTML(job.qualifications || 'Not specified');
    document.getElementById('viewJobSubmittedAt').textContent = job.timestamp ? new Date(job.timestamp.seconds * 1000).toLocaleString() : 'Not specified';

    showModal('previewModal');
}

// Utility to show a delete confirmation modal
export function showDeleteConfirmationModal() {
    showModal('deleteConfirmationModal');
}

// Utility to hide a delete confirmation modal
export function hideDeleteConfirmationModal() {
    hideModal('deleteConfirmationModal');
}
