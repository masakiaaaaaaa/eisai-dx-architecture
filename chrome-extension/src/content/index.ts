import styles from './style.css?inline'
import { mountStudentStatusOverlay } from './features/seating-chart';
import { mountSeatSuggestionOverlay } from './features/seating-chart/seat-suggestion-ui';
import { mountStudentInfoPanel } from './features/student-profile';

// Wrap everything in an IIFE to allow early return without throwing errors
(function () {
    console.log('Jukmane Chrome Extension: Content Script Loaded');

    const hostname = window.location.hostname;

    // Block 1: Skip on Main App to avoid React hydration conflicts
    if (hostname.includes('eisai-api') || hostname.includes('eisai-v6') || hostname.includes('vercel.app')) {
        console.log('Jukmane Extension: Skipping initialization on Main App domain.');
        return;
    }

    // Block 2: Allowlist check
    const ALLOWED_DOMAINS = [
        'www.faboc.jp',
        'faboc.jp',
        'localhost',
        '127.0.0.1'
    ];

    const isAllowedDomain = ALLOWED_DOMAINS.includes(hostname);

    const path = window.location.href;
    const isTargetPage = path.includes('supersheet') || path.includes('jyugyouadd') || path.includes('seitoview.php');
    const isDev = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!isAllowedDomain || (!isTargetPage && !isDev)) {
        console.log(`Jukmane Extension: Skipping initialization. Target page check failed (Domain: ${isAllowedDomain}, Page: ${isTargetPage}).`);
        return;
    }

    // Track whether a drag operation recently occurred.
    // After a drag, we must NOT re-init for a safe cooldown period
    // because the host page's AJAX callback + jQuery UI revert animation
    // will be modifying the DOM, and our init() would interfere.
    let lastDragTime = 0;
    const DRAG_COOLDOWN_MS = 3000; // 3 seconds after drag ends

    // Detect drag start via class observation on .seito elements
    const dragClassObserver = new MutationObserver((mutations) => {
        for (const m of mutations) {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const el = m.target as HTMLElement;
                if (el.classList.contains('ui-draggable-dragging')) {
                    lastDragTime = Date.now();
                }
            }
        }
    });

    // Observe class changes on .seito elements for drag detection
    const setupDragDetection = () => {
        document.querySelectorAll('.seito').forEach((el) => {
            dragClassObserver.observe(el, { attributes: true, attributeFilter: ['class'] });
        });
    };

    // Initialize features
    let initRunning = false;
    const init = async () => {
        // Guard: Don't run while jQuery UI drag is in progress
        if (document.querySelector('.ui-draggable-dragging')) {
            return;
        }

        // Guard: Don't run within the cooldown period after a drag operation.
        // The host page's AJAX callback (appendTo + removeAttr('style')) and
        // jQuery UI's revert animation need time to complete without interference.
        const elapsed = Date.now() - lastDragTime;
        if (lastDragTime > 0 && elapsed < DRAG_COOLDOWN_MS) {
            return;
        }

        // Guard: Don't run concurrently (init is async due to API calls)
        if (initRunning) return;
        initRunning = true;

        try {
            await mountStudentStatusOverlay(styles);
            await mountStudentInfoPanel(styles);
            if (path.includes('supersheet')) {
                await mountSeatSuggestionOverlay();
            }
        } finally {
            initRunning = false;
        }
    };

    // Run on load
    init().then(() => {
        setupDragDetection();
    });

    // --- Mutation Observer for Dynamic Content ---
    // CRITICAL: We must filter out mutations caused by jQuery UI drag-and-drop.
    // The host page's drag operations trigger appendTo/removeAttr which cause
    // childList mutations. If we react to these, our init() will run during
    // the host's DOM update sequence, causing elements to disappear.
    let timeoutId: any = null;
    const observer = new MutationObserver((mutations) => {
        // Check if any mutation is drag-related (involves .seito or .pink elements)
        const isDragRelated = mutations.some(m => {
            // Check added/removed nodes
            for (const node of Array.from(m.addedNodes)) {
                if (node instanceof HTMLElement) {
                    if (node.classList?.contains('seito') || node.classList?.contains('pink')) return true;
                }
            }
            for (const node of Array.from(m.removedNodes)) {
                if (node instanceof HTMLElement) {
                    if (node.classList?.contains('seito') || node.classList?.contains('pink')) return true;
                }
            }
            // Check if the mutation target is a droppable (pink) container
            if (m.target instanceof HTMLElement) {
                if (m.target.classList?.contains('pink') || m.target.classList?.contains('droppable')) return true;
            }
            return false;
        });

        if (isDragRelated) {
             lastDragTime = Date.now();
        }

        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            init().then(setupDragDetection);
        }, isDragRelated ? 500 : 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setTimeout(() => {
        init().then(setupDragDetection);
    }, 1000);
})();
