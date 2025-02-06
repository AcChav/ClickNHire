import { auth, db } from '../db/firebase_init.js'; // Import initialized Firebase modules
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Function to populate the employee dropdown and handle company name retrieval
async function populateDropdowns() {
    const companyInput = document.getElementById("company");
    const employeeSelect = document.getElementById("employeeName");
    const employeeIdInput = document.getElementById("employeeId");
    const managerNameInput = document.getElementById("managerName");

    // Check authentication state and proceed if the user is authenticated
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Query the `applications` collection to get employees with status "Employee"
                const employeeQuery = query(collection(db, 'applications'), where('status', '==', 'Employee'));
                const employeeSnapshot = await getDocs(employeeQuery);

                for (let employeeDoc of employeeSnapshot.docs) {
                    const employeeData = employeeDoc.data();

                    // Fetch the user's first and last name using the userId
                    const userRef = doc(db, 'users', employeeData.userId);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();

                        // Combine first and last names
                        const fullName = `${userData.firstName} ${userData.lastName}`;

                        const option = document.createElement('option');
                        option.value = employeeDoc.id;  // Use the application ID as the value
                        option.textContent = fullName;  // Display full name in the dropdown
                        employeeSelect.appendChild(option);
                    } else {
                        console.error(`User document for ID ${employeeData.userId} does not exist.`);
                    }
                }

                // Set up event listener for employee selection change
                employeeSelect.addEventListener('change', async function () {
                    const selectedEmployeeId = employeeSelect.value;
                    const selectedEmployee = employeeSnapshot.docs.find(doc => doc.id === selectedEmployeeId).data();

                    // Fetch the job information using the jobId from the selected application
                    const jobRef = doc(db, 'jobs', selectedEmployee.jobId);
                    const jobDoc = await getDoc(jobRef);

                    if (jobDoc.exists()) {
                        const jobData = jobDoc.data();

                        // Fetch the company name
                        const companyName = jobData.company || 'Company not specified';
                        companyInput.value = companyName;

                    } else {
                        console.error(`Job document for ID ${selectedEmployee.jobId} does not exist.`);
                        companyInput.value = 'Company not found';
                    }

                    // Use the document ID of the user in the `users` collection as the Employee ID
                    const userRef = doc(db, 'users', selectedEmployee.userId);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        employeeIdInput.value = userDoc.id;  // Directly use the user's document ID
                    } else {
                        console.error(`User document for ID ${selectedEmployee.userId} does not exist.`);
                        employeeIdInput.value = 'ID not found';  // Default value in case of an error
                    }
                });

                // Fetch and set the manager's name (District Manager)
                const managerDoc = await getDoc(doc(db, 'users', user.uid));
                if (managerDoc.exists()) {
                    managerNameInput.value = `${managerDoc.data().firstName} ${managerDoc.data().lastName}`;  // Combine first and last name
                } else {
                    managerNameInput.value = 'Manager not found';
                    console.log("Manager document does not exist.");
                }
            } catch (error) {
                console.error("Error fetching employee or company data:", error);
            }
        } else {
            console.log("User is not authenticated.");
            window.location.href = '../../login.html';
        }
    });
}

// Execute the function when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", populateDropdowns);
