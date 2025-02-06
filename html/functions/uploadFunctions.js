import { auth } from '../db/firebase_init.js';
import { getStorage, ref, uploadBytes, getMetadata } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-storage.js";
import { toggleLoadingState } from './loading.js'; // Ensure you have a loading utility or placeholder

const storage = getStorage();

const documents = [
    "NBI Clearance",
    "Police Clearance",
    "Barangay Clearance",
    "Medical Certificate",
    "Birth Certificate (PSA)",
    "SSS",
    "PhilHealth",
    "PAGIBIG",
    "Certificate of Employment (if applicable)",
    "Proof of Residence",
    "TIN",
    "Written Contract",
];

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded event fired. Initializing dynamic upload fields...");

    const formContainer = document.querySelector("#uploadForm .space-y-4");

    if (!formContainer) {
        console.error("Error: Form container not found. Ensure the HTML structure matches the expected layout.");
        return;
    }

    console.log("Form container found. Appending fields...");

    // Dynamically create file input fields
    documents.forEach((doc) => {
        const field = document.createElement("div");
        field.classList.add("flex", "flex-col", "items-start");

        const label = document.createElement("label");
        label.textContent = doc;
        label.classList.add("font-semibold", "mb-1");

        const input = document.createElement("input");
        input.type = "file";
        input.name = doc.toLowerCase().replace(/\s|\(|\)/g, "_");
        input.classList.add("border", "rounded", "p-2", "w-full");

        field.appendChild(label);
        field.appendChild(input);
        formContainer.appendChild(field);
    });

    console.log("Fields appended successfully.");

    // Handle form submission
    document.getElementById("uploadForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Form submission triggered. Processing files...");
        toggleLoadingState(true);

        const user = auth.currentUser;

        if (!user) {
            alert("You must be logged in to upload files.");
            console.error("User is not authenticated.");
            toggleLoadingState(false);
            return;
        }

        const formData = new FormData(e.target);
        const userId = user.uid;
        const requirementsFolder = `requirements/${userId}/`;

        // Mandatory documents
        const mandatoryFields = [
            "sss",
            "philhealth",
            "pagibig",
            "tin",
            "written_contract",
        ];

        // Check if mandatory fields are filled
        const missingMandatory = mandatoryFields.filter(
            (field) => !formData.get(field) || !(formData.get(field) instanceof File)
        );

        if (missingMandatory.length > 0) {
            alert(`Please upload the following required documents: ${missingMandatory
                .map((field) => field.replace(/_/g, " "))
                .join(", ")}`);
            toggleLoadingState(false);
            return;
        }

        try {
            const uploads = Array.from(formData.entries())
                .filter(([key, file]) => file instanceof File && file.size > 0) // Ensure the file is valid and non-empty
                .map(async ([key, file]) => {
                    const sanitizedKey = key.replace(/[^a-z0-9_]/gi, "_");
                    const filePath = `${requirementsFolder}${sanitizedKey}`;
                    const fileRef = ref(storage, filePath);

                    try {
                        // Check if the file already exists
                        await getMetadata(fileRef);
                        console.log(`✅ File already exists: ${sanitizedKey}. Skipping upload.`);
                    } catch (error) {
                        if (error.code === "storage/object-not-found") {
                            // File doesn't exist, proceed to upload
                            console.log(`⬆️ Uploading file: ${sanitizedKey}.`);
                            await uploadBytes(fileRef, file);
                            console.log(`✅ File uploaded successfully: ${sanitizedKey}.`);
                        } else {
                            // Log unexpected errors for debugging
                            console.error(`❌ Error checking metadata for ${sanitizedKey}:`, error);
                            throw error;
                        }
                    }
                });

            await Promise.all(uploads);

            alert("All files processed successfully!");
            console.log("All files processed successfully.");
            e.target.reset();
        } catch (error) {
            console.error("Error uploading files: ", error);
            alert("Failed to upload files. Please try again.");
        } finally {
            toggleLoadingState(false);
            console.log("File upload process completed.");
        }
    });
});
