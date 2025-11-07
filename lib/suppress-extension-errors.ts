// Suppress Chrome extension errors in console
if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = (...args) => {
        // Filter out Chrome extension errors
        const errorString = args.join(' ');
        if (
            errorString.includes('runtime.lastError') ||
            errorString.includes('Receiving end does not exist') ||
            errorString.includes('Extension context invalidated')
        ) {
            return; // Suppress these errors
        }
        originalError.apply(console, args);
    };
}
