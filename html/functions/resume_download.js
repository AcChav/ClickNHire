// resume_download.js

/**
 * Handles the resume download or preview functionality based on file format.
 * @param {string} resumeLink - The URL of the resume to download or preview.
 * @param {string} fullName - The full name of the applicant.
 */
export function handleResumeDownload(resumeLink, fullName) {
    if (resumeLink && resumeLink !== '#') {
        // Extract the file extension from the resume URL
        const urlParts = resumeLink.split('?')[0].split('.');
        const fileExtension = urlParts[urlParts.length - 1].toLowerCase();

        if (fileExtension === 'pdf') {
            // If the file is a PDF, download it
            const link = document.createElement('a');
            link.href = resumeLink;
            link.download = `${fullName}_Resume.pdf`;
            link.target = "_self";
            link.click();
        } else if (fileExtension === 'doc' || fileExtension === 'docx') {
            // If the file is DOC or DOCX, open it in Google Docs Viewer
            const viewerLink = `https://docs.google.com/gview?url=${encodeURIComponent(resumeLink)}&embedded=true`;
            window.open(viewerLink, '_blank');
        } else {
            console.error("Unsupported file format for preview or download.");
        }
    } else {
        console.error("Resume link is unavailable or invalid.");
    }
}
