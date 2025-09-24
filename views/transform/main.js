import "./site.css";
import "./search.js";
import "./akteure.js";
import { SinglePageViewer } from "./single-page-viewer.js";
import { ScrollToTopButton } from "./scroll-to-top.js";
import { InhaltsverzeichnisScrollspy } from "./inhaltsverzeichnis-scrollspy.js";
import { ErrorModal } from "./error-modal.js";
import { ExecuteSettleQueue } from "./helpers.js";
import {
	enlargePage,
	closeModal,
	scrollToPreviousPage,
	scrollToNextPage,
	scrollToBeilage,
	shareCurrentPage,
	generateCitation,
	copyPagePermalink,
	generatePageCitation,
	initializeNewspaperLayout,
} from "./issue.js";

// Update citation links to highlight current page references
function updateCitationLinks() {
	const currentPath = window.location.pathname;
	const citationLinks = document.querySelectorAll(".citation-link[data-citation-url]");

	citationLinks.forEach((link) => {
		const citationUrl = link.getAttribute("data-citation-url");
		let isCurrentPage = false;

		// Check for exact match
		if (citationUrl === currentPath) {
			isCurrentPage = true;
		} else {
			// Check if current path is an issue with page number that matches this citation
			const currentPathMatch = currentPath.match(/^\/(\d{4})\/(\d+)(?:\/(\d+))?$/);
			const citationUrlMatch = citationUrl.match(/^\/(\d{4})\/(\d+)$/);

			if (currentPathMatch && citationUrlMatch) {
				const [, currentYear, currentIssue, currentPage] = currentPathMatch;
				const [, citationYear, citationIssue] = citationUrlMatch;

				// If year and issue match, this citation refers to the current issue
				if (currentYear === citationYear && currentIssue === citationIssue) {
					isCurrentPage = true;
				}
			}
		}

		if (isCurrentPage) {
			// Style as current page: red text, no underline, not clickable
			link.classList.add("text-red-700", "pointer-events-none");
			link.setAttribute("aria-current", "page");
		} else {
			// Reset to default styling for non-current pages
			link.classList.remove("text-red-700", "pointer-events-none");
			link.removeAttribute("aria-current");
		}
	});
}

// Apply page-specific backdrop styling based on URL
function applyPageBackdrop() {
	const path = window.location.pathname;
	const body = document.body;

	// Remove any existing page-specific classes
	body.classList.remove(
		"page-akteure",
		"page-ausgabe",
		"page-search",
		"page-ort",
		"page-kategorie",
		"page-piece",
		"page-edition",
	);

	// Determine page type from URL path and apply appropriate class
	if (path.includes("/akteure/") || path.includes("/autoren")) {
		body.classList.add("page-akteure");
	} else if (path.match(/\/\d{4}\/\d+/)) {
		// Issue URLs like /1771/42 or /1771/42/166
		body.classList.add("page-ausgabe");
	} else if (path.includes("/search") || path.includes("/suche")) {
		body.classList.add("page-search");
	} else if (path.includes("/ort/")) {
		body.classList.add("page-ort");
	} else if (path.includes("/kategorie/")) {
		body.classList.add("page-kategorie");
	} else if (path.includes("/beitrag/")) {
		body.classList.add("page-piece");
	} else if (path.includes("/edition")) {
		body.classList.add("page-edition");
	}
}

// Export functions for global access - moved outside setup() so they're available immediately
window.enlargePage = enlargePage;
window.closeModal = closeModal;
window.scrollToPreviousPage = scrollToPreviousPage;
window.scrollToNextPage = scrollToNextPage;
window.scrollToBeilage = scrollToBeilage;
window.shareCurrentPage = shareCurrentPage;
window.generateCitation = generateCitation;
window.copyPagePermalink = copyPagePermalink;
window.generatePageCitation = generatePageCitation;

// Apply page-specific backdrop styling
applyPageBackdrop();

// Update citation links on initial load
updateCitationLinks();

// Initialize newspaper layout if present
if (document.querySelector(".newspaper-page-container")) {
	initializeNewspaperLayout();
}

// Akteure scrollspy web component will auto-initialize when present in template

// HTMX event handling for newspaper layout, scrollspy, and scroll-to-top button
let htmxAfterSwapHandler = function (event) {
	// Apply page-specific backdrop styling after navigation
	applyPageBackdrop();
	// Update citation links after navigation
	updateCitationLinks();

	// Execute all queued functions
	ExecuteSettleQueue();

	// Use shorter delay since afterSettle ensures DOM is ready
	setTimeout(() => {
		if (document.querySelector(".newspaper-page-container")) {
			initializeNewspaperLayout();
		}
	}, 50);
};

document.body.addEventListener("htmx:afterSettle", htmxAfterSwapHandler);
