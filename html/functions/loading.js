// Function to toggle the visibility of the loading indicator
export const toggleLoadingState = (isLoading) => {
    const loadingIndicator = document.getElementById('loadingIndicator');

    if (loadingIndicator) {
        // Show or hide the loading indicator based on the isLoading flag
        loadingIndicator.classList.toggle('hidden', !isLoading);
    } else {
        console.log("Loading indicator not found"); // Log an error if the loading indicator element is not found
    }
};
