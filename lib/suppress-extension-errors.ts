// Suppress Chrome extension errors in console
if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args) => {
        // Filter out Chrome extension errors
        const errorString = args.join(' ');
        if (
            errorString.includes('runtime.lastError') ||
            errorString.includes('Receiving end does not exist') ||
            errorString.includes('Extension context invalidated') ||
            errorString.includes('Hydration failed') ||
            errorString.includes('data-new-gr-c-s-check-loaded') ||
            errorString.includes('data-gr-ext-installed') ||
            errorString.includes('data-gramm') ||
            errorString.toLowerCase().includes('grammarly')
        ) {
            return; // Suppress these errors
        }
        originalError.apply(console, args);
    };
}
