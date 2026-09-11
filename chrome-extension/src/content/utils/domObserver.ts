/**
 * Observes the DOM for elements matching a selector and triggers a callback when found.
 * Handles both existing elements and dynamically added ones.
 * 
 * @param selector CSS selector to observe
 * @param callback Function to execute when element is found
 * @returns disconnect function to stop observation
 */
export function observeSelector(selector: string, callback: (element: Element) => void) {
    // 1. Check existing elements
    const existingElements = document.querySelectorAll(selector);
    existingElements.forEach(element => {
        if (!element.getAttribute('data-jukmane-processed')) {
            element.setAttribute('data-jukmane-processed', 'true');
            callback(element);
        }
    });

    // 2. Observe for new elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node instanceof Element) {
                    // Check the node itself
                    if (node.matches(selector)) {
                        if (!node.getAttribute('data-jukmane-processed')) {
                            node.setAttribute('data-jukmane-processed', 'true');
                            callback(node);
                        }
                    }
                    // Check children
                    const children = node.querySelectorAll(selector);
                    children.forEach((child) => {
                        if (!child.getAttribute('data-jukmane-processed')) {
                            child.setAttribute('data-jukmane-processed', 'true');
                            callback(child);
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    return () => observer.disconnect();
}
