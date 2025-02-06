import { fetchJobs, addJob, updateJob, deleteJob } from './api.js';
import { renderJobList, showModal, hideModal, showConfirmation, escapeHTML, populateDropdown, renderJobDetailsModal, showDeleteConfirmationModal, hideDeleteConfirmationModal } from './dom.js';

let state = {
    currentJob: null,
    jobs: [],
    jobToDeleteId: null,
};

// Load location data asynchronously
async function loadLocationData() {
    try {
        const response = await fetch('../../functions/locationData.json');
        state.locationData = await response.json();
    } catch (error) {
        console.error("Error loading location data:", error);
    }
}

loadLocationData(); // Start loading data

// Initialize event listeners
export function initializeEventListeners() {
    // Load location data
    loadLocationData();

    // Event listener for creating a new job
    document.getElementById('createJobButton').addEventListener('click', () => {
        state.currentJob = null;
        document.getElementById('jobForm').reset();
        document.getElementById('modalTitle').textContent = 'Create Job Post';

        // Clear and populate location dropdowns
        const jobRegionField = document.getElementById('jobRegion');
        const jobProvinceField = document.getElementById('jobProvince');
        const jobCityField = document.getElementById('jobCity');
        const jobBarangayStreetField = document.getElementById('jobBarangayStreet');

        populateDropdown(jobRegionField, Object.keys(state.locationData).map(region => ({ value: region, text: region })), "Select Region");

        // Attach event listeners for dynamic dropdown population
        jobRegionField.addEventListener('change', function () {
            const selectedRegion = this.value;
            populateDropdown(jobProvinceField, Object.keys(state.locationData[selectedRegion] || {}).map(province => ({ value: province, text: province })), "Select Province");
            jobCityField.innerHTML = '<option value="">Select City/Municipality</option>';
        });

        jobProvinceField.addEventListener('change', function () {
            const selectedRegion = jobRegionField.value;
            const selectedProvince = this.value;
            populateDropdown(jobCityField, (state.locationData[selectedRegion]?.[selectedProvince] || []).map(city => ({ value: city, text: city })), "Select City/Municipality");
        });

        showModal('jobModal');
    });

    // Event listener for form submission (create or update job)
    document.getElementById('jobForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Gather all the form data
        const jobData = {
            company: document.getElementById('company')?.value.trim() || '',
            contactPerson: document.getElementById('contactPerson')?.value.trim() || '',
            contactEmail: document.getElementById('contactEmail')?.value.trim() || '',
            contactPhone: document.getElementById('contactPhone')?.value.trim() || '',
            title: document.getElementById('jobTitle')?.value.trim() || '',
            location: `${document.getElementById('jobRegion')?.value.trim() || ''}, ${document.getElementById('jobProvince')?.value.trim() || ''}, ${document.getElementById('jobCity')?.value.trim() || ''}, ${document.getElementById('jobBarangayStreet')?.value.trim() || ''}`,
            employmentType: document.getElementById('employmentType')?.value.trim() || '',
            description: document.getElementById('jobDescription')?.value.trim() || '',
            gender: document.getElementById('jobGender')?.value.trim() || '',
            numberOfPositions: document.getElementById('numberOfPositions')?.value.trim() || '',
            numberOfMales: document.getElementById('numberOfMales')?.value.trim() || '',
            numberOfFemales: document.getElementById('numberOfFemales')?.value.trim() || '',
            educationLevel: document.getElementById('educationLevel')?.value.trim() || '',
            skills: document.getElementById('jobSkills')?.value.trim() || '',
            qualifications: document.getElementById('jobQualifications')?.value.trim() || '',
            salaryRange: document.getElementById('salaryRange')?.value.trim() || '',
            requiredExperience: document.getElementById('requiredExperience')?.value.trim() || '',
            timestamp: new Date(),
        };

        try {
            if (state.currentJob) {
                // Update the existing job
                await updateJob(state.currentJob, jobData);
                showConfirmation('Job updated successfully!');
            } else {
                // Create a new job
                await addJob(jobData);
                showConfirmation('Job created successfully!');
            }
            hideModal('jobModal');
            loadJobs(); // Refresh the job list after saving
        } catch (error) {
            console.error("Error saving job: ", error);
            showConfirmation('Error saving job. Please try again.');
        }
    });

    // Event listener for confirming job deletion
    document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
        if (state.jobToDeleteId) {
            try {
                await deleteJob(state.jobToDeleteId);
                loadJobs();
                hideDeleteConfirmationModal();
                showConfirmation('Job deleted successfully!');
            } catch (error) {
                console.error("Error deleting job: ", error);
                showConfirmation('Error deleting job. Please try again.');
            }
        }
    });

    // Event listeners for canceling actions
    document.getElementById('cancelDeleteButton').addEventListener('click', () => {
        state.jobToDeleteId = null;
        hideDeleteConfirmationModal();
    });

    document.getElementById('cancelButton').addEventListener('click', () => hideModal('jobModal'));
    document.getElementById('closePreviewButton').addEventListener('click', () => hideModal('previewModal'));
    document.getElementById('closeConfirmationButton').addEventListener('click', () => hideModal('confirmationModal'));
}

// Load jobs from the database and render them
export async function loadJobs() {
    try {
        const jobs = await fetchJobs();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const employmentType = document.getElementById('employmentTypeFilter').value;
        const location = document.getElementById('locationFilter').value;

        // Filter jobs based on search term and selected filters
        const filteredJobs = jobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm) || job.company.toLowerCase().includes(searchTerm);
            const matchesEmploymentType = employmentType ? job.employmentType === employmentType : true;
            const matchesLocation = location ? job.location.includes(location) : true;
            return matchesSearch && matchesEmploymentType && matchesLocation;
        });

        state.jobs = filteredJobs;
        renderJobList(filteredJobs, handleViewJob, handleEditJob, handleDeleteJob);
    } catch (error) {
        console.error("Error fetching jobs: ", error);
    }
}

// Handle viewing job details
function handleViewJob(event) {
    const jobId = event.target.getAttribute('data-id');
    const job = state.jobs.find(job => job.id === jobId);

    if (job) {
        renderJobDetailsModal(job); // Render the job details modal using dom.js
    } else {
        console.error('Job not found with ID:', jobId);
    }
}

// Handle editing a job
function handleEditJob(event) {
    const jobId = event.target.getAttribute('data-id');
    const job = state.jobs.find(job => job.id === jobId);

    if (job) {
        state.currentJob = jobId;

        document.getElementById('company').value = job.company || '';
        document.getElementById('contactPerson').value = job.contactPerson || '';
        document.getElementById('contactEmail').value = job.contactEmail || '';
        document.getElementById('contactPhone').value = job.contactPhone || '';
        document.getElementById('jobTitle').value = job.title || '';
        document.getElementById('employmentType').value = job.employmentType || '';
        document.getElementById('salaryRange').value = job.salaryRange || '';
        document.getElementById('jobGender').value = job.gender || '';
        document.getElementById('numberOfPositions').value = job.numberOfPositions || '';
        document.getElementById('numberOfMales').value = job.numberOfMales || '';
        document.getElementById('numberOfFemales').value = job.numberOfFemales || '';
        document.getElementById('requiredExperience').value = job.requiredExperience || '';
        document.getElementById('jobDescription').value = job.description || '';
        document.getElementById('jobSkills').value = job.skills || '';
        document.getElementById('jobQualifications').value = job.qualifications || '';
        document.getElementById('educationLevel').value = job.educationLevel || '';  // <-- Added this line

        // Handle location dropdowns...
        const jobRegionField = document.getElementById('jobRegion');
        const jobProvinceField = document.getElementById('jobProvince');
        const jobCityField = document.getElementById('jobCity');
        const jobBarangayStreetField = document.getElementById('jobBarangayStreet');

        if (job.location) {
            const locationParts = job.location.split(',').map(part => part.trim());
            const region = locationParts[0] || '';
            const province = locationParts[1] || '';
            const city = locationParts[2] || '';

            populateDropdown(jobRegionField, Object.keys(state.locationData).map(regionName => ({ value: regionName, text: regionName })), "Select Region");

            jobRegionField.value = region;

            if (region && state.locationData[region]) {
                populateDropdown(jobProvinceField, Object.keys(state.locationData[region]).map(provinceName => ({ value: provinceName, text: provinceName })), "Select Province");
                jobProvinceField.value = province;
            }

            if (province && state.locationData[region] && state.locationData[region][province]) {
                populateDropdown(jobCityField, state.locationData[region][province].map(cityName => ({ value: cityName, text: cityName })), "Select City/Municipality");
                jobCityField.value = city;
            }
        }

        jobRegionField.addEventListener('change', function () {
            const selectedRegion = this.value;
            populateDropdown(jobProvinceField, Object.keys(state.locationData[selectedRegion] || {}).map(province => ({ value: province, text: province })), "Select Province");
            jobCityField.innerHTML = '<option value="">Select City/Municipality</option>';
        });

        jobProvinceField.addEventListener('change', function () {
            const selectedRegion = jobRegionField.value;
            const selectedProvince = this.value;
            populateDropdown(jobCityField, (state.locationData[selectedRegion]?.[selectedProvince] || []).map(city => ({ value: cityName, text: cityName })), "Select City/Municipality");
        });

        // Add the gender selection logic
        const genderField = document.getElementById('jobGender');
        const numberOfPositionsField = document.getElementById('numberOfPositionsContainer');
        const numberOfMalesField = document.getElementById('numberOfMalesContainer');
        const numberOfFemalesField = document.getElementById('numberOfFemalesContainer');

        function handleGenderChange() {
            if (genderField.value === 'Both gender') {
                numberOfPositionsField.classList.add('hidden');
                numberOfMalesField.classList.remove('hidden');
                numberOfFemalesField.classList.remove('hidden');
            } else {
                numberOfPositionsField.classList.remove('hidden');
                numberOfMalesField.classList.add('hidden');
                numberOfFemalesField.classList.add('hidden');
            }
        }

        // Set the correct visibility based on the current gender value
        handleGenderChange();

        // Attach the event listener to handle changes in gender selection
        genderField.addEventListener('change', handleGenderChange);

        document.getElementById('modalTitle').textContent = 'Edit Job Post';
        showModal('jobModal');
    } else {
        console.error('Job not found with ID:', jobId);
    }
}

// Handle deleting a job
function handleDeleteJob(event) {
    state.jobToDeleteId = event.target.getAttribute('data-id');
    showDeleteConfirmationModal();
}
