import db from '../db/firebase_firestore.js';  // This is correct based on your current setup
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";

// Elements
const loadingIndicator = document.getElementById('loadingIndicator');
const clientList = document.getElementById('clientList');
const totalClientsCountElement = document.getElementById('totalClientsCount');
const searchInput = document.getElementById('searchInput');
const locationFilter = document.getElementById('locationFilter');

let allClients = []; // Store all clients for filtering

// Fetch and display clients
async function loadClients() {
    try {
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');

        // Query Firestore for users with role 'client'
        const q = query(collection(db, 'users'), where('role', '==', 'client'));
        const querySnapshot = await getDocs(q);

        // Check if there are any clients
        if (querySnapshot.empty) {
            clientList.innerHTML = '<p class="text-gray-500">No clients found.</p>';
            totalClientsCountElement.textContent = 0;
            return;
        }

        // Clear existing client list
        clientList.innerHTML = '';
        allClients = []; // Reset the allClients array

        // Gather unique locations for the filter
        const locations = new Set();

        // Loop through the results and store the clients
        querySnapshot.forEach((doc) => {
            const client = doc.data();
            allClients.push(client);
            locations.add(client.location); // Add location to the set
        });

        // Update the total number of clients
        totalClientsCountElement.textContent = allClients.length;

        // Populate the location filter dropdown
        populateLocationFilter(Array.from(locations));

        // Render clients initially
        renderClients(allClients);

    } catch (error) {
        console.error('Error loading clients:', error);
        clientList.innerHTML = '<p class="text-red-500">Failed to load clients.</p>';
    } finally {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
    }
}

// Render clients based on filtering
function renderClients(clients) {
    clientList.innerHTML = ''; // Clear the list

    // Filter and display clients
    clients.forEach((client) => {
        const company = client.companyName;
        const email = client.email;
        const location = client.location;

        clientList.innerHTML += `
            <div class="mb-4 p-4 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-green-100">
                <h3 class="text-lg font-semibold text-gray-800">${company}</h3>
                <p class="text-gray-600">Email: ${email}</p>
                <p class="text-gray-600">Location: ${location}</p>
            </div>
        `;
    });
}

// Filter clients based on search and location
function filterClients() {
    const searchTerm = searchInput.value.toLowerCase();
    const location = locationFilter.value;

    const filteredClients = allClients.filter(client => {
        const matchesSearch = client.firstName.toLowerCase().includes(searchTerm) ||
            client.lastName.toLowerCase().includes(searchTerm) ||
            client.email.toLowerCase().includes(searchTerm);
        const matchesLocation = location ? client.location === location : true;
        return matchesSearch && matchesLocation;
    });

    renderClients(filteredClients);
}

// Populate the location filter dropdown
function populateLocationFilter(locations) {
    locationFilter.innerHTML = '<option value="">Filter by Location</option>'; // Default option
    locations.forEach(location => {
        locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
    });
}

// Event listeners for search and filter
searchInput.addEventListener('input', filterClients);
locationFilter.addEventListener('change', filterClients);

// Load clients on page load
window.addEventListener('DOMContentLoaded', loadClients);
