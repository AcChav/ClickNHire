// mrf.js

// Import necessary Firebase services and validation functions
import { db, auth } from '../db/firebase_init.js';
import { collection, addDoc, getDoc, doc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-auth.js";
import {
    validateContactPerson,
    validateContactPhone,
    validateContactEmail,
    validateJobTitle,
    validateJobDescription,
    validateSkills,
    validateQualifications,
    validateNumberOfPositions,
    validateNumberOfMales,
    validateNumberOfFemales
} from './mrf_validations.js';

let locationData = {};

async function loadLocationData() {
    try {
        const response = await fetch('../../functions/locationData.json');
        locationData = await response.json();
        console.log(locationData);  // Debugging line to ensure data is loaded correctly
    } catch (error) {
        console.error("Error loading location data:", error);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    await loadLocationData();

    const regionSelect = document.getElementById('region');
    const provinceSelect = document.getElementById('province');
    const citySelect = document.getElementById('city');
    const barangayContainer = document.getElementById('barangay-container');

    const provinceContainer = document.getElementById('province-container');
    const cityContainer = document.getElementById('city-container');

    const contactPersonInput = document.getElementById('contact_person');
    const contactPhoneInput = document.getElementById('contact_phone');
    const contactEmailInput = document.getElementById('contact_email');
    const jobTitleInput = document.getElementById('job_title');
    const jobDescriptionInput = document.getElementById('job_description');
    const skillsInput = document.getElementById('skills');
    const qualificationsInput = document.getElementById('qualifications');
    const numberOfPositionsContainer = document.getElementById('number-of-positions-container');
    const numberOfPositionsInput = document.getElementById('number_of_positions');

    const genderSpecificContainer = document.getElementById('gender-specific-container');
    const companyNameInput = document.getElementById('company_name');

    const genderSelect = document.getElementById('gender');
    const numberOfMalesInput = document.getElementById('number_of_males');
    const numberOfFemalesInput = document.getElementById('number_of_females');
    const educationLevelInput = document.getElementById('education_level');


    // Apply validations
    validateContactPerson(contactPersonInput);
    validateContactPhone(contactPhoneInput);
    validateContactEmail(contactEmailInput);
    validateJobTitle(jobTitleInput);
    validateJobDescription(jobDescriptionInput);
    validateSkills(skillsInput);
    validateQualifications(qualificationsInput);
    validateNumberOfPositions(numberOfPositionsInput);
    validateNumberOfMales(numberOfMalesInput);
    validateNumberOfFemales(numberOfFemalesInput);

    // Populate and sort regions alphabetically
    const sortedRegions = Object.keys(locationData).sort();
    sortedRegions.forEach(region => {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    });

    // Populate provinces based on region selection
    regionSelect.addEventListener('change', function () {
        const selectedRegion = regionSelect.value;
        provinceSelect.innerHTML = '<option value="">Select a province</option>';
        citySelect.innerHTML = '<option value="">Select a city/municipality</option>';
        cityContainer.style.display = 'none';
        barangayContainer.style.display = 'none';

        if (selectedRegion && locationData[selectedRegion]) {
            const sortedProvinces = Object.keys(locationData[selectedRegion]).sort();
            sortedProvinces.forEach(province => {
                const option = document.createElement('option');
                option.value = province;
                option.textContent = province;
                provinceSelect.appendChild(option);
            });
            provinceContainer.style.display = 'block';
        } else {
            provinceContainer.style.display = 'none';
        }
    });

    // Populate cities based on province selection
    provinceSelect.addEventListener('change', function () {
        const selectedRegion = regionSelect.value;
        const selectedProvince = provinceSelect.value;
        citySelect.innerHTML = '<option value="">Select a city/municipality</option>';
        barangayContainer.style.display = 'none';

        if (selectedRegion && selectedProvince && locationData[selectedRegion][selectedProvince]) {
            const sortedCities = locationData[selectedRegion][selectedProvince].sort();
            sortedCities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
            cityContainer.style.display = 'block';
        } else {
            cityContainer.style.display = 'none';
        }
    });

    // Show barangay/street address after city selection
    citySelect.addEventListener('change', function () {
        if (citySelect.value) {
            barangayContainer.style.display = 'block';
        } else {
            barangayContainer.style.display = 'none';
        }
    });

    // Function to load and populate company name
    async function loadCompanyName() {
        try {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.companyName) {
                    companyNameInput.value = userData.companyName;
                }
            }
        } catch (error) {
            console.error("Error fetching company name:", error);
        }
    }

    // Wait for Firebase Auth state to be ready
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, so we can load the company name
            loadCompanyName();
        } else {
            console.error("User is not signed in.");
            // Optionally, redirect to the login page
            window.location.href = '/login.html';
        }
    });

    // Handle gender selection change
    genderSelect.addEventListener('change', function () {
        const selectedGender = genderSelect.value;

        if (selectedGender === "Male" || selectedGender === "Female") {
            numberOfPositionsContainer.style.display = 'block';
            genderSpecificContainer.style.display = 'none';
            numberOfMalesInput.required = false;
            numberOfFemalesInput.required = false;
            numberOfPositionsInput.required = true;
            numberOfPositionsInput.value = ''; // Clear previous value
        } else if (selectedGender === "Both gender") {
            numberOfPositionsContainer.style.display = 'none';
            genderSpecificContainer.style.display = 'block';
            numberOfMalesInput.required = true;
            numberOfFemalesInput.required = true;
            numberOfPositionsInput.required = false; // Number of positions will be calculated
            updateTotalPositions(); // Calculate total positions initially
        } else {
            numberOfPositionsContainer.style.display = 'none';
            genderSpecificContainer.style.display = 'none';
            numberOfMalesInput.required = false;
            numberOfFemalesInput.required = false;
            numberOfPositionsInput.required = false;
        }
    });

    // Update total positions and format the number of positions field based on the number of males and females
    function updateTotalPositions() {
        const numberOfMales = parseInt(numberOfMalesInput.value) || 0;
        const numberOfFemales = parseInt(numberOfFemalesInput.value) || 0;
        const totalPositions = numberOfMales + numberOfFemales;

        if (genderSelect.value === "Both gender") {
            numberOfPositionsInput.value = totalPositions > 0
                ? `${numberOfFemales} Females & ${numberOfMales} Males`
                : '';
        } else if (genderSelect.value === "Male" || genderSelect.value === "Female") {
            numberOfPositionsInput.value = totalPositions > 0
                ? `${totalPositions}`
                : '';
        }
    }

    // Event listeners to update the number of positions when the number of males or females changes
    numberOfMalesInput.addEventListener('input', updateTotalPositions);
    numberOfFemalesInput.addEventListener('input', updateTotalPositions);

    // Handle form submission
    const mrfForm = document.getElementById('mrf-form');
    mrfForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show confirmation dialog
        const confirmed = window.confirm("Are you sure you want to submit the form?");
        if (!confirmed) {
            return; // If the user clicks "Cancel", stop the form submission
        }

        // Get form data
        const formData = {
            client_id: auth.currentUser.uid,
            companyName: mrfForm.company_name.value,
            contactPerson: mrfForm.contact_person.value,
            contactEmail: mrfForm.contact_email.value,
            contactPhone: mrfForm.contact_phone.value,
            jobTitle: mrfForm.job_title.value,
            employmentType: mrfForm.employment_type.value,
            region: mrfForm.region.value,
            province: mrfForm.province.value,
            city: mrfForm.city.value,
            barangayStreet: mrfForm.barangay_street.value,
            salaryRange: mrfForm.salary_range.value,
            numberOfPositions: mrfForm.number_of_positions.value,
            numberOfMales: mrfForm.number_of_males.value || 0,
            numberOfFemales: mrfForm.number_of_females.value || 0,
            requiredExperience: mrfForm.required_experience.value,
            educationLevel: mrfForm.education_level.value, // <-- Added here
            jobDescription: mrfForm.job_description.value,
            gender: mrfForm.gender.value,
            skills: mrfForm.skills.value,
            qualifications: mrfForm.qualifications.value,
            timestamp: new Date(),
            status: "Pending" // Set default status as "Pending"
        };
        
        try {
            // Add the data to Firestore
            const docRef = await addDoc(collection(db, "mrf_submissions"), formData);
            console.log("Document written with ID: ", docRef.id);

            // Redirect or notify the user
            alert("MRF successfully submitted.");
            window.location.href = 'mrf.html';
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("There was an error submitting the form. Please try again.");
        }
    });
});
