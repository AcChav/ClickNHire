// mrf_validations.js

// Restrict input to letters only for Contact Person
export function validateContactPerson(contactPersonInput) {
    const maxLength = 50; // Set the maximum length for the contact person name

    // Create a span element to display validation messages
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none'; // Initially hidden
    contactPersonInput.parentNode.insertBefore(errorMessage, contactPersonInput.nextSibling);

    contactPersonInput.addEventListener('input', function () {
        // Allow letters, spaces, and accented characters, and replace any other characters
        this.value = this.value.replace(/[^a-zA-Z\sÀ-ž]/g, '');
        
        // Replace multiple spaces with a single space
        this.value = this.value.replace(/\s+/g, ' ').trimStart();

        // Enforce the character limit
        if (this.value.length > maxLength) {
            this.value = this.value.slice(0, maxLength);
        }

        // Check for minimum length
        if (this.value.length > 0 && this.value.length < 2) {
            errorMessage.textContent = "Name must be at least 2 characters long.";
            errorMessage.style.display = 'block';
        } else if (this.value.length === maxLength) {
            errorMessage.textContent = `Name cannot exceed ${maxLength} characters.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });

    contactPersonInput.addEventListener('blur', function () {
        // Trim trailing spaces when the input loses focus
        this.value = this.value.trim();

        // Hide the error message if the input is valid
        if (this.value.length >= 2 && this.value.length <= maxLength) {
            errorMessage.style.display = 'none';
        }
    });
}

// Restrict input to numbers only for Contact Phone and limit to 11 digits
export function validateContactPhone(contactPhoneInput) {
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    contactPhoneInput.parentNode.insertBefore(errorMessage, contactPhoneInput.nextSibling);

    contactPhoneInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');

        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
            errorMessage.textContent = "Phone number cannot exceed 11 digits.";
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });

    contactPhoneInput.addEventListener('blur', function () {
        if (this.value.length < 11) {
            errorMessage.textContent = "Phone number must be 11 digits long.";
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}


// Validate email format
export function validateContactEmail(contactEmailInput) {
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    contactEmailInput.parentNode.insertBefore(errorMessage, contactEmailInput.nextSibling);

    contactEmailInput.addEventListener('blur', function () {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(this.value)) {
            errorMessage.textContent = "Please enter a valid email address.";
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Limit job title to 100 characters
export function validateJobTitle(jobTitleInput) {
    const maxLength = 100; // Max length for job title
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    jobTitleInput.parentNode.insertBefore(errorMessage, jobTitleInput.nextSibling);

    jobTitleInput.addEventListener('input', function () {
        if (this.value.length > maxLength) {
            this.value = this.value.slice(0, maxLength);
            errorMessage.textContent = `Job title cannot exceed ${maxLength} characters.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Limit job description to 500 characters
export function validateJobDescription(jobDescriptionInput) {
    const maxLength = 500; // Max length for job description
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    jobDescriptionInput.parentNode.insertBefore(errorMessage, jobDescriptionInput.nextSibling);

    jobDescriptionInput.addEventListener('input', function () {
        if (this.value.length > maxLength) {
            this.value = this.value.slice(0, maxLength);
            errorMessage.textContent = `Job description cannot exceed ${maxLength} characters.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Limit skills to 300 characters
export function validateSkills(skillsInput) {
    const maxLength = 300; // Max length for skills
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    skillsInput.parentNode.insertBefore(errorMessage, skillsInput.nextSibling);

    skillsInput.addEventListener('input', function () {
        if (this.value.length > maxLength) {
            this.value = this.value.slice(0, maxLength);
            errorMessage.textContent = `Skills cannot exceed ${maxLength} characters.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Limit qualifications to 300 characters
export function validateQualifications(qualificationsInput) {
    const maxLength = 300; // Max length for qualifications
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    qualificationsInput.parentNode.insertBefore(errorMessage, qualificationsInput.nextSibling);

    qualificationsInput.addEventListener('input', function () {
        if (this.value.length > maxLength) {
            this.value = this.value.slice(0, maxLength);
            errorMessage.textContent = `Qualifications cannot exceed ${maxLength} characters.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Restrict input for Number of Positions to positive integers between 1 and 1500
export function validateNumberOfPositions(numberOfPositionsInput) {
    const maxPositions = 1500; // Max value for number of positions
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    numberOfPositionsInput.parentNode.insertBefore(errorMessage, numberOfPositionsInput.nextSibling);

    numberOfPositionsInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (parseInt(this.value) < 1) {
            this.value = '';
            errorMessage.textContent = "Number of positions must be at least 1.";
            errorMessage.style.display = 'block';
        } else if (parseInt(this.value) > maxPositions) {
            this.value = maxPositions.toString();
            errorMessage.textContent = `Number of positions cannot exceed ${maxPositions}.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

// Restrict input for Number of Males to positive integers between 1 and 1500
export function validateNumberOfMales(numberOfMalesInput) {
    const maxMales = 1500; // Max value for number of males
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    numberOfMalesInput.parentNode.insertBefore(errorMessage, numberOfMalesInput.nextSibling);

    numberOfMalesInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (parseInt(this.value) < 1) {
            this.value = '';
            errorMessage.textContent = "Number of males must be at least 1.";
            errorMessage.style.display = 'block';
        } else if (parseInt(this.value) > maxMales) {
            this.value = maxMales.toString();
            errorMessage.textContent = `Number of males cannot exceed ${maxMales}.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}


// Restrict input for Number of Females to positive integers between 1 and 1500
export function validateNumberOfFemales(numberOfFemalesInput) {
    const maxFemales = 1500; // Max value for number of females
    const errorMessage = document.createElement('span');
    errorMessage.style.color = 'red';
    errorMessage.style.fontSize = '12px';
    errorMessage.style.display = 'none';
    numberOfFemalesInput.parentNode.insertBefore(errorMessage, numberOfFemalesInput.nextSibling);

    numberOfFemalesInput.addEventListener('input', function () {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (parseInt(this.value) < 1) {
            this.value = '';
            errorMessage.textContent = "Number of females must be at least 1.";
            errorMessage.style.display = 'block';
        } else if (parseInt(this.value) > maxFemales) {
            this.value = maxFemales.toString();
            errorMessage.textContent = `Number of females cannot exceed ${maxFemales}.`;
            errorMessage.style.display = 'block';
        } else {
            errorMessage.style.display = 'none';
        }
    });
}

