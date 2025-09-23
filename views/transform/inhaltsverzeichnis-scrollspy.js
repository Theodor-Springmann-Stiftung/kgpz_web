/**
 * InhaltsverzeichnisScrollspy Web Component
 *
 * Manages dynamic show/hide of content in the Inhaltsverzeichnis based on:
 * 1. Page container visibility (>40% threshold)
 * 2. Single page viewer mode
 *
 * Features:
 * - Short mode: Hides continuation entries and multipart parts
 * - Full mode: Shows all content when page is prominently visible
 * - Self-contained with proper lifecycle management
 * - HTMX-safe cleanup
 */
export class InhaltsverzeichnisScrollspy extends HTMLElement {
    constructor() {
        super();
        this.pageObserver = null;
        this.pageContainers = new Map(); // pageNumber -> { container, entries, state }
        this.singlePageViewerActive = false;
        this.singlePageViewerCurrentPage = null; // Track which page is currently viewed in single page mode
        this.boundHandleSinglePageViewer = this.handleSinglePageViewer.bind(this);
    }

    connectedCallback() {
        this.setupScrollspy();
        this.setupSinglePageViewerDetection();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    setupScrollspy() {
        // Find all page containers in the newspaper layout
        const newspaperPageContainers = document.querySelectorAll('.newspaper-page-container[data-page-container]');

        if (newspaperPageContainers.length === 0) {
            return; // No page containers found
        }

        // Map page containers to their corresponding Inhaltsverzeichnis entries
        newspaperPageContainers.forEach(container => {
            const pageNumber = container.getAttribute('data-page-container');
            const isBeilage = container.hasAttribute('data-beilage');

            // Find corresponding Inhaltsverzeichnis entries
            const entries = this.findInhaltsEntriesForPage(pageNumber, isBeilage);

            if (entries.length > 0) {
                this.pageContainers.set(pageNumber, {
                    container,
                    entries,
                    state: 'short', // Default state
                    isBeilage
                });
            }
        });

        // Set up intersection observer with 50% threshold
        this.pageObserver = new IntersectionObserver((observerEntries) => {
            observerEntries.forEach(entry => {
                const pageNumber = entry.target.getAttribute('data-page-container');
                const pageData = this.pageContainers.get(pageNumber);

                if (pageData) {
                    // Use 50% visibility threshold for full mode
                    const shouldBeFullMode = entry.isIntersecting && entry.intersectionRatio >= 0.5;
                    const newState = shouldBeFullMode || this.singlePageViewerActive ? 'full' : 'short';

                    if (pageData.state !== newState) {
                        pageData.state = newState;
                        this.updateEntriesState(pageData);
                    }
                }
            });
        }, {
            threshold: [0, 0.5, 1.0], // Watch for 50% threshold
            rootMargin: '0px'
        });

        // Observe all page containers
        this.pageContainers.forEach(({ container }) => {
            this.pageObserver.observe(container);
        });

        // Initialize all entries to short mode
        this.pageContainers.forEach(pageData => {
            this.updateEntriesState(pageData);
        });
    }

    findInhaltsEntriesForPage(pageNumber, isBeilage = false) {
        // Look for page entries in the Inhaltsverzeichnis that match this page
        const selector = isBeilage
            ? `[data-page-container="${pageNumber}"][data-beilage="true"]`
            : `[data-page-container="${pageNumber}"]:not([data-beilage])`;

        const pageEntryContainer = this.querySelector(selector);

        if (!pageEntryContainer) {
            return [];
        }

        // Get all inhalts-entry elements within this page container
        return Array.from(pageEntryContainer.querySelectorAll('.inhalts-entry'));
    }

    updateEntriesState(pageData) {
        const { entries, state } = pageData;

        if (state === 'full') {
            // Page is expanded: show all entries and highlight page elements
            entries.forEach(entry => {
                entry.style.display = '';
            });
            this.highlightPageElements(pageData, true);
        } else {
            // Page is collapsed: hide continuation entries and remove highlighting
            entries.forEach(entry => {
                const isContinuation = entry.hasAttribute('data-is-continuation');
                entry.style.display = isContinuation ? 'none' : '';
            });
            this.highlightPageElements(pageData, false);
        }
    }

    highlightPageElements(pageData, highlight) {
        const pageNumber = pageData.container.getAttribute('data-page-container');

        // 1. Highlight in Inhaltsverzeichnis (page number + icon + border)
        const pageLink = this.querySelector(`[data-page-number="${pageNumber}"]`);
        const iconContainer = pageLink?.closest('.page-entry')?.querySelector('.icon-container');
        const pageEntryContainer = pageLink?.closest('.page-entry');

        // Keep page number and icons unchanged in Inhaltsverzeichnis

        if (pageEntryContainer) {
            if (highlight) {
                pageEntryContainer.classList.add('!border-l-red-500');
                pageEntryContainer.classList.remove('border-slate-300');
            } else {
                pageEntryContainer.classList.remove('!border-l-red-500');
                pageEntryContainer.classList.add('border-slate-300');
            }
        }

        // 2. Highlight in layout view (page indicator above image)
        const layoutPageIndicator = document.querySelector(`[data-page="${pageNumber}"].page-indicator`);

        if (layoutPageIndicator) {
            // Only highlight primary (non-greyed) icons in layout view too
            const layoutPrimaryIcons = layoutPageIndicator.querySelectorAll('i:not(.text-slate-400)');
            if (highlight) {
                layoutPageIndicator.classList.add('!bg-red-50', '!text-red-600');
                layoutPrimaryIcons.forEach(icon => icon.classList.add('!text-red-600'));
            } else {
                layoutPageIndicator.classList.remove('!bg-red-50', '!text-red-600');
                layoutPrimaryIcons.forEach(icon => icon.classList.remove('!text-red-600'));
            }
        }
    }


    setupSinglePageViewerDetection() {
        // Listen for single page viewer events
        document.addEventListener('singlepageviewer:opened', this.boundHandleSinglePageViewer);
        document.addEventListener('singlepageviewer:closed', this.boundHandleSinglePageViewer);
        document.addEventListener('singlepageviewer:pagechanged', this.boundHandleSinglePageViewer);

        // Check initial state
        this.checkSinglePageViewerState();
    }

    handleSinglePageViewer(event) {
        const wasActive = this.singlePageViewerActive;
        this.singlePageViewerActive = event.type === 'singlepageviewer:opened' ||
                                      (event.type === 'singlepageviewer:pagechanged' && this.singlePageViewerActive);

        // Track which page is currently being viewed in single page mode
        if ((this.singlePageViewerActive || event.type === 'singlepageviewer:pagechanged') && event.detail?.pageNumber) {
            this.singlePageViewerCurrentPage = event.detail.pageNumber.toString();
        } else if (event.type === 'singlepageviewer:closed') {
            this.singlePageViewerCurrentPage = null;
            this.singlePageViewerActive = false;
        }

        // Re-evaluate all page states
        this.pageContainers.forEach(pageData => {
            const pageNumber = pageData.container.getAttribute('data-page-container');
            let newState;

            if (this.singlePageViewerActive) {
                // In single page viewer: only expand and highlight the current page, collapse all others
                newState = pageNumber === this.singlePageViewerCurrentPage ? 'full' : 'short';
            } else {
                // Normal mode: based on scroll position
                newState = this.isPageContainerVisible(pageData.container) ? 'full' : 'short';
            }

            if (pageData.state !== newState) {
                pageData.state = newState;
                this.updateEntriesState(pageData);
            }
        });
    }

    checkSinglePageViewerState() {
        // Check if single page viewer is currently active
        const viewer = document.querySelector('single-page-viewer[active]');
        this.singlePageViewerActive = viewer !== null;
    }

    isPageContainerVisible(container) {
        const rect = container.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        const visibleTop = Math.max(rect.top, 0);
        const visibleBottom = Math.min(rect.bottom, viewportHeight);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);
        const containerHeight = rect.height;

        return (visibleHeight / containerHeight) >= 0.5;
    }

    cleanup() {
        if (this.pageObserver) {
            this.pageObserver.disconnect();
            this.pageObserver = null;
        }

        document.removeEventListener('singlepageviewer:opened', this.boundHandleSinglePageViewer);
        document.removeEventListener('singlepageviewer:closed', this.boundHandleSinglePageViewer);
        document.removeEventListener('singlepageviewer:pagechanged', this.boundHandleSinglePageViewer);

        this.pageContainers.clear();
    }
}

// Register the custom element
customElements.define('inhaltsverzeichnis-scrollspy', InhaltsverzeichnisScrollspy);