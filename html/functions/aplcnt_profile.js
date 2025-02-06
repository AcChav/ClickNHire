/**
 * This script manages the user profile page, including fetching and displaying user data 
 * from Firebase Firestore, handling profile updates, and managing the upload and deletion 
 * of resumes in Firebase Storage.
 */

import db from '../db/firebase_firestore.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js";
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js'; // Import the loading function

// Initialize Firebase storage service
const storage = getStorage();

// DOM elements for user profile and resume handling
const userNameElement = document.getElementById('userName');
const userEmailElement = document.getElementById('userEmail');
const userLocationElement = document.getElementById('userLocation');
const resumeFileNameElement = document.getElementById('resumeFileName');
const resumeInput = document.getElementById('resumeInput');
const uploadResumeButton = document.getElementById('uploadResumeButton');
const deleteResumeButton = document.getElementById('deleteResumeButton');
const uploadStatusElement = document.getElementById('uploadStatus');
const deleteModal = document.getElementById('deleteModal');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');

// DOM elements for location handling
const regionSelect = document.getElementById('editRegion');
const provinceSelect = document.getElementById('editProvince');
const citySelect = document.getElementById('editCity');
const barangayInput = document.getElementById('editBarangay'); // Changed to input type

// DOM elements for qualifications handling
const editQualificationsButton = document.getElementById('editQualificationsButton');
const editQualificationsForm = document.getElementById('editQualificationsForm');
const saveQualificationsButton = document.getElementById('saveQualificationsButton');
const cancelQualificationsButton = document.getElementById('cancelQualificationsButton');
const userEducationElement = document.getElementById('userEducation');
const userGenderElement = document.getElementById('userGender');
const userSkillsElement = document.getElementById('userSkills');
const userExperienceElement = document.getElementById('userExperience');

const editEducation = document.getElementById('editEducation');
const editGender = document.getElementById('editGender');
const editSkills = document.getElementById('editSkills');
const editExperience = document.getElementById('editExperience');

let userDocRef;

// DOM elements for profile editing
const editProfileButton = document.getElementById('editProfileButton');
const editProfileForm = document.getElementById('editProfileForm');
const saveProfileButton = document.getElementById('saveProfileButton');
const cancelEditButton = document.getElementById('cancelEditButton');

const editFirstName = document.getElementById('editFirstName');
const editLastName = document.getElementById('editLastName');

let originalProfileData = {};

// Helper function to set the upload status
function setUploadStatus(message, isSuccess) {
    uploadStatusElement.textContent = message;
    uploadStatusElement.classList.toggle('text-green-600', isSuccess);
    uploadStatusElement.classList.toggle('text-red-600', !isSuccess);
}

// Maximum file size for the resume upload
const MAX_FILE_SIZE_MB = 10; // 10 MB limit

// Function to fetch and initialize location data
async function initializeLocationData() {
    try {
        const response = await fetch('../../functions/locationData.json'); // Adjust the path if needed
        if (!response.ok) throw new Error('Failed to load location data');
        const locationData = await response.json();
        populateRegions(locationData);
    } catch (error) {
        console.error('Error fetching location data:', error);
    }
}

// Populate the region dropdown
function populateRegions(locationData) {
    for (const region in locationData) {
        const option = document.createElement('option');
        option.value = region;
        option.textContent = region;
        regionSelect.appendChild(option);
    }
}

// Populate the province dropdown based on selected region
function populateProvinces(region, locationData) {
    provinceSelect.innerHTML = '<option value="">Select your province</option>';
    provinceSelect.disabled = false;
    citySelect.innerHTML = '<option value="">Select your city/municipality</option>';
    citySelect.disabled = true;
    barangayInput.disabled = true; // Disable barangay input until city is selected

    for (const province in locationData[region]) {
        const option = document.createElement('option');
        option.value = province;
        option.textContent = province;
        provinceSelect.appendChild(option);
    }
}

// Populate the city/municipality dropdown based on selected province
function populateCities(province, region, locationData) {
    citySelect.innerHTML = '<option value="">Select your city/municipality</option>';
    citySelect.disabled = false;
    barangayInput.disabled = true; // Disable barangay input until city is selected

    const cities = locationData[region][province];
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
}

// Event listeners for cascading dropdowns
regionSelect.addEventListener('change', (e) => {
    const selectedRegion = e.target.value;
    fetch('../../functions/locationData.json')
        .then(response => response.json())
        .then(locationData => {
            populateProvinces(selectedRegion, locationData);
        })
        .catch(error => console.error('Error fetching location data:', error));
});

provinceSelect.addEventListener('change', (e) => {
    const region = regionSelect.value;
    const selectedProvince = e.target.value;
    fetch('../../functions/locationData.json')
        .then(response => response.json())
        .then(locationData => {
            populateCities(selectedProvince, region, locationData);
        })
        .catch(error => console.error('Error fetching location data:', error));
});

citySelect.addEventListener('change', () => {
    barangayInput.disabled = false; // Enable barangay input when city is selected
});

// Initialize the region dropdown on page load
initializeLocationData();

// Authentication state observer to manage user profile
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            toggleLoadingState(true); // Show loading indicator
            userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();

                // Populate user profile
                userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
                userEmailElement.textContent = user.email;
                userLocationElement.textContent = userData.location || 'Location not available';

                // Populate the additional profile fields
                userEducationElement.textContent = userData.education || 'Not specified';
                userGenderElement.textContent = userData.gender || 'Not specified';
                userSkillsElement.textContent = userData.skills || 'Not specified';
                userExperienceElement.textContent = userData.experience || 'Not specified';

                // Handle resume display and buttons
                if (userData.resumeURL) {
                    resumeFileNameElement.value = userData.resumeFileName || "Resume";
                    uploadResumeButton.textContent = "Update Resume";
                    deleteResumeButton.style.display = 'inline';
                } else {
                    resumeFileNameElement.value = "No file selected";
                    uploadResumeButton.textContent = "Upload Resume";
                    deleteResumeButton.style.display = 'none';
                }

                // Show the edit form with current profile data
                editProfileButton.addEventListener('click', async () => {
                    editProfileForm.classList.remove('hidden');

                    const locationParts = userData.location ? userData.location.split(',').map(part => part.trim()) : [];

                    originalProfileData = {
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        region: locationParts[0] || '',
                        province: locationParts[1] || '',
                        city: locationParts[2] || '',
                        barangay: locationParts[3] || '',
                    };

                    editFirstName.value = originalProfileData.firstName;
                    editLastName.value = originalProfileData.lastName;
                    editBarangay.value = originalProfileData.barangay;

                    // Fetch the location data and populate the fields
                    const response = await fetch('../../functions/locationData.json');
                    const locationData = await response.json();

                    // Populate the region
                    populateRegions(locationData);
                    editRegion.value = originalProfileData.region;

                    // Populate the province if the region is selected
                    if (originalProfileData.region) {
                        populateProvinces(originalProfileData.region, locationData);
                        editProvince.value = originalProfileData.province;
                    }

                    // Populate the city if the province is selected
                    if (originalProfileData.province) {
                        populateCities(originalProfileData.province, originalProfileData.region, locationData);
                        editCity.value = originalProfileData.city;
                    }

                    editProfileButton.classList.add('hidden');
                });


                // Show the edit qualifications form with current data
                editQualificationsButton.addEventListener('click', () => {
                    editQualificationsForm.classList.remove('hidden');
                    editEducation.value = userData.education || '';
                    editGender.value = userData.gender || '';
                    editSkills.value = userData.skills || '';
                    editExperience.value = userData.experience || '';
                    editQualificationsButton.classList.add('hidden');
                });

                // Handle saving the updated profile data
                saveProfileButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        toggleLoadingState(true); // Show loading indicator

                        // Combine the location components if needed
                        const updatedLocation = `${editRegion.value}, ${editProvince.value}, ${editCity.value}, ${editBarangay.value}`;

                        const updatedProfileData = {
                            firstName: editFirstName.value.trim(),
                            lastName: editLastName.value.trim(),
                            location: updatedLocation,
                        };

                        // Update Firestore document
                        await updateDoc(userDocRef, updatedProfileData);

                        // Update displayed profile information
                        userNameElement.textContent = `${updatedProfileData.firstName} ${updatedProfileData.lastName}`;
                        userLocationElement.textContent = updatedLocation;

                        editProfileForm.classList.add('hidden');
                        editProfileButton.classList.remove('hidden');
                    } catch (error) {
                        console.error("Error updating profile:", error);
                    } finally {
                        toggleLoadingState(false); // Hide loading indicator
                    }
                });

                // Handle saving the updated qualifications data
                saveQualificationsButton.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        toggleLoadingState(true); // Show loading indicator

                        const updatedQualificationsData = {
                            education: editEducation.value.trim(),
                            gender: editGender.value,
                            skills: editSkills.value.trim(),
                            experience: editExperience.value.trim(),
                        };

                        // Update Firestore document
                        await updateDoc(userDocRef, updatedQualificationsData);

                        // Update displayed qualifications information
                        userEducationElement.textContent = updatedQualificationsData.education;
                        userGenderElement.textContent = updatedQualificationsData.gender;
                        userSkillsElement.textContent = updatedQualificationsData.skills;
                        userExperienceElement.textContent = updatedQualificationsData.experience;

                        editQualificationsForm.classList.add('hidden');
                        editQualificationsButton.classList.remove('hidden');
                    } catch (error) {
                        console.error("Error updating qualifications:", error);
                    } finally {
                        toggleLoadingState(false); // Hide loading indicator
                    }
                });

                // Handle cancelling the edit operation
                cancelEditButton.addEventListener('click', () => {
                    editProfileForm.classList.add('hidden');
                    editProfileButton.classList.remove('hidden');
                });

                cancelQualificationsButton.addEventListener('click', () => {
                    editQualificationsForm.classList.add('hidden');
                    editQualificationsButton.classList.remove('hidden');
                });

                // Event listener for resume upload button
                uploadResumeButton.addEventListener('click', async () => {
                    resumeInput.click();
                });

                // Event listener for resume file name click
                resumeFileNameElement.addEventListener('click', () => {
                    resumeInput.click();
                });

                // Event listener for resume input change with file size validation
                resumeInput.addEventListener('change', async () => {
                    const file = resumeInput.files[0];
                    if (file) {
                        const fileSizeMB = file.size / (1024 * 1024); // Convert size to MB
                        const allowedExtensions = /(\.doc|\.docx|\.pdf)$/i;

                        if (!allowedExtensions.exec(file.name)) {
                            setUploadStatus("Error: Invalid file type. Please upload a DOC, DOCX, or PDF file.", false);
                            resumeFileNameElement.value = ''; // Clear the file name display
                            resumeInput.value = ''; // Clear the file input
                        } else if (fileSizeMB > MAX_FILE_SIZE_MB) {
                            setUploadStatus(`Error: File size exceeds ${MAX_FILE_SIZE_MB} MB. Please select a smaller file.`, false);
                            resumeFileNameElement.value = ''; // Clear the file name display
                            resumeInput.value = ''; // Clear the file input
                        } else {
                            resumeFileNameElement.value = file.name;
                            setUploadStatus('', true); // Clear any previous error messages
                            // Proceed with the upload process
                            try {
                                toggleLoadingState(true); // Show loading indicator
                                const resumeRef = ref(storage, `resumes/${user.uid}/${file.name}`);
                                await uploadBytes(resumeRef, file);
                                const downloadURL = await getDownloadURL(resumeRef);

                                // Update user document with the resume details
                                await updateDoc(userDocRef, {
                                    resumeURL: downloadURL,
                                    resumeFileName: file.name
                                });

                                resumeFileNameElement.value = file.name;
                                uploadResumeButton.textContent = "Update Resume";
                                setUploadStatus("File upload successful.", true);
                                deleteResumeButton.style.display = 'inline';

                                // Show an alert indicating the upload was successful
                                alert("Resume uploaded successfully!");

                            } catch (error) {
                                console.error("Error uploading resume:", error);
                                setUploadStatus("Error uploading resume.", false);
                            } finally {
                                toggleLoadingState(false); // Hide loading indicator
                            }
                        }
                    }
                });

                // Event listener for resume delete button
                deleteResumeButton.addEventListener('click', () => {
                    deleteModal.classList.remove('hidden');
                });

                // Event listener for cancel delete button
                cancelDeleteButton.addEventListener('click', () => {
                    deleteModal.classList.add('hidden');
                });

                // Event listener for confirm delete button
                confirmDeleteButton.addEventListener('click', async () => {
                    if (userData.resumeURL) {
                        const resumeRef = ref(storage, `resumes/${user.uid}/${userData.resumeFileName}`);

                        try {
                            toggleLoadingState(true); // Show loading indicator
                            await deleteObject(resumeRef);
                            await updateDoc(userDocRef, {
                                resumeURL: "",
                                resumeFileName: ""
                            });

                            resumeFileNameElement.value = "No file selected";
                            uploadResumeButton.textContent = "Upload Resume";
                            setUploadStatus("Resume deleted successfully.", true);
                            deleteResumeButton.style.display = 'none';

                            // Show an alert indicating the resume was deleted successfully
                            alert("Resume deleted successfully!");

                        } catch (error) {
                            console.error("Error deleting resume:", error);
                            setUploadStatus("Error deleting resume.", false);
                        } finally {
                            toggleLoadingState(false); // Hide loading indicator
                        }
                    }
                    deleteModal.classList.add('hidden');
                });

            } else {
                console.error("User document not found");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            toggleLoadingState(false); // Hide loading indicator
        }
    } else {
        console.error("No user is signed in.");
    }
});
