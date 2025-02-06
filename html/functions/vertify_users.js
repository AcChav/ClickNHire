import db from '../db/firebase_firestore.js';
import { collection, getDocs, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { auth } from '../db/firebase_init.js';
import { toggleLoadingState } from './loading.js';

emailjs.init('hPdsDkECbxDaeLgL8'); // Replace with your actual Public Key

document.addEventListener('DOMContentLoaded', function () {
    const userList = document.getElementById('userList');
    const verifiedUsersCountElement = document.getElementById('verifiedUsersCount');
    const blockedUsersCountElement = document.getElementById('blockedUsersCount');
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    let selectedUsers = new Set();
    let usersData = []; // Store users data for search and filter

    // Authentication state observer
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                toggleLoadingState(true); // Show loading indicator
                const idTokenResult = await user.getIdTokenResult();
                if (idTokenResult.claims.role === 'hr' || idTokenResult.claims.role === 'admin') {
                    await loadUsers(); // Load users if the user is HR or Admin
                } else {
                    alert("Access denied. Only HR/Admin account can verify users.");
                    window.location.href = 'hr_dashboard.html';
                }
            } catch (error) {
                console.error("Error fetching user claims:", error);
            } finally {
                toggleLoadingState(false); // Hide loading indicator
            }
        } else {
            window.location.href = 'login.html';
        }
    });

    // Function to load users for verification
    async function loadUsers() {
        try {
            toggleLoadingState(true); // Show loading indicator
            const querySnapshot = await getDocs(collection(db, "users"));
            userList.innerHTML = ''; // Clear any existing content

            usersData = []; // Clear the previous data

            querySnapshot.forEach(doc => {
                const user = doc.data();
                // Include roles that require verification
                if (['applicant', 'hr', 'client', 'district-manager'].includes(user.role)) {
                    usersData.push({ doc, user });
                }
            });

            // Initially display all users
            displayUsers(usersData);

            // Add event listener to search input and filter select
            searchInput.addEventListener('input', handleSearchAndFilter);
            filterSelect.addEventListener('change', handleSearchAndFilter);
        } catch (error) {
            console.error("Error loading users: ", error);
        } finally {
            toggleLoadingState(false); // Hide loading indicator
        }
    }

    function displayUsers(users) {
        let verifiedUsersCount = 0;
        let blockedUsersCount = 0;

        userList.innerHTML = ''; // Clear current list

        // Separate verified and blocked users
        const verifiedUsers = [];
        const blockedUsers = [];

        users.forEach(({ doc, user }) => {
            if (user.verified) {
                verifiedUsers.push({ doc, user });
            } else {
                blockedUsers.push({ doc, user });
            }
        });

        // Define the order of roles for sorting
        const roleOrder = ['applicant', 'hr', 'district-manager', 'client'];

        // Sort users by role within each group
        const sortByRole = (a, b) => roleOrder.indexOf(a.user.role) - roleOrder.indexOf(b.user.role);
        verifiedUsers.sort(sortByRole);
        blockedUsers.sort(sortByRole);

        // First append blocked users (sorted by role)
        blockedUsers.forEach(({ doc, user }) => {
            const userItem = createUserItem(doc.id, user);
            userList.appendChild(userItem);
            blockedUsersCount++;
        });

        // Then append verified users (sorted by role)
        verifiedUsers.forEach(({ doc, user }) => {
            const userItem = createUserItem(doc.id, user);
            userList.appendChild(userItem);
            verifiedUsersCount++;
        });

        // Update the statistics cards
        verifiedUsersCountElement.textContent = verifiedUsersCount;
        blockedUsersCountElement.textContent = blockedUsersCount;

        document.querySelectorAll('.blockButton').forEach(button => {
            button.addEventListener('click', handleBlockUser);
        });

        document.querySelectorAll('.userCheckbox').forEach(checkbox => {
            checkbox.addEventListener('change', handleUserSelection);
        });
    }

    function createUserItem(id, user) {
        const userItem = document.createElement('div');
        userItem.classList.add('p-4', 'mb-4', 'border', 'border-gray-300', 'bg-gray-100', 'rounded-lg', 'flex', 'justify-between', 'items-center');

        userItem.innerHTML = `
            <div class="flex items-center">
                <input type="checkbox" class="userCheckbox mr-4" data-id="${id}" ${user.verified ? 'disabled' : ''}>
                <div>
                    <h3 class="text-lg font-bold">${user.firstName} ${user.lastName}</h3>
                    <p>${user.email}</p>
                    <p class="text-sm text-gray-600">Role: ${user.role}</p>
                    <p class="text-sm text-gray-600">Verified: ${user.verified ? "Yes" : "No"}</p>
                </div>
            </div>
            <div>
            ${user.verified ?
                `<button class="blockButton bg-red-500 text-white py-1 px-3 rounded" data-id="${id}">Block</button>`
                : ''}            
            </div>
        `;
        return userItem;
    }

    // Handle user selection via checkboxes
    function handleUserSelection(event) {
        const userId = event.target.getAttribute('data-id');
        if (event.target.checked) {
            selectedUsers.add(userId);
        } else {
            selectedUsers.delete(userId);
        }
    }

    // Function to handle user blocking with confirmation
    async function handleBlockUser(event) {
        const userId = event.target.getAttribute('data-id');

        // Confirmation dialog
        const confirmBlock = confirm("Are you sure you want to block this user?");
        if (!confirmBlock) {
            return; // Exit the function if the user cancels
        }

        // Proceed with blocking the user
        await blockUser(userId);
        alert("User has been successfully blocked!");
    }

    // Block a single user by ID
    async function blockUser(userId) {
        const userDocRef = doc(db, "users", userId);
        try {
            // Update Firestore to mark the user as blocked
            await updateDoc(userDocRef, { verified: false });

            // Fetch user details
            const userSnapshot = await getDoc(userDocRef);
            const userEmail = userSnapshot.data().email;
            const userName = `${userSnapshot.data().firstName} ${userSnapshot.data().lastName}`;

            // Prepare email parameters
            const emailParams = {
                to_email: userEmail,
                to_name: userName,
                reason: "Using the website inappropriately",
            };

            // Send email via EmailJS
            emailjs.send('service_rn4rerf', 'template_zudok8j', emailParams)
                .then((response) => {
                    console.log("Email sent successfully:", response.status, response.text);
                })
                .catch((error) => {
                    console.error("Error sending email:", error);
                });

            alert("User has been successfully blocked, and an email has been sent!");
        } catch (error) {
            console.error("Error blocking user:", error);
            alert("Failed to block the user or send an email.");
        }
    }

    // Handle search and filter
    function handleSearchAndFilter() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        const filteredUsers = usersData.filter(({ user }) => {
            const matchesSearch = user.firstName.toLowerCase().includes(searchTerm) ||
                user.lastName.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm);
            const matchesFilter = filterValue === 'all' ||
                (filterValue === 'verified' && user.verified) ||
                (filterValue === 'blocked' && !user.verified);
            return matchesSearch && matchesFilter;
        });

        displayUsers(filteredUsers);
    }
});
