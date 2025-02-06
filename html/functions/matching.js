// Define a list of common stop words to remove from text
const stopWords = new Set(['and', 'or', 'the', 'a', 'an', 'to', 'from', 'with', 'in', 'on', 'at', 'for', 'by']);

// Synonyms dictionary for common skills, including those relevant to the food service industry
const skillSynonyms = {
    "communication": ["verbal communication", "teamwork", "interpersonal skills"],
    "customer service": ["client service", "customer support", "service"],
    "food handling": ["food safety", "hygiene", "sanitation"],
    "cashiering": ["cash handling", "register operation", "checkout"],
    "inventory management": ["stock control", "inventory tracking"],
    "technical skills": ["technical knowledge", "computer skills"],
};

// Skill weights based on the importance in the food industry
const skillWeights = {
    "communication": 0.8,
    "customer service": 1.0,
    "food handling": 1.5,
    "cashiering": 1.0,
    "inventory management": 1.2,
    "technical skills": 0.5,
    // Add more weights as needed
};

// Hierarchy of education levels
const educationLevels = {
    "less than high school": 1,
    "high school": 2,
    "graduated from high school": 3,
    "vocational course": 4,
    "completed vocational course": 5,
    "associate's studies": 6,
    "completed associate's degree": 7,
    "bachelor's studies": 8,
    "bachelor's degree graduate": 9,
    "graduate studies (masters)": 10,
    "master's degree graduate": 11,
    "post-graduate studies (doctorate)": 12,
    "doctoral degree graduate": 13
};

// Function to clean and sanitize text input
function sanitizeInput(text) {
    if (!text) return '';
    return text.replace(/[^\w\s]/g, '').trim(); // Remove special characters and extra spaces
}

// Function to normalize and map skills to a common dictionary
function normalizeSkills(skill) {
    skill = sanitizeInput(skill.toLowerCase());
    for (const [key, synonyms] of Object.entries(skillSynonyms)) {
        if (key === skill || synonyms.includes(skill)) {
            return key;
        }
    }
    return skill; // Return the skill as-is if no synonym is found
}

// Function to clean and tokenize text
function tokenize(text) {
    if (!text) return [];
    text = sanitizeInput(text); // Sanitize the input first
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove any remaining special characters
        .split(/\s+/) // Split by whitespace
        .filter(word => word && !stopWords.has(word)); // Remove empty strings and stop words
}

// Matching function for skills with direct and synonym matching
function matchSkills(applicantSkills, jobSkills) {
    if (!applicantSkills || !jobSkills) {
        console.log("Skills missing:", { applicantSkills, jobSkills });
        return 0;
    }

    const applicantSkillSet = new Set(tokenize(sanitizeInput(applicantSkills)));
    const jobSkillSet = new Set(tokenize(sanitizeInput(jobSkills)));

    let totalWeight = 0;
    let matchedWeight = 0;

    for (const jobSkill of jobSkillSet) {
        const weight = skillWeights[jobSkill] || 1.0; // Default weight is 1.0
        totalWeight += weight;

        // First, check for direct match
        if (applicantSkillSet.has(jobSkill)) {
            matchedWeight += weight;
            // console.log(`Directly Matched Skill: ${jobSkill} with weight ${weight}`);
        } else {
            // If no direct match, check for synonym match
            const normalizedJobSkill = normalizeSkills(jobSkill);
            if (applicantSkillSet.has(normalizedJobSkill)) {
                matchedWeight += weight;
                // console.log(`Synonym Matched Skill: ${normalizedJobSkill} (original: ${jobSkill}) with weight ${weight}`);
            } else {
                console.log(`Missed Skill: ${jobSkill} with weight ${weight}`);
            }
        }
    }

    const score = matchedWeight / totalWeight || 0;

    // // Detailed logging for debugging
    // console.log("Applicant Skills (Original):", [...applicantSkillSet]);
    // console.log("Job Skills (Original):", [...jobSkillSet]);
    // console.log("Matched Skills Weight:", matchedWeight);
    // console.log("Total Skills Weight:", totalWeight);
    // console.log("Calculated Skills Score:", score);

    return score; // Weighted percentage of required skills matched
}

// Enhanced matching function for education with hierarchy consideration and input sanitization
function matchEducation(applicantEducation, jobEducation) {
    // Sanitize and normalize the input
    applicantEducation = sanitizeInput(applicantEducation);
    jobEducation = sanitizeInput(jobEducation);

    // Handle the case where education is not specified
    if (applicantEducation.toLowerCase() === "not specified" || applicantEducation === "") {
        console.log("Applicant has not specified their education.");
        return 0; // Return 0 score as there's nothing to match
    }

    const applicantLevel = educationLevels[applicantEducation.toLowerCase()] || 0;
    const jobLevel = educationLevels[jobEducation.toLowerCase()] || 0;

    let score = 0;
    if (applicantLevel >= jobLevel) {
        score = 1.0; // Full score if applicant's education meets or exceeds job requirements
    } else if (applicantLevel < jobLevel) {
        score = applicantLevel / jobLevel; // Partial score if applicant's education is lower
    }

    // If the applicant is still studying (e.g., "Bachelor's studies"), reduce the score further
    if (applicantEducation.toLowerCase().includes("studies")) {
        score *= 0.8; // Reduce the score by 20% if the degree is still in progress
    }

    return score;
}

// Matching function for gender with input sanitization
function matchGender(applicantGender, jobGender) {
    applicantGender = sanitizeInput(applicantGender);
    jobGender = sanitizeInput(jobGender);

    if (!applicantGender || !jobGender) return 0;
    const score = jobGender.toLowerCase() === 'both' || applicantGender.toLowerCase() === jobGender.toLowerCase() ? 1.0 : 0.0;
    // console.log(`Comparing Gender: Applicant (${applicantGender}) vs Job (${jobGender}) -> Score: ${score}`);
    return score;
}

function matchLocation(applicantLocation, jobLocation) {
    if (!applicantLocation || !jobLocation) return 0; // Return 0 if location is not provided

    let score = 0.5; // Default broad area match

    if (applicantLocation.region === jobLocation.region) {
        if (!applicantLocation.province) {
            score = 0.65; // Penalize slightly for missing province data
        } else if (applicantLocation.province === jobLocation.province) {
            score = 1.0; // Exact match
        } else {
            score = 0.75; // Regional match only
        }
    }
    return score;
}

// Matching function for experience with input sanitization
function matchExperience(applicantExperience, jobExperience) {
    // Sanitize and normalize the input
    applicantExperience = sanitizeInput(applicantExperience);
    jobExperience = parseFloat(sanitizeInput(jobExperience)) || 0;

    // Handle the case where experience is not specified or is explicitly "no experience"
    if (!applicantExperience || applicantExperience.toLowerCase() === "not specified" || applicantExperience.toLowerCase() === "no experience") {
        console.log("Applicant has no experience specified or marked as 'no experience'.");
        return jobExperience === 0 ? 1.0 : 0.0; // If job requires no experience, return full score, else return 0
    }

    // Attempt to parse the applicant's experience as a number
    applicantExperience = parseFloat(applicantExperience);
    if (isNaN(applicantExperience) || applicantExperience < 0) {
        console.warn("Failed to parse applicant experience or it was negative, defaulting to 0.");
        applicantExperience = 0;
    }

    // If job requires experience and applicant has less, return 0
    if (jobExperience > 0 && applicantExperience < jobExperience) {
        return 0; // Disqualify if experience is insufficient
    }

    // Normalize the experience score
    return jobExperience === 0 ? 1.0 : Math.min(applicantExperience / jobExperience, 1.0);
}

// Weights for each matching criterion
const weights = {
    education: 0.2,
    skills: 0.4,
    gender: 0.1,
    location: 0.2,
    experience: 0.1
};

// Function to calculate the total matching score
export async function calculateTotalScore(applicantDetails, jobDetails) {
    const educationScore = matchEducation(applicantDetails.education, jobDetails.educationLevel);
    const skillsScore = matchSkills(applicantDetails.skills, jobDetails.skills);
    const genderScore = matchGender(applicantDetails.gender, jobDetails.gender);
    const locationScore = matchLocation(applicantDetails.location, jobDetails.location);
    const experienceScore = matchExperience(applicantDetails.experience, jobDetails.experience);

    // Log the intermediate scores for debugging
    console.log("----- Score Breakdown -----");
    console.log(`Education Score: ${educationScore} (Weight: ${weights.education})`);
    console.log(`Skills Score: ${skillsScore} (Weight: ${weights.skills})`);
    console.log(`Gender Score: ${genderScore} (Weight: ${weights.gender})`);
    console.log(`Location Score: ${locationScore} (Weight: ${weights.location})`);
    console.log(`Experience Score: ${experienceScore} (Weight: ${weights.experience})`);

    const totalScore = (
        educationScore * weights.education +
        skillsScore * weights.skills +
        genderScore * weights.gender +
        locationScore * weights.location +
        experienceScore * weights.experience
    );

    // Check if the totalScore is NaN and handle it
    if (isNaN(totalScore)) {
        console.error("Total score calculation resulted in NaN. Check input values.");
        return { totalScore: 0 };
    }

    console.log(`Total Matching Score: ${totalScore}`);
    console.log("---------------------------");

    return { totalScore };
}
