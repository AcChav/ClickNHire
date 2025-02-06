import { auth } from "../db/firebase_init.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-firestore.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js";

const db = getFirestore();
const storage = getStorage();

async function loadRequirementsForHR() {
    const user = auth.currentUser;

    if (!user) {
        console.error("No user is signed in. Redirecting to login.");
        window.location.href = "../login.html";
        return;
    }

    try {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || userDoc.data().role !== "hr") {
            alert("Access denied. Only HR accounts can view requirements.");
            window.location.href = "../hr_dashboard.html";
            return;
        }

        console.log("User verified as HR. Fetching requirements...");
        const requirementsList = document.getElementById("requirementsList");
        requirementsList.innerHTML = "<p>Loading requirements...</p>";

        const requirementsFolderRef = ref(storage, "requirements");
        const folderContents = await listAll(requirementsFolderRef);

        if (folderContents.prefixes.length === 0) {
            requirementsList.innerHTML = "<p>No requirements found.</p>";
            return;
        }

        requirementsList.innerHTML = ""; // Clear existing content

        // Loop through each applicant folder
        for (const applicantFolder of folderContents.prefixes) {
            const applicantId = applicantFolder.name;

            // Fetch applicant's full name from Firestore
            const userDocRef = doc(db, "users", applicantId);
            const userDocSnapshot = await getDoc(userDocRef);
            let applicantName = "Unknown";

            if (userDocSnapshot.exists()) {
                const userData = userDocSnapshot.data();
                applicantName = `${userData.firstName || "Unknown"} ${userData.lastName || "Unknown"}`;
            }

            // Create a container for the applicant
            const applicantContainer = document.createElement("div");
            applicantContainer.classList.add(
                "p-4",
                "mb-4",
                "border",
                "rounded",
                "flex",
                "justify-between",
                "items-center"
            );

            const applicantInfo = document.createElement("span");
            applicantInfo.classList.add("text-lg", "font-bold");
            applicantInfo.textContent = `Applicant: ${applicantName}`;

            const viewButton = document.createElement("button");
            viewButton.classList.add("bg-blue-500", "text-white", "px-4", "py-2", "rounded", "hover:bg-blue-700");
            viewButton.textContent = "View Files";
            viewButton.addEventListener("click", async () => {
                openModal(applicantId, applicantFolder);
            });

            applicantContainer.appendChild(applicantInfo);
            applicantContainer.appendChild(viewButton);
            requirementsList.appendChild(applicantContainer);
        }
    } catch (error) {
        console.error("Error fetching requirements:", error);
        document.getElementById("requirementsList").innerHTML =
            "<p>Error fetching requirements. Please try again later.</p>";
    }
}


// Open Modal
async function openModal(applicantId, applicantFolder) {
    const modal = document.getElementById("fileModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalContent = document.getElementById("modalContent");

    modalContent.innerHTML = "<p>Loading files...</p>";
    modal.classList.remove("hidden");

    try {
        // Fetch applicant's full name from Firestore
        const userDocRef = doc(db, "users", applicantId);
        const userDocSnapshot = await getDoc(userDocRef);
        let applicantName = "Unknown";

        if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();
            applicantName = `${userData.firstName || "Unknown"} ${userData.lastName || "Unknown"}`;
        }

        // Update modal title with full name
        modalTitle.textContent = `Files for Applicant: ${applicantName}`;

        const files = await listAll(applicantFolder);
        modalContent.innerHTML = ""; // Clear content

        if (files.items.length === 0) {
            modalContent.innerHTML = "<p>No files uploaded.</p>";
        } else {
            for (const file of files.items) {
                const fileURL = await getDownloadURL(file);

                const fileLink = document.createElement("a");
                fileLink.href = fileURL;
                fileLink.target = "_blank";
                fileLink.classList.add("text-blue-500", "hover:underline", "block");
                fileLink.textContent = file.name;

                modalContent.appendChild(fileLink);
            }
        }
    } catch (error) {
        console.error("Error fetching files:", error);
        modalContent.innerHTML = "<p>Error loading files. Please try again later.</p>";
    }
}

// Close Modal
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("fileModal").classList.add("hidden");
});

// Call the function to load requirements
auth.onAuthStateChanged((user) => {
    if (user) {
        loadRequirementsForHR();
    } else {
        window.location.href = "../login.html";
    }
});
