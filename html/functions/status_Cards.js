// status_Cards.js

/**
 * Render status counts in a card format with color coding.
 * @param {Array} applications - The array of applications.
 */
export function renderStatusCards(applications) {
    const statusMap = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    // Calculate counts for Qualified and Unqualified applications
    const qualifiedCount = applications.filter(app => app.isQualified).length;
    const unqualifiedCount = applications.length - qualifiedCount;

    const statusColors = {
        'Applied': 'text-yellow-600',
        'Interview': 'text-green-600',
        'Rejected': 'text-red-600',
        'Qualified': 'text-blue-600',
        'Unqualified': 'text-red-600',
    };

    // Generate status cards HTML
    const statusCardsHTML = Object.entries(statusMap).map(([status, count]) => `
        <div class="bg-white p-4 shadow rounded-lg">
            <h3 class="text-lg font-semibold text-gray-700">${status}</h3>
            <p class="text-3xl font-bold ${statusColors[status] || 'text-gray-600'}">${count}</p>
        </div>
    `).join('');

    // Add cards for Qualified and Unqualified applications
    const qualifiedCardHTML = `
        <div class="bg-white p-4 shadow rounded-lg">
            <h3 class="text-lg font-semibold text-gray-700">Qualified</h3>
            <p class="text-3xl font-bold ${statusColors['Qualified']}">${qualifiedCount}</p>
        </div>
    `;

    const unqualifiedCardHTML = `
        <div class="bg-white p-4 shadow rounded-lg">
            <h3 class="text-lg font-semibold text-gray-700">Unqualified</h3>
            <p class="text-3xl font-bold ${statusColors['Unqualified']}">${unqualifiedCount}</p>
        </div>
    `;

    // Get the status counts element and update the content
    const statusCountsElement = document.getElementById('statusCounts');
    if (statusCountsElement) {
        statusCountsElement.innerHTML = statusCardsHTML + qualifiedCardHTML + unqualifiedCardHTML;
    }
}
