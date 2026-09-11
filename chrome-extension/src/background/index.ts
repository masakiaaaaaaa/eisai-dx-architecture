console.log('Jukmane Extension: Background Service Worker Loaded');

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FETCH_API') {
        const { url, options } = message.payload;

        console.log(`[Background] Fetching: ${url}`);

        fetch(url, {
            ...options,
            // Ensure cookies are sent for authentication
            credentials: 'include',
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                console.log(`[Background] Fetch Success:`, data);

                sendResponse({
                    success: response.ok,
                    status: response.status,
                    data: data,
                    // If not OK, try to get error from data or statusText
                    error: !response.ok ? (data?.error || response.statusText || 'Unknown Server Error') : undefined
                });
            })
            .catch((error) => {
                console.error(`[Background] Fetch Error:`, error);
                sendResponse({
                    success: false,
                    error: error.message,
                });
            });

        // Return true to indicate we wish to send a response asynchronously
        return true;
    }
});
