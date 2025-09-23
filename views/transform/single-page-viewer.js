// ===========================
// SINGLE PAGE VIEWER COMPONENT
// ===========================

// Single Page Viewer Web Component
export class SinglePageViewer extends HTMLElement {
	constructor() {
		super();
		// No shadow DOM - use regular DOM to allow Tailwind CSS
		this.resizeObserver = null;

		// Zoom and pan state
		this.zoomLevel = 1;
		this.minZoom = 1; // No zoom below 100%
		this.maxZoom = 3;
		this.zoomStep = 0.1;
		this.isPanning = false;
		this.panStart = { x: 0, y: 0 };
		this.panOffset = { x: 0, y: 0 };
		this.dragDistance = 0;
	}

	// Dynamically detect sidebar width in pixels
	detectSidebarWidth() {
		// Find the actual sidebar element in the current layout
		const sidebar = document.querySelector('.lg\\:w-1\\/4, .lg\\:w-1\\/3, [class*="lg:w-1/"]');

		if (sidebar) {
			const sidebarRect = sidebar.getBoundingClientRect();
			const sidebarWidth = sidebarRect.width;
			console.log("Detected sidebar width:", sidebarWidth, "px");
			return `${sidebarWidth}px`;
		}

		// Fallback: calculate based on viewport width and responsive breakpoints
		const viewportWidth = window.innerWidth;

		if (viewportWidth < 1024) {
			// Below lg breakpoint - no sidebar space needed
			return "0px";
		} else if (viewportWidth < 1280) {
			// lg breakpoint: assume 1/4 of viewport (similar to both layouts)
			return `${Math.floor(viewportWidth * 0.25)}px`;
		} else {
			// xl breakpoint: assume 1/5 of viewport (narrower on larger screens)
			return `${Math.floor(viewportWidth * 0.2)}px`;
		}
	}

	connectedCallback() {
		// Detect sidebar width dynamically
		const sidebarWidth = this.detectSidebarWidth();

		this.innerHTML = `
			<div class="fixed inset-0 z-50 flex pointer-events-none">
				<!-- Keep Inhaltsverzeichnis area empty/transparent (collapsible) -->
				<div id="sidebar-spacer" style="width: ${sidebarWidth};" class="flex-shrink-0 transition-all duration-300"></div>

				<!-- Cover the right columns with the zoomed view -->
				<div class="flex-1 bg-slate-50 overflow-auto pointer-events-auto">
					<div class="relative min-h-full flex flex-col">
						<!-- Header with page info and buttons -->
						<div class="flex items-center justify-between p-4 bg-slate-50 relative z-10 border-b border-slate-200">
							<!-- Left: Sidebar toggle and page indicator -->
							<div class="flex items-center gap-3">
								<!-- Sidebar toggle button -->
								<button
									id="sidebar-toggle-btn"
									onclick="this.closest('single-page-viewer').toggleSidebar()"
									class="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Inhaltsverzeichnis ein-/ausblenden">
									<i class="ri-sidebar-fold-line text-lg font-bold"></i>
								</button>

								<!-- Page indicator with icon -->
								<div id="page-indicator" class="text-slate-800 flex items-center gap-3">
									<span id="page-icon" class="text-lg"></span>
									<span id="page-number" class="text-lg font-bold bg-blue-50 px-2 py-1 rounded flex items-center gap-1"></span>
								</div>

								<!-- Zoom indicator and reset -->
								<div class="flex items-center gap-2">
									<span id="zoom-indicator" class="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">100%</span>
									<button
										id="zoom-reset-btn"
										onclick="this.closest('single-page-viewer').resetZoom()"
										class="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer text-xs"
										title="Zoom zurücksetzen (1:1)">
										<i class="ri-zoom-out-line text-sm"></i>
									</button>
								</div>
							</div>

							<!-- Right: Action buttons -->
							<div class="flex items-center gap-3">
								<!-- Previous page button -->
								<button
									id="prev-page-btn"
									onclick="this.closest('single-page-viewer').goToPreviousPage()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Vorherige Seite">
									<i class="ri-arrow-left-line text-lg font-bold"></i>
								</button>

								<!-- Next page button -->
								<button
									id="next-page-btn"
									onclick="this.closest('single-page-viewer').goToNextPage()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Nächste Seite">
									<i class="ri-arrow-right-line text-lg font-bold"></i>
								</button>

								<!-- Separator -->
								<div class="w-px h-6 bg-gray-300"></div>

								<!-- Share button -->
								<button
									id="share-btn"
									onclick="this.closest('single-page-viewer').shareCurrentPage()"
									class="w-10 h-10 bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Link zu dieser Seite kopieren">
									<i class="ri-share-line text-lg font-bold"></i>
								</button>

								<!-- Cite button -->
								<button
									id="cite-btn"
									onclick="this.closest('single-page-viewer').generatePageCitation()"
									class="w-10 h-10 bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Zitation für diese Seite generieren">
									<i class="ri-file-text-line text-lg font-bold"></i>
								</button>

								<!-- Close button -->
								<button
									onclick="this.closest('single-page-viewer').close()"
									class="w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer"
									title="Schließen">
									<i class="ri-close-line text-lg font-bold"></i>
								</button>
							</div>
						</div>

						<!-- Image container that can scroll -->
						<div class="flex-1 flex items-center justify-center p-4 pb-8">
							<img
								id="single-page-image"
								src=""
								alt=""
								class="w-full h-auto rounded-lg shadow-2xl cursor-zoom-in"
								onclick="this.closest('single-page-viewer').handleImageClick()"
								title="Klicken zum Vergrößern oder Schließen"
							/>
						</div>
					</div>
				</div>
			</div>
		`;

		// Set up resize observer to handle window resizing
		this.setupResizeObserver();

		// Set up keyboard navigation
		this.setupKeyboardNavigation();

		// Set up zoom and pan functionality
		this.setupZoomAndPan();
	}

	// Set up resize observer to dynamically update sidebar width
	setupResizeObserver() {
		// Clean up existing observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}

		// Create new resize observer
		this.resizeObserver = new ResizeObserver(() => {
			this.updateSidebarWidth();
		});

		// Observe window resizing by watching the document body
		this.resizeObserver.observe(document.body);
	}

	// Update sidebar width when window is resized
	updateSidebarWidth() {
		const sidebarSpacer = this.querySelector("#sidebar-spacer");
		if (sidebarSpacer && !sidebarSpacer.style.width.includes("0px")) {
			// Only update if sidebar is not collapsed (not 0px width)
			const newWidth = this.detectSidebarWidth();
			sidebarSpacer.style.width = newWidth;
			console.log("Updated sidebar width to:", newWidth);
		}
	}

	show(
		imgSrc,
		imgAlt,
		pageNumber,
		isBeilage = false,
		targetPage = 0,
		partNumber = null,
		extractedIconType = null,
		extractedHeading = null,
	) {
		const img = this.querySelector("#single-page-image");
		const pageNumberSpan = this.querySelector("#page-number");
		const pageIconSpan = this.querySelector("#page-icon");
		const pageIndicator = this.querySelector("#page-indicator");

		img.src = imgSrc;
		img.alt = imgAlt;

		// Store current page info for button actions
		this.currentPageNumber = pageNumber;
		this.currentIsBeilage = isBeilage;
		this.currentPartNumber = partNumber;

		// Use extracted heading or fallback to generated heading
		let headingText;
		if (extractedHeading) {
			headingText = extractedHeading;
		} else {
			// Fallback: generate heading text
			const issueContext = this.getIssueContext(pageNumber);
			headingText = issueContext ? `${issueContext}, ${pageNumber}` : `${pageNumber}`;
		}

		// Set page number with heading text in the box
		pageNumberSpan.innerHTML = headingText;

		// Add red dot if this is the target page
		if (targetPage && pageNumber === targetPage) {
			pageNumberSpan.style.position = "relative";
			// Remove any existing red dot
			const existingDot = pageNumberSpan.querySelector(".target-page-dot");
			if (existingDot) {
				existingDot.remove();
			}
			// Add new red dot
			const redDot = document.createElement("span");
			redDot.className =
				"target-page-dot absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full z-10";
			redDot.title = "verlinkte Seite";
			pageNumberSpan.appendChild(redDot);
		}

		// Use extracted icon type or fallback to generated icon
		if (extractedIconType) {
			if (extractedIconType === "part-number" && partNumber !== null) {
				// Piece view: Show part number instead of icon
				pageIconSpan.innerHTML = `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${partNumber}. Teil</span>`;
			} else {
				// Use icon type from Go templates
				pageIconSpan.innerHTML = this.generateIconFromType(extractedIconType);
			}
		} else {
			// Fallback: generate simple icon
			pageIconSpan.innerHTML = this.generateFallbackIcon(pageNumber, isBeilage, partNumber);
		}

		// Page indicator styling is now consistent (white background)

		// Update navigation button visibility
		this.updateNavigationButtons();

		this.style.display = "block";

		// Reset zoom and pan state for new page
		this.resetZoom();

		// Scroll to top of the single page viewer (no smooth scrolling)
		const scrollContainer = this.querySelector(".flex-1.overflow-auto");
		if (scrollContainer) {
			scrollContainer.scrollTop = 0;
		}

		// Prevent background scrolling but allow scrolling within the viewer
		document.body.style.overflow = "hidden";
	}

	close() {
		this.style.display = "none";

		// Restore background scrolling
		document.body.style.overflow = "";
	}

	disconnectedCallback() {
		// Clean up resize observer
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		// Clean up keyboard event listener
		if (this.keyboardHandler) {
			document.removeEventListener('keydown', this.keyboardHandler);
			this.keyboardHandler = null;
		}

		// Clean up zoom and pan event listeners
		const imageContainer = this.querySelector('.flex-1.flex.items-center.justify-center');
		const image = this.querySelector('#single-page-image');

		if (imageContainer && this.wheelHandler) {
			imageContainer.removeEventListener('wheel', this.wheelHandler);
		}
		if (image) {
			if (this.mouseDownHandler) image.removeEventListener('mousedown', this.mouseDownHandler);
			if (this.doubleClickHandler) image.removeEventListener('dblclick', this.doubleClickHandler);
		}
		if (this.mouseMoveHandler) document.removeEventListener('mousemove', this.mouseMoveHandler);
		if (this.mouseUpHandler) document.removeEventListener('mouseup', this.mouseUpHandler);

		// Restore background scrolling
		document.body.style.overflow = "";
	}

	// Generate icon HTML from Go icon type - matches templating/engine.go PageIcon function
	generateIconFromType(iconType) {
		switch (iconType) {
			case "first":
				return `<i class="ri-file-text-line text-black text-lg" display: inline-block;"></i>`;
			case "last":
				return `<i class="ri-file-text-line text-black text-lg" style="transform: scaleX(-1); display: inline-block;"></i>`;
			case "even":
				return `<i class="ri-file-text-line text-black text-lg" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-slate-400 text-lg"></i>`;
			case "odd":
				return `<i class="ri-file-text-line text-slate-400 text-lg" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-black text-lg"></i>`;
			case "single":
				return `<i class="ri-file-text-line text-black text-lg"></i>`;
			default:
				return `<i class="ri-file-text-line text-black text-lg"></i>`;
		}
	}

	// Set up keyboard navigation
	setupKeyboardNavigation() {
		// Remove any existing listener to avoid duplicates
		if (this.keyboardHandler) {
			document.removeEventListener('keydown', this.keyboardHandler);
		}

		// Create bound handler
		this.keyboardHandler = (event) => {
			// Only handle keyboard events when the viewer is visible
			if (this.style.display === 'none') return;

			switch (event.key) {
				case 'ArrowLeft':
					event.preventDefault();
					this.goToPreviousPage();
					break;
				case 'ArrowRight':
					event.preventDefault();
					this.goToNextPage();
					break;
				case 'Escape':
					event.preventDefault();
					this.close();
					break;
				case '+':
				case '=':
					event.preventDefault();
					this.adjustZoom(this.zoomStep, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
					break;
				case '-':
					event.preventDefault();
					this.adjustZoom(-this.zoomStep, { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });
					break;
				case '0':
					event.preventDefault();
					this.resetZoom();
					break;
			}
		};

		// Add event listener
		document.addEventListener('keydown', this.keyboardHandler);
	}

	// Set up zoom and pan functionality
	setupZoomAndPan() {
		const imageContainer = this.querySelector('.flex-1.flex.items-center.justify-center');
		const image = this.querySelector('#single-page-image');

		if (!imageContainer || !image) return;

		// Mouse wheel zoom
		this.wheelHandler = (event) => {
			// Only zoom with Ctrl+scroll for better UX
			if (!event.ctrlKey) return;

			event.preventDefault();

			const delta = event.deltaY > 0 ? -this.zoomStep : this.zoomStep;
			this.adjustZoom(delta, event);
		};

		// Pan functionality
		this.mouseDownHandler = (event) => {
			if (this.zoomLevel <= 1) return; // Only pan when zoomed in

			event.preventDefault();
			this.isPanning = true;
			this.dragDistance = 0;
			this.panStart.x = event.clientX - this.panOffset.x;
			this.panStart.y = event.clientY - this.panOffset.y;

			image.style.cursor = 'grabbing';
		};

		this.mouseMoveHandler = (event) => {
			if (!this.isPanning || this.zoomLevel <= 1) return;

			event.preventDefault();

			const newX = event.clientX - this.panStart.x;
			const newY = event.clientY - this.panStart.y;

			// Track drag distance to determine if it was a real drag
			const deltaX = newX - this.panOffset.x;
			const deltaY = newY - this.panOffset.y;
			this.dragDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

			this.panOffset.x = newX;
			this.panOffset.y = newY;

			this.updateImageTransform();
		};

		this.mouseUpHandler = (event) => {
			if (this.isPanning) {
				this.isPanning = false;
				this.updateImageCursor();
			}
		};

		// Double click to reset zoom
		this.doubleClickHandler = (event) => {
			event.preventDefault();
			this.resetZoom();
		};

		// Add event listeners
		imageContainer.addEventListener('wheel', this.wheelHandler, { passive: false });
		image.addEventListener('mousedown', this.mouseDownHandler);
		document.addEventListener('mousemove', this.mouseMoveHandler);
		document.addEventListener('mouseup', this.mouseUpHandler);
		image.addEventListener('dblclick', this.doubleClickHandler);
	}

	// Adjust zoom level
	adjustZoom(delta, event) {
		const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));

		if (newZoom === this.zoomLevel) return;

		// Calculate zoom center point relative to image
		const image = this.querySelector('#single-page-image');
		const rect = image.getBoundingClientRect();
		const centerX = (event.clientX - rect.left) / rect.width;
		const centerY = (event.clientY - rect.top) / rect.height;

		// Adjust pan offset to zoom around mouse position
		const zoomRatio = newZoom / this.zoomLevel;
		this.panOffset.x = centerX * rect.width * (1 - zoomRatio) + this.panOffset.x * zoomRatio;
		this.panOffset.y = centerY * rect.height * (1 - zoomRatio) + this.panOffset.y * zoomRatio;

		this.zoomLevel = newZoom;
		this.updateImageTransform();
		this.updateImageCursor();
		this.updateZoomIndicator();
	}

	// Reset zoom to fit
	resetZoom() {
		this.zoomLevel = 1;
		this.panOffset.x = 0;
		this.panOffset.y = 0;
		this.updateImageTransform();
		this.updateImageCursor();
		this.updateZoomIndicator();
	}

	// Update image transform with boundaries
	updateImageTransform() {
		const image = this.querySelector('#single-page-image');
		if (!image) return;

		// Apply pan boundaries to keep image within view
		this.constrainPanOffset();

		if (this.zoomLevel === 1 && this.panOffset.x === 0 && this.panOffset.y === 0) {
			image.style.transform = '';
		} else {
			image.style.transform = `scale(${this.zoomLevel}) translate(${this.panOffset.x / this.zoomLevel}px, ${this.panOffset.y / this.zoomLevel}px)`;
		}

		// Update transform origin for better zoom behavior
		image.style.transformOrigin = 'center center';
	}

	// Constrain pan offset to keep image within container bounds
	constrainPanOffset() {
		const image = this.querySelector('#single-page-image');
		const container = this.querySelector('.flex-1.flex.items-center.justify-center');
		if (!image || !container) return;

		const imageRect = image.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();

		// Calculate the scaled image dimensions
		const scaledWidth = imageRect.width * this.zoomLevel;
		const scaledHeight = imageRect.height * this.zoomLevel;

		// Calculate maximum allowed pan offsets
		const maxPanX = Math.max(0, (scaledWidth - containerRect.width) / 2);
		const maxPanY = Math.max(0, (scaledHeight - containerRect.height) / 2);

		// Constrain pan offsets
		this.panOffset.x = Math.max(-maxPanX, Math.min(maxPanX, this.panOffset.x));
		this.panOffset.y = Math.max(-maxPanY, Math.min(maxPanY, this.panOffset.y));
	}

	// Update cursor based on zoom state
	updateImageCursor() {
		const image = this.querySelector('#single-page-image');
		if (!image) return;

		if (this.zoomLevel > 1) {
			// When zoomed in: show grab cursor for panning
			image.className = image.className.replace('cursor-zoom-in', 'cursor-grab');
			image.title = 'Ziehen zum Verschieben';
		} else {
			// At 100%: show zoom-in cursor for zooming in
			image.className = image.className.replace('cursor-grab', 'cursor-zoom-in');
			image.title = 'Klicken zum Vergrößern oder Schließen';
		}
	}

	// Update zoom level indicator
	updateZoomIndicator() {
		const indicator = this.querySelector('#zoom-indicator');
		const resetBtn = this.querySelector('#zoom-reset-btn');
		if (!indicator || !resetBtn) return;

		if (this.zoomLevel === 1) {
			// At 100%: Show helpful text and hide reset button
			indicator.textContent = 'Strg + Mausrad oder +/- für Zoom';
			indicator.className = 'text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded';
			resetBtn.style.display = 'none';
		} else {
			// Zoomed: Show percentage and reset button
			const percentage = Math.round(this.zoomLevel * 100);
			indicator.textContent = `${percentage}%`;
			indicator.className = 'text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded';
			resetBtn.style.display = 'flex';
		}
	}

	// Handle image click (always close viewer)
	handleImageClick(event) {
		// If it was a drag, don't do anything
		if (this.dragDistance >= 5) {
			this.dragDistance = 0;
			return;
		}

		// Always close the viewer when clicking
		this.close();

		// Reset drag distance for next interaction
		this.dragDistance = 0;
	}

	// Share current page
	shareCurrentPage() {
		if (typeof copyPagePermalink === "function") {
			// Use the actual button element
			const shareBtn = this.querySelector("#share-btn");
			copyPagePermalink(this.currentPageNumber, shareBtn, this.currentIsBeilage);
		}
	}

	// Generate citation for current page
	generatePageCitation() {
		if (typeof generatePageCitation === "function") {
			// Use the actual button element
			const citeBtn = this.querySelector("#cite-btn");
			generatePageCitation(this.currentPageNumber, citeBtn);
		}
	}

	// Update navigation button visibility based on available pages
	updateNavigationButtons() {
		const prevBtn = this.querySelector("#prev-page-btn");
		const nextBtn = this.querySelector("#next-page-btn");

		const { prevPage, nextPage } = this.getAdjacentPages();

		// Enable/disable previous page button
		if (prevPage !== null) {
			prevBtn.disabled = false;
			prevBtn.className = prevBtn.className.replace("opacity-50 cursor-not-allowed", "");
			prevBtn.className = prevBtn.className.replace(
				"bg-gray-50 text-gray-400",
				"bg-gray-100 text-gray-700",
			);
		} else {
			prevBtn.disabled = true;
			if (!prevBtn.className.includes("opacity-50")) {
				prevBtn.className += " opacity-50 cursor-not-allowed";
			}
			prevBtn.className = prevBtn.className.replace(
				"bg-gray-100 text-gray-700",
				"bg-gray-50 text-gray-400",
			);
		}

		// Enable/disable next page button
		if (nextPage !== null) {
			nextBtn.disabled = false;
			nextBtn.className = nextBtn.className.replace("opacity-50 cursor-not-allowed", "");
			nextBtn.className = nextBtn.className.replace(
				"bg-gray-50 text-gray-400",
				"bg-gray-100 text-gray-700",
			);
		} else {
			nextBtn.disabled = true;
			if (!nextBtn.className.includes("opacity-50")) {
				nextBtn.className += " opacity-50 cursor-not-allowed";
			}
			nextBtn.className = nextBtn.className.replace(
				"bg-gray-100 text-gray-700",
				"bg-gray-50 text-gray-400",
			);
		}
	}

	// Get previous and next page numbers
	getAdjacentPages() {
		// Get all page containers of the same type (main or beilage)
		let containerSelector;
		if (this.currentIsBeilage) {
			containerSelector = '.newspaper-page-container[data-beilage="true"]';
		} else {
			containerSelector = ".newspaper-page-container:not([data-beilage])";
		}

		const pageContainers = Array.from(document.querySelectorAll(containerSelector));
		console.log(
			"Found containers:",
			pageContainers.length,
			"for",
			this.currentIsBeilage ? "beilage" : "main",
		);

		// Extract page numbers and sort them
		const allPages = pageContainers
			.map((container) => {
				const pageAttr = container.getAttribute("data-page-container");
				const pageNum = pageAttr ? parseInt(pageAttr) : null;
				console.log("Container page:", pageAttr, "parsed:", pageNum);
				return pageNum;
			})
			.filter((p) => p !== null)
			.sort((a, b) => a - b);

		console.log("All pages found:", allPages);
		console.log("Current page:", this.currentPageNumber);

		const currentIndex = allPages.indexOf(this.currentPageNumber);
		console.log("Current index:", currentIndex);

		let prevPage = null;
		let nextPage = null;

		if (currentIndex > 0) {
			prevPage = allPages[currentIndex - 1];
		}

		if (currentIndex < allPages.length - 1) {
			nextPage = allPages[currentIndex + 1];
		}

		console.log("Adjacent pages - prev:", prevPage, "next:", nextPage);
		return { prevPage, nextPage };
	}

	// Navigate to previous page
	goToPreviousPage() {
		const { prevPage } = this.getAdjacentPages();
		if (prevPage !== null) {
			this.navigateToPage(prevPage);
		}
	}

	// Navigate to next page
	goToNextPage() {
		const { nextPage } = this.getAdjacentPages();
		if (nextPage !== null) {
			this.navigateToPage(nextPage);
		}
	}

	// Navigate to a specific page
	navigateToPage(pageNumber) {
		// Find the image element for the target page
		const containerSelector = this.currentIsBeilage
			? '.newspaper-page-container[data-beilage="true"]'
			: ".newspaper-page-container:not([data-beilage])";
		const targetContainer = document.querySelector(
			`${containerSelector}[data-page-container="${pageNumber}"]`,
		);

		if (targetContainer) {
			const imgElement = targetContainer.querySelector(".newspaper-page-image, .piece-page-image");
			if (imgElement) {
				// Determine part number for piece view
				let newPartNumber = null;
				if (this.currentPartNumber !== null) {
					// We're in piece view, try to find the part number for the new page
					newPartNumber = this.getPartNumberForPage(pageNumber);
				}

				// Extract icon type and heading for the new page
				let extractedIconType = null;
				let extractedHeading = null;

				// Extract icon type from data attribute
				extractedIconType = targetContainer.getAttribute("data-page-icon-type");

				// For piece view: check if part number should override icon
				const partNumberElement = targetContainer.querySelector(".part-number");
				if (partNumberElement) {
					extractedIconType = "part-number";
				}

				// Extract heading text from page indicator
				const pageIndicator = targetContainer.querySelector(".page-indicator");
				if (pageIndicator) {
					// Clone the page indicator to extract text without buttons/icons
					const indicatorClone = pageIndicator.cloneNode(true);
					// Remove any icons to get just the text
					const icons = indicatorClone.querySelectorAll("i");
					icons.forEach((icon) => icon.remove());
					// Remove any link indicators
					const linkIndicators = indicatorClone.querySelectorAll(
						'[class*="target-page-dot"], .target-page-indicator',
					);
					linkIndicators.forEach((indicator) => indicator.remove());
					extractedHeading = indicatorClone.textContent.trim();
				}

				// Update the current view with the new page
				this.show(
					imgElement.src,
					imgElement.alt,
					pageNumber,
					this.currentIsBeilage,
					0,
					newPartNumber,
					extractedIconType,
					extractedHeading,
				);
			}
		}
	}

	// Get part number for a specific page in piece view
	getPartNumberForPage(pageNumber) {
		// Try to find the part number from the page container in piece view
		const pageContainer = document.querySelector(`[data-page-container="${pageNumber}"]`);
		if (pageContainer) {
			const partNumberElement = pageContainer.querySelector(".part-number");
			if (partNumberElement) {
				// Extract just the number from "X. Teil" format
				const match = partNumberElement.textContent.match(/(\d+)\./);
				if (match) {
					return parseInt(match[1]);
				}
			}
		}

		// Fallback: if we can't find it, return null to show icon instead
		return null;
	}

	// Legacy fallback icon generation (only used when extraction fails)
	generateFallbackIcon(pageNumber, isBeilage, partNumber) {
		if (partNumber !== null) {
			// Piece view: Show part number instead of icon
			return `<span class="part-number bg-slate-100 text-slate-800 font-bold px-1.5 py-0.5 rounded border border-slate-400 flex items-center justify-center">${partNumber}. Teil</span>`;
		} else {
			// Issue view: Simple fallback icon
			const baseClass = "ri-file-text-line text-lg";
			const iconColor = isBeilage ? "text-amber-600" : "text-black";
			return `<i class="${baseClass} ${iconColor}"></i>`;
		}
	}

	// Toggle sidebar visibility
	toggleSidebar() {
		const sidebarSpacer = this.querySelector("#sidebar-spacer");
		const toggleBtn = this.querySelector("#sidebar-toggle-btn");
		const toggleIcon = toggleBtn.querySelector("i");

		// Check if sidebar is currently collapsed by looking at width
		const currentWidth = sidebarSpacer.style.width;
		const isCollapsed = currentWidth === "0px" || currentWidth === "0";

		console.log("Current state - isCollapsed:", isCollapsed);
		console.log("Current width:", currentWidth);

		if (isCollapsed) {
			// Sidebar is collapsed, expand it
			const fullWidth = this.detectSidebarWidth();
			sidebarSpacer.style.width = fullWidth;

			// Update button to normal state (sidebar visible)
			toggleBtn.className =
				"w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer";
			toggleIcon.className = "ri-sidebar-fold-line text-lg font-bold";
			toggleBtn.title = "Inhaltsverzeichnis ausblenden";
			console.log("Expanding sidebar to:", fullWidth);
		} else {
			// Sidebar is expanded, collapse it
			sidebarSpacer.style.width = "0px";

			// Update button to active state (sidebar hidden - orange highlight)
			toggleBtn.className =
				"w-10 h-10 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded flex items-center justify-center transition-colors duration-200 cursor-pointer";
			toggleIcon.className = "ri-sidebar-unfold-line text-lg font-bold";
			toggleBtn.title = "Inhaltsverzeichnis einblenden";
			console.log("Collapsing sidebar");
		}

		console.log("New width:", sidebarSpacer.style.width);
	}

	// Extract issue context from document title, URL, or page container
	getIssueContext(pageNumber) {
		// Determine if we're in a piece view (beitrag) or issue view (ausgabe)
		const path = window.location.pathname;
		const isPieceView = path.includes("/beitrag/");

		if (isPieceView) {
			// For piece view: Return full format "1765 Nr. 2"
			// Try to get context from page container first (for piece view)
			const pageContainer = document.querySelector(`[data-page-container="${pageNumber}"]`);
			if (pageContainer) {
				// Look for existing page indicator with context
				const pageIndicator = pageContainer.querySelector(".page-indicator");
				if (pageIndicator) {
					const text = pageIndicator.textContent.trim();
					// Extract full date and issue from text like "3.7.1767 Nr. 53, 213"
					const fullDateMatch = text.match(/(\d{1,2}\.\d{1,2}\.\d{4}\s+Nr\.\s+\d+)/);
					if (fullDateMatch) {
						return fullDateMatch[1];
					}
					// Fallback: Extract year and issue from text like "1768 Nr. 20, 79"
					const yearMatch = text.match(/(\d{4})\s+Nr\.\s+(\d+)/);
					if (yearMatch) {
						return `${yearMatch[1]} Nr. ${yearMatch[2]}`;
					}
				}
			}

			// Fallback: Try to extract from document title
			const title = document.title;
			const titleMatch = title.match(/(\d{4}).*Nr\.\s*(\d+)/);
			if (titleMatch) {
				return `${titleMatch[1]} Nr. ${titleMatch[2]}`;
			}
		} else {
			// For issue view: Return just empty string (page number only)
			return "";
		}

		// Final fallback: Try to extract from URL path
		const urlMatch = path.match(/\/(\d{4})\/(\d+)/);
		if (urlMatch) {
			return isPieceView ? `${urlMatch[1]} Nr. ${urlMatch[2]}` : "";
		}

		// Fallback - try to get from any visible page context
		const anyPageIndicator = document.querySelector(".page-indicator");
		if (anyPageIndicator) {
			const text = anyPageIndicator.textContent.trim();
			const match = text.match(/(\d{4})\s+Nr\.\s+(\d+)/);
			if (match) {
				return `${match[1]} Nr. ${match[2]}`;
			}
		}

		// Ultimate fallback
		return "KGPZ";
	}
}

// Register the web component
customElements.define("single-page-viewer", SinglePageViewer);

// Clean up single page viewer on HTMX navigation
document.body.addEventListener("htmx:beforeRequest", function (event) {
	// Find any active single page viewer
	const viewer = document.querySelector("single-page-viewer");
	if (viewer && viewer.style.display !== "none") {
		console.log("Cleaning up single page viewer before HTMX navigation");
		viewer.close();
	}
});

// Also clean up on page unload as fallback
window.addEventListener("beforeunload", function () {
	const viewer = document.querySelector("single-page-viewer");
	if (viewer) {
		viewer.close();
	}
});
