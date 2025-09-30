/**
 * Places Filter Web Component
 * Provides search functionality for filtering place cards in the overview
 */
export class PlacesFilter extends HTMLElement {
	constructor() {
		super();
		this.searchInput = null;
		this.placeCards = [];
		this.countElement = null;
		this.debounceTimer = null;
		this.originalCount = 0;
	}

	connectedCallback() {
		this.render();
		this.setupEventListeners();
		this.initializePlaceCards();
	}

	disconnectedCallback() {
		this.cleanupEventListeners();
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
	}

	render() {
		this.innerHTML = `
			<div class="mb-6">
				<input
					type="text"
					id="places-search"
					placeholder="Ortsnamen eingeben..."
					autocomplete="off"
					class="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
				>
			</div>
		`;
	}

	setupEventListeners() {
		this.searchInput = this.querySelector("#places-search");
		if (this.searchInput) {
			this.searchInput.addEventListener("input", this.handleSearchInput.bind(this));
		}
	}

	cleanupEventListeners() {
		if (this.searchInput) {
			this.searchInput.removeEventListener("input", this.handleSearchInput.bind(this));
		}
	}

	initializePlaceCards() {
		// Find all place cards and the count element
		const container = this.closest(".bg-white") || document;
		this.placeCards = Array.from(container.querySelectorAll("[data-place-name]"));
		this.countElement = container.querySelector("[data-places-count]");

		if (this.countElement) {
			this.originalCount = this.placeCards.length;
		}
	}

	handleSearchInput(event) {
		// Clear previous debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}

		// Debounce the search to avoid excessive filtering
		this.debounceTimer = setTimeout(() => {
			this.filterPlaces(event.target.value.trim());
		}, 150);
	}

	filterPlaces(searchTerm) {
		if (!this.placeCards.length) return;

		const normalizedSearch = searchTerm.toLowerCase();
		let visibleCount = 0;

		this.placeCards.forEach((card) => {
			const placeName = card.getAttribute("data-place-name")?.toLowerCase() || "";
			const modernName = card.getAttribute("data-modern-name")?.toLowerCase() || "";

			// Check if search term matches either the place name or modern name
			const isMatch =
				searchTerm === "" ||
				placeName.includes(normalizedSearch) ||
				modernName.includes(normalizedSearch);

			if (isMatch) {
				card.style.display = "";
				visibleCount++;
			} else {
				card.style.display = "none";
			}
		});

		// Update the count display
		this.updateCountDisplay(visibleCount, searchTerm);
	}

	updateCountDisplay(visibleCount, searchTerm) {
		if (!this.countElement) return;

		if (searchTerm === "") {
			// Show original count when no search
			this.countElement.textContent = `Alle Orte (${this.originalCount})`;
		} else if (visibleCount === 0) {
			// Show no results message
			this.countElement.textContent = `Keine Orte gefunden für "${searchTerm}"`;
		} else {
			// Show filtered count
			this.countElement.textContent = `${visibleCount} von ${this.originalCount} Orten`;
		}
	}
}

/**
 * Place Accordion Web Component
 * Individual accordion for each place with expand/collapse functionality
 */
export class PlaceAccordion extends HTMLElement {
	constructor() {
		super();
		this.isExpanded = false;
		this.isLoading = false;
		this.hasLoaded = false;

		// Bind event handlers to maintain consistent references
		this.boundHandleClick = this.handleClick.bind(this);
		this.boundHandleMapClick = this.handleMapClick.bind(this);
		this.boundHandleHeadingHover = this.handleHeadingHover.bind(this);
		this.boundHandleHeadingLeave = this.handleHeadingLeave.bind(this);
	}

	connectedCallback() {
		this.setupAccordion();
		this.setupEventListeners();
		this.setupMapEventListeners();
		this.setupHoverEvents();
	}

	disconnectedCallback() {
		this.cleanupEventListeners();
		this.cleanupMapEventListeners();
	}

	cleanupMapEventListeners() {
		// Clean up map event listeners
		document.removeEventListener("place-map-clicked", this.boundHandleMapClick);

		// Clean up hover event listeners
		this.removeEventListener("mouseenter", this.boundHandleHeadingHover);
		this.removeEventListener("mouseleave", this.boundHandleHeadingLeave);
	}

	setupAccordion() {
		if (!this.querySelector("[data-content]")) {
			const placeId = this.getAttribute("data-place-id");
			const contentContainer = document.createElement("div");
			contentContainer.setAttribute("data-content", "");
			contentContainer.className =
				"accordion-content overflow-hidden transition-all duration-300 max-h-0 border-b border-slate-200";

			// Add HTMX attributes to override body defaults
			contentContainer.setAttribute("hx-get", `/ort/fragment/${placeId}`);
			contentContainer.setAttribute("hx-trigger", "load-content");
			contentContainer.setAttribute("hx-swap", "innerHTML");
			contentContainer.setAttribute("hx-target", "this");
			contentContainer.setAttribute("hx-select", ".place-fragment-content");
			contentContainer.setAttribute("hx-boost", "false"); // Override body's hx-boost="true"

			this.appendChild(contentContainer);
		}
	}

	setupEventListeners() {
		// Add click listener to the entire component
		this.addEventListener("click", this.boundHandleClick);
	}

	cleanupEventListeners() {
		this.removeEventListener("click", this.boundHandleClick);
	}

	setupMapEventListeners() {
		// Listen for map click events
		document.addEventListener("place-map-clicked", this.boundHandleMapClick);
	}

	setupHoverEvents() {
		// Add hover listeners to the entire accordion element (including expanded content)
		this.addEventListener("mouseenter", this.boundHandleHeadingHover);
		this.addEventListener("mouseleave", this.boundHandleHeadingLeave);
	}

	handleHeadingHover() {
		const placeId = this.getAttribute("data-place-id");
		if (placeId) {
			// Emit event to show tooltip on map
			const showTooltipEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId, action: "show" },
				bubbles: true,
			});
			document.dispatchEvent(showTooltipEvent);
		}
	}

	handleHeadingLeave() {
		const placeId = this.getAttribute("data-place-id");
		if (placeId) {
			// Emit event to hide tooltip on map
			const hideTooltipEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId, action: "hide" },
				bubbles: true,
			});
			document.dispatchEvent(hideTooltipEvent);
		}
	}

	handleMapClick(event) {
		const clickedPlaceId = event.detail.placeId;
		const myPlaceId = this.getAttribute("data-place-id");

		// If this accordion matches the clicked place, expand it
		if (clickedPlaceId === myPlaceId && !this.isExpanded) {
			// Add a small delay to allow scrolling to complete first
			setTimeout(() => {
				this.expand();
			}, 800); // Delay matches scroll animation + highlight effect
		}
	}

	handleClick(event) {
		// Only handle clicks on the place name area, not on expanded content
		const contentContainer = this.querySelector("[data-content]");
		if (contentContainer && contentContainer.contains(event.target)) {
			return; // Don't toggle if clicking inside expanded content
		}

		this.toggle();
	}

	toggle() {
		if (this.isExpanded) {
			this.collapse();
		} else {
			this.expand();
		}
	}

	expand() {
		if (this.isLoading) return;

		this.isExpanded = true;

		const contentContainer = this.querySelector("[data-content]");
		if (!contentContainer) return;

		// Load content if not already loaded
		if (!this.hasLoaded) {
			this.loadContent();
		} else {
			// Just show existing content
			contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";
		}
	}

	collapse() {
		this.isExpanded = false;

		const contentContainer = this.querySelector("[data-content]");
		if (contentContainer) {
			contentContainer.style.maxHeight = "0px";
		}
	}

	loadContent() {
		this.isLoading = true;
		const contentContainer = this.querySelector("[data-content]");

		// Show loading state
		contentContainer.innerHTML = '<div class="p-4 text-center text-slate-500">Lädt...</div>';
		contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";

		// Set up event listeners for HTMX events
		const handleAfterRequest = () => {
			this.hasLoaded = true;
			this.isLoading = false;
			// Adjust height after content loads
			setTimeout(() => {
				contentContainer.style.maxHeight = contentContainer.scrollHeight + "px";
			}, 10);
			contentContainer.removeEventListener("htmx:afterRequest", handleAfterRequest);
		};

		const handleResponseError = () => {
			this.isLoading = false;
			contentContainer.innerHTML =
				'<div class="p-4 text-center text-red-500">Fehler beim Laden</div>';
			contentContainer.removeEventListener("htmx:responseError", handleResponseError);
		};

		contentContainer.addEventListener("htmx:afterRequest", handleAfterRequest);
		contentContainer.addEventListener("htmx:responseError", handleResponseError);

		// Trigger the HTMX request
		htmx.trigger(contentContainer, "load-content");
	}
}

/**
 * Places Map Web Component
 * Embeds an SVG map with plotted geographical places
 */
export class PlacesMap extends HTMLElement {
	constructor() {
		super();
		this.places = [];
		this.mapElement = null;
		this.pointsContainer = null;
		this.intersectionObserver = null;
		this.mapPoints = new Map(); // Map of placeId -> point element
		this.tooltip = null;

		// New tooltip system properties
		this.showTimeout = null;
		this.hideTimeout = null;
		this.isTooltipVisible = false;

		// Simple place ID tracking
		this.currentHoveredPlaceId = "";

		// Bind event handlers to maintain consistent references
		this.boundHandleHeadingHoverEvent = this.handleHeadingHoverEvent.bind(this);
	}

	connectedCallback() {
		this.parseData();
		this.render();
		this.initializeMap();
		// Delay scrollspy initialization to ensure DOM is ready
		setTimeout(() => {
			this.initializeScrollspy();
		}, 200);
		this.setupHeadingHoverListener();
	}

	parseData() {
		try {
			const placesData = this.dataset.places;
			if (placesData) {
				this.places = JSON.parse(placesData);
			}
		} catch (error) {
			console.error("Failed to parse places data:", error);
			this.places = [];
		}
	}

	render() {
		this.innerHTML = `
			<div class="map-container relative w-full aspect-[5/7] overflow-hidden bg-slate-100">
				<div class="transform-wrapper absolute top-0 left-0 w-full h-auto origin-top-left">
					<img src="/assets/Europe.svg" alt="Map of Europe" class="block w-full h-auto">
					<div class="points-container absolute top-0 left-0 w-full h-full"></div>
				</div>
				<div class="absolute bottom-0 right-0 h-auto text-[0.6rem] bg-white px-0.5 bg-opacity-[0.5] border">
					<i class="ri-creative-commons-line"></i>
					<a href="https://commons.wikimedia.org/wiki/File:Europe_laea_topography.svg" target="_blank" class="">
						 Wikimedia Commons
					</a>
				</div>
				<!-- Tooltip -->
				<div class="map-tooltip absolute bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200 z-30 whitespace-nowrap" style="transform: translate(-50%, -100%); margin-top: -8px;"></div>
			</div>
		`;

		this.mapElement = this.querySelector(".map-container");
		this.pointsContainer = this.querySelector(".points-container");
		this.tooltip = this.querySelector(".map-tooltip");
	}

	initializeMap() {
		if (!this.places.length || !this.pointsContainer) {
			return;
		}

		// Create one large SVG overlay that matches the map size
		const mapOverlaySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		mapOverlaySvg.setAttribute("class", "absolute top-0 left-0 w-full h-full");
		mapOverlaySvg.style.pointerEvents = "none"; // Let map interactions pass through
		mapOverlaySvg.style.overflow = "visible";
		mapOverlaySvg.setAttribute("viewBox", "0 0 100 100");
		mapOverlaySvg.setAttribute("preserveAspectRatio", "none");

		// Create defs element for gradients
		const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

		// Create radial gradient for red dots
		const redGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
		redGradient.setAttribute("id", "redDotGradient");
		redGradient.setAttribute("cx", "30%");
		redGradient.setAttribute("cy", "30%");
		redGradient.setAttribute("r", "70%");

		const stopLight = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		stopLight.setAttribute("offset", "0%");
		stopLight.setAttribute("stop-color", "#f56565"); // Slightly lighter red

		const stopDark = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		stopDark.setAttribute("offset", "100%");
		stopDark.setAttribute("stop-color", "#e53e3e"); // Slightly darker red

		redGradient.appendChild(stopLight);
		redGradient.appendChild(stopDark);
		defs.appendChild(redGradient);
		mapOverlaySvg.appendChild(defs);

		this.pointsContainer.appendChild(mapOverlaySvg);

		// Map extent constants
		const MAP_EXTENT_METERS = { xmin: 2555000, ymin: 1350000, xmax: 7405000, ymax: 5500000 };
		const PROJECTION_CENTER = { lon: 10, lat: 52 };

		// Convert lat/lng to % calculation
		const convertLatLngToPercent = (lat, lng) => {
			const R = 6371000;
			const FE = 4321000;
			const FN = 3210000;
			const lon_0_rad = (PROJECTION_CENTER.lon * Math.PI) / 180;
			const lat_0_rad = (PROJECTION_CENTER.lat * Math.PI) / 180;
			const lon_rad = (lng * Math.PI) / 180;
			const lat_rad = (lat * Math.PI) / 180;
			const k_prime = Math.sqrt(
				2 /
					(1 +
						Math.sin(lat_0_rad) * Math.sin(lat_rad) +
						Math.cos(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad)),
			);
			const x_proj = R * k_prime * Math.cos(lat_rad) * Math.sin(lon_rad - lon_0_rad);
			const y_proj =
				R *
				k_prime *
				(Math.cos(lat_0_rad) * Math.sin(lat_rad) -
					Math.sin(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad));
			const finalX = x_proj + FE;
			const finalY = y_proj + FN;
			const mapWidthMeters = MAP_EXTENT_METERS.xmax - MAP_EXTENT_METERS.xmin;
			const mapHeightMeters = MAP_EXTENT_METERS.ymax - MAP_EXTENT_METERS.ymin;
			const xPercent = ((finalX - MAP_EXTENT_METERS.xmin) / mapWidthMeters) * 100;
			const yPercent = ((MAP_EXTENT_METERS.ymax - finalY) / mapHeightMeters) * 100;
			return { x: xPercent, y: yPercent };
		};

		// Create circles and track positions
		const pointPositions = [];
		this.places.forEach((place) => {
			if (place.lat && place.lng) {
				const lat = parseFloat(place.lat);
				const lng = parseFloat(place.lng);
				const position = convertLatLngToPercent(lat, lng);

				// Only add points that are within the visible map area
				if (position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100) {
					pointPositions.push(position);

					// Create circle element directly in the overlay SVG
					const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
					circle.setAttribute("cx", position.x.toString());
					circle.setAttribute("cy", position.y.toString());
					circle.setAttribute("r", "0.4"); // Small radius in % units
					circle.setAttribute("fill", "white");
					circle.setAttribute("opacity", "0.7");
					circle.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))");
					circle.style.cursor = "pointer";
					circle.style.pointerEvents = "all";
					circle.style.transition =
						"r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, opacity 0.3s ease";

					// Add hover effects for white dots
					circle.addEventListener("mouseenter", () => {
						if (circle.getAttribute("fill") === "white") {
							circle.setAttribute("r", "0.6"); // Bigger on hover
							circle.setAttribute("fill", "#f87171"); // Light red on hover
							circle.setAttribute("opacity", "1");
						}
					});

					circle.addEventListener("mouseleave", () => {
						if (circle.getAttribute("fill") === "#f87171") {
							circle.setAttribute("r", "0.4"); // Back to original size
							circle.setAttribute("fill", "white"); // Back to white
							circle.setAttribute("opacity", "0.7");
						}
					});

					const tooltipText = `${place.name}${place.toponymName && place.toponymName !== place.name ? ` (${place.toponymName})` : ""}`;
					circle.dataset.placeId = place.id;
					circle.dataset.tooltipText = tooltipText;

					// Add hover and click event listeners
					circle.addEventListener("mouseenter", (e) => this.showTooltip(e));
					circle.addEventListener("mouseleave", () => this.hideTooltip());
					circle.addEventListener("mousemove", (e) => this.updateTooltipPosition(e));
					circle.addEventListener("click", (e) => this.scrollToPlace(e));

					mapOverlaySvg.appendChild(circle);

					// Store reference to circle for scrollspy
					this.mapPoints.set(place.id, circle);
				}
			}
		});

		// Auto-zoom
		if (pointPositions.length > 0) {
			this.autoZoomToPoints(pointPositions);
		}
	}

	// Calculate bounding box of all points for the auto-zoom
	autoZoomToPoints(pointPositions) {
		let minX = 100,
			maxX = 0,
			minY = 100,
			maxY = 0;
		pointPositions.forEach((pos) => {
			if (pos.x < minX) minX = pos.x;
			if (pos.x > maxX) maxX = pos.x;
			if (pos.y < minY) minY = pos.y;
			if (pos.y > maxY) maxY = pos.y;
		});

		// 5% padding
		const PADDING = 0.06;
		const width = maxX - minX;
		const height = maxY - minY;
		const paddingX = width * PADDING;
		const paddingY = height * PADDING;

		const paddedMinX = Math.max(0, minX - paddingX);
		const paddedMaxX = Math.min(100, maxX + paddingX);
		const paddedMinY = Math.max(0, minY - paddingY);
		const paddedMaxY = Math.min(100, maxY + paddingY);

		const newWidth = paddedMaxX - paddedMinX;
		const newHeight = paddedMaxY - paddedMinY;

		// Maintain 5:7 aspect ratio
		const ASPECT_RATIO = 5 / 7;
		const pointsAspectRatio = newWidth / newHeight;

		let finalViewBox = { x: paddedMinX, y: paddedMinY, width: newWidth, height: newHeight };

		if (pointsAspectRatio > ASPECT_RATIO) {
			const newTargetHeight = newWidth / ASPECT_RATIO;
			finalViewBox.y = paddedMinY - (newTargetHeight - newHeight) / 2;
			finalViewBox.height = newTargetHeight;
		} else {
			const newTargetWidth = newHeight * ASPECT_RATIO;
			finalViewBox.x = paddedMinX - (newTargetWidth - newWidth) / 2;
			finalViewBox.width = newTargetWidth;
		}

		// Apply transformation
		const scale = 100 / finalViewBox.width;
		const translateX = -finalViewBox.x;
		const translateY = -finalViewBox.y;

		const transformValue = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
		const transformWrapper = this.querySelector(".transform-wrapper");
		if (transformWrapper) {
			transformWrapper.style.transform = transformValue;
		}
	}

	initializeScrollspy() {
		// Find all place containers in the places list
		const placeContainers = document.querySelectorAll("place-accordion[data-place-id]");
		if (!placeContainers.length) return;

		// First, ensure all points start in inactive state
		this.mapPoints.forEach((point) => {
			this.setPointInactive(point);
		});

		// Create intersection observer
		this.intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const placeId = entry.target.getAttribute("data-place-id");
					const mapPoint = this.mapPoints.get(placeId);

					if (mapPoint) {
						if (entry.isIntersecting) {
							// Activate the point when place is in view
							this.setPointActive(mapPoint);
						} else {
							// Deactivate the point when place is out of view
							this.setPointInactive(mapPoint);
						}
					}
				});
			},
			{
				// Trigger when any part enters viewport - better for small elements
				threshold: 0,
				// Add some margin to trigger slightly before/after entering viewport
				rootMargin: "10px 0px",
			},
		);

		// Observe all place containers
		placeContainers.forEach((container) => {
			this.intersectionObserver.observe(container);
		});
	}

	setPointActive(circle) {
		// Active state: darker red circle with wider dark border and small shadow
		circle.setAttribute("r", "0.6"); // Bigger radius in % units
		circle.setAttribute("fill", "#dc2626");
		circle.setAttribute("stroke", "#b91c1c");
		circle.setAttribute("stroke-width", "0.12");
		circle.setAttribute("opacity", "1");
		circle.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))");
		// Move to end of SVG to appear on top
		if (circle.parentNode) {
			circle.parentNode.appendChild(circle);
		}
	}

	setPointInactive(circle) {
		// Inactive state: small white circle
		circle.setAttribute("r", "0.4"); // Small radius in % units
		circle.setAttribute("fill", "white");
		circle.setAttribute("stroke", "none");
		circle.setAttribute("opacity", "0.7");
		circle.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))");
		// No need to reorder for inactive state
	}

	showTooltip(event) {
		const point = event.target;
		const tooltipText = point.dataset.tooltipText;
		const placeId = point.dataset.placeId;

		// Don't show NEW tooltip if scrolling blocked (behavior 4)
		if (this.isNewPopupBlocked(placeId)) {
			return;
		}

		if (this.tooltip && tooltipText) {
			// Set tooltip content and position
			this.tooltip.textContent = tooltipText;
			this.updateTooltipPosition(event);

			// Show immediately for map points (behavior 1)
			this.clearTimeouts();
			this.tooltip.classList.remove("opacity-0");
			this.tooltip.classList.add("opacity-100");
			this.isTooltipVisible = true;
		}
	}

	hideTooltip() {
		// Hide after 150ms delay (behavior 3)
		// NOTE: This is NOT blocked during scroll - existing popup should close when mouse leaves
		this.clearTimeouts();
		this.hideTimeout = setTimeout(() => {
			if (this.tooltip) {
				this.tooltip.classList.remove("opacity-100");
				this.tooltip.classList.add("opacity-0");
				this.isTooltipVisible = false;
			}
		}, 150);
	}

	updateTooltipPosition(event) {
		if (!this.tooltip) return;

		const mapRect = this.mapElement.getBoundingClientRect();
		const x = event.clientX - mapRect.left;
		const y = event.clientY - mapRect.top;

		// Position tooltip relative to the map container
		this.tooltip.style.left = `${x}px`;
		this.tooltip.style.top = `${y}px`;
	}

	scrollToPlace(event) {
		const placeId = event.target.dataset.placeId;
		if (!placeId) return;

		// Emit custom event for place selection
		const placeSelectedEvent = new CustomEvent("place-map-clicked", {
			detail: { placeId },
			bubbles: true,
		});
		this.dispatchEvent(placeSelectedEvent);

		// Find the corresponding place container in the list
		const placeContainer = document.querySelector(`place-accordion[data-place-id="${placeId}"]`);
		if (placeContainer) {
			// Smooth scroll to the place container
			placeContainer.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "nearest",
			});

			// Optional: Add a brief highlight effect
			placeContainer.style.transition = "background-color 0.3s ease";
			placeContainer.style.backgroundColor = "rgb(248 250 252)";
			setTimeout(() => {
				placeContainer.style.backgroundColor = "";
			}, 1000);
		}
	}

	setupHeadingHoverListener() {
		// Listen for heading hover events from place accordions
		document.addEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent);
	}

	clearTimeouts() {
		if (this.showTimeout) {
			clearTimeout(this.showTimeout);
			this.showTimeout = null;
		}
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
		if (this.scrollBlockTimeout) {
			clearTimeout(this.scrollBlockTimeout);
			this.scrollBlockTimeout = null;
		}
	}

	checkMousePositionAfterScroll() {
		// Check if mouse is currently over a place title
		if (this.currentHoveredPlaceId) {
			// Simulate a heading hover event to show the tooltip
			const showEvent = new CustomEvent("place-heading-hover", {
				detail: { placeId: this.currentHoveredPlaceId, action: "show" },
				bubbles: true,
			});
			document.dispatchEvent(showEvent);
		}
	}

	checkExistingPopupAfterScroll() {
		// Check if mouse is still over the tile that had the popup before scroll
		if (this.currentHoveredPlaceId !== this.placeIdBeforeScroll) {
			// Mouse is no longer over the original tile - hide the popup
			if (this.tooltip && this.isTooltipVisible) {
				this.tooltip.classList.remove("opacity-100");
				this.tooltip.classList.add("opacity-0");
				this.isTooltipVisible = false;
			}
		}
		// If mouse is still over the same tile, keep the popup open
	}

	isScrollBlocked() {
		// Block NEW popups during and 300ms after scrolling (behavior 4)
		const isInScrollPeriod = Date.now() - this.lastScrollTime < 300;
		return isInScrollPeriod;
	}

	isNewPopupBlocked(placeId) {
		// Block new popups, but allow existing popup to stay
		const isInScrollPeriod = Date.now() - this.lastScrollTime < 300;
		if (!isInScrollPeriod) return false;

		// Allow if this is the same popup that was visible before scroll
		return placeId !== this.placeIdBeforeScroll;
	}

	handleHeadingHoverEvent(event) {
		const { placeId, action } = event.detail;
		const mapPoint = this.mapPoints.get(placeId);

		if (!mapPoint) return;

		if (action === "show") {
			// Track the currently hovered place ID
			this.currentHoveredPlaceId = placeId;

			// Give the circle a more visible highlight by enlarging it and adding border
			const currentRadius = mapPoint.getAttribute("r");
			mapPoint.setAttribute("data-original-radius", currentRadius);
			mapPoint.setAttribute("r", (parseFloat(currentRadius) * 1.7).toString());
			mapPoint.setAttribute("filter", "none");
			// Make sure it's darker red with darker red border for highlighted points
			mapPoint.setAttribute("fill", "#dc2626");
			mapPoint.setAttribute("stroke", "#b91c1c");
			mapPoint.setAttribute("stroke-width", "0.24");
			mapPoint.setAttribute("opacity", "1");
			// Move to end of SVG to appear on top when highlighted
			if (mapPoint.parentNode) {
				mapPoint.parentNode.appendChild(mapPoint);
			}

			// No tooltip when hovering over place titles - only visual feedback
		} else if (action === "hide") {
			// Clear the currently hovered place ID
			this.currentHoveredPlaceId = "";

			// Remove highlight - restore original circle size, shadow, and stroke
			const originalRadius = mapPoint.getAttribute("data-original-radius");
			if (originalRadius) {
				mapPoint.setAttribute("r", originalRadius);
				mapPoint.removeAttribute("data-original-radius");
				// Restore original shadow and stroke based on circle state
				const fill = mapPoint.getAttribute("fill");
				if (fill === "white") {
					// White inactive points: shadow but no stroke
					mapPoint.setAttribute("filter", "drop-shadow(0 0.05 0.08 rgba(0,0,0,0.15))");
					mapPoint.setAttribute("stroke", "none");
				} else {
					// Red active points: small shadow and wider border with darker red
					mapPoint.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))");
					mapPoint.setAttribute("fill", "#dc2626");
					mapPoint.setAttribute("stroke", "#b91c1c");
					mapPoint.setAttribute("stroke-width", "0.12");
				}
			}
		}
	}

	disconnectedCallback() {
		// Clean up intersection observer
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
			this.intersectionObserver = null;
		}

		// Clean up new tooltip timeouts
		this.clearTimeouts();

		// Clean up heading hover listener
		document.removeEventListener("place-heading-hover", this.boundHandleHeadingHoverEvent);

		// Clean up scroll listeners
		window.removeEventListener("scroll", this.boundHandleScroll);
		document.removeEventListener("scroll", this.boundHandleScroll);
	}
}

/**
 * Places Map Single Web Component
 * Embeds an SVG map with a single highlighted place
 */
export class PlacesMapSingle extends HTMLElement {
	constructor() {
		super();
		this.place = null;
		this.mapElement = null;
		this.pointsContainer = null;
		this.tooltip = null;
	}

	connectedCallback() {
		this.parseData();
		this.render();
		this.initializeMap();
	}

	parseData() {
		try {
			const placeData = this.dataset.place;
			if (placeData) {
				this.place = JSON.parse(placeData);
			}
		} catch (error) {
			console.error("Failed to parse place data:", error);
			this.place = null;
		}
	}

	render() {
		this.innerHTML = `
			<div class="map-container relative w-full aspect-[5/7] overflow-hidden bg-slate-100">
				<div class="transform-wrapper absolute top-0 left-0 w-full h-auto origin-top-left">
					<img src="/assets/Europe.svg" alt="Map of Europe" class="block w-full h-auto">
					<div class="points-container absolute top-0 left-0 w-full h-full"></div>
				</div>
				<div class="absolute bottom-0 right-0 h-auto text-[0.6rem] bg-white px-0.5 bg-opacity-[0.5] border">
					<i class="ri-creative-commons-line"></i>
					<a href="https://commons.wikimedia.org/wiki/File:Europe_laea_topography.svg" target="_blank" class="">
						 Wikimedia Commons
					</a>
				</div>
				<!-- Tooltip -->
				<div class="map-tooltip absolute bg-slate-800 text-white text-sm px-2 py-1 rounded shadow-lg pointer-events-none opacity-0 transition-opacity duration-200 z-30 whitespace-nowrap" style="transform: translate(-50%, -100%); margin-top: -8px;"></div>
			</div>
		`;

		this.mapElement = this.querySelector(".map-container");
		this.pointsContainer = this.querySelector(".points-container");
		this.tooltip = this.querySelector(".map-tooltip");
	}

	initializeMap() {
		if (!this.place || !this.place.lat || !this.place.lng || !this.pointsContainer) {
			return;
		}

		// Map extent constants
		const MAP_EXTENT_METERS = { xmin: 2555000, ymin: 1350000, xmax: 7405000, ymax: 5500000 };
		const PROJECTION_CENTER = { lon: 10, lat: 52 };

		// Convert lat/lng to % calculation
		const convertLatLngToPercent = (lat, lng) => {
			const R = 6371000;
			const FE = 4321000;
			const FN = 3210000;
			const lon_0_rad = (PROJECTION_CENTER.lon * Math.PI) / 180;
			const lat_0_rad = (PROJECTION_CENTER.lat * Math.PI) / 180;
			const lon_rad = (lng * Math.PI) / 180;
			const lat_rad = (lat * Math.PI) / 180;
			const k_prime = Math.sqrt(
				2 /
					(1 +
						Math.sin(lat_0_rad) * Math.sin(lat_rad) +
						Math.cos(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad)),
			);
			const x_proj = R * k_prime * Math.cos(lat_rad) * Math.sin(lon_rad - lon_0_rad);
			const y_proj =
				R *
				k_prime *
				(Math.cos(lat_0_rad) * Math.sin(lat_rad) -
					Math.sin(lat_0_rad) * Math.cos(lat_rad) * Math.cos(lon_rad - lon_0_rad));
			const finalX = x_proj + FE;
			const finalY = y_proj + FN;
			const mapWidthMeters = MAP_EXTENT_METERS.xmax - MAP_EXTENT_METERS.xmin;
			const mapHeightMeters = MAP_EXTENT_METERS.ymax - MAP_EXTENT_METERS.ymin;
			const xPercent = ((finalX - MAP_EXTENT_METERS.xmin) / mapWidthMeters) * 100;
			const yPercent = ((MAP_EXTENT_METERS.ymax - finalY) / mapHeightMeters) * 100;
			return { x: xPercent, y: yPercent };
		};

		const lat = parseFloat(this.place.lat);
		const lng = parseFloat(this.place.lng);
		const position = convertLatLngToPercent(lat, lng);

		// Only add point if it's within the visible map area
		if (position.x >= 0 && position.x <= 100 && position.y >= 0 && position.y <= 100) {
			// Create one large SVG overlay that matches the map size
			const mapOverlaySvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			mapOverlaySvg.setAttribute("class", "absolute top-0 left-0 w-full h-full");
			mapOverlaySvg.style.pointerEvents = "none";
			mapOverlaySvg.style.overflow = "visible";
			mapOverlaySvg.setAttribute("viewBox", "0 0 100 100");
			mapOverlaySvg.setAttribute("preserveAspectRatio", "none");

			// Create defs element for gradients
			const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

			// Create radial gradient for red dots
			const redGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
			redGradient.setAttribute("id", "redDotGradientSingle");
			redGradient.setAttribute("cx", "30%");
			redGradient.setAttribute("cy", "30%");
			redGradient.setAttribute("r", "70%");

			const stopLight = document.createElementNS("http://www.w3.org/2000/svg", "stop");
			stopLight.setAttribute("offset", "0%");
			stopLight.setAttribute("stop-color", "#f56565"); // Slightly lighter red

			const stopDark = document.createElementNS("http://www.w3.org/2000/svg", "stop");
			stopDark.setAttribute("offset", "100%");
			stopDark.setAttribute("stop-color", "#e53e3e"); // Slightly darker red

			redGradient.appendChild(stopLight);
			redGradient.appendChild(stopDark);
			defs.appendChild(redGradient);
			mapOverlaySvg.appendChild(defs);

			this.pointsContainer.appendChild(mapOverlaySvg);

			// Create circle element directly in the overlay SVG
			const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			circle.setAttribute("cx", position.x.toString());
			circle.setAttribute("cy", position.y.toString());
			circle.setAttribute("r", "0.8"); // Larger radius for single place view
			circle.setAttribute("fill", "#dc2626");
			circle.setAttribute("stroke", "#b91c1c");
			circle.setAttribute("stroke-width", "0.05");
			circle.setAttribute("filter", "drop-shadow(0 0.05 0.1 rgba(0,0,0,0.2))"); // Small shadow for red single place dot
			circle.style.cursor = "pointer";
			circle.style.pointerEvents = "all";
			circle.style.transition = "r 0.3s ease, fill 0.3s ease, stroke 0.3s ease, opacity 0.3s ease";

			const tooltipText = `${this.place.name}${this.place.toponymName && this.place.toponymName !== this.place.name ? ` (${this.place.toponymName})` : ""}`;
			circle.dataset.tooltipText = tooltipText;

			// Add hover event listeners
			circle.addEventListener("mouseenter", (e) => this.showTooltip(e));
			circle.addEventListener("mouseleave", () => this.hideTooltip());
			circle.addEventListener("mousemove", (e) => this.updateTooltipPosition(e));

			mapOverlaySvg.appendChild(circle);

			// Auto-zoom to the single point with some padding
			this.autoZoomToPoint(position);
		}
	}

	autoZoomToPoint(position) {
		// Create a balanced area around the point for zooming
		const PADDING = 20; // 20% padding around the point
		let minX = Math.max(0, position.x - PADDING);
		let maxX = Math.min(100, position.x + PADDING);
		let minY = Math.max(0, position.y - PADDING);
		let maxY = Math.min(100, position.y + PADDING);

		let width = maxX - minX;
		let height = maxY - minY;

		// Maintain 5:7 aspect ratio
		const ASPECT_RATIO = 5 / 7;
		const pointsAspectRatio = width / height;

		let finalViewBox = { x: minX, y: minY, width: width, height: height };

		if (pointsAspectRatio > ASPECT_RATIO) {
			const newTargetHeight = width / ASPECT_RATIO;
			finalViewBox.y = minY - (newTargetHeight - height) / 2;
			finalViewBox.height = newTargetHeight;
		} else {
			const newTargetWidth = height * ASPECT_RATIO;
			finalViewBox.x = minX - (newTargetWidth - width) / 2;
			finalViewBox.width = newTargetWidth;
		}

		// Ensure the final viewbox stays within map boundaries (0-100%)
		if (finalViewBox.x < 0) {
			finalViewBox.width += finalViewBox.x;
			finalViewBox.x = 0;
		}
		if (finalViewBox.y < 0) {
			finalViewBox.height += finalViewBox.y;
			finalViewBox.y = 0;
		}
		if (finalViewBox.x + finalViewBox.width > 100) {
			finalViewBox.width = 100 - finalViewBox.x;
		}
		if (finalViewBox.y + finalViewBox.height > 100) {
			finalViewBox.height = 100 - finalViewBox.y;
		}

		// Ensure minimum zoom level - don't zoom in too much if constrained by boundaries
		const MIN_VIEWPORT_SIZE = 30; // Minimum 30% of map should be visible
		if (finalViewBox.width < MIN_VIEWPORT_SIZE) {
			const expansion = (MIN_VIEWPORT_SIZE - finalViewBox.width) / 2;
			finalViewBox.x = Math.max(0, finalViewBox.x - expansion);
			finalViewBox.width = Math.min(MIN_VIEWPORT_SIZE, 100 - finalViewBox.x);
		}
		if (finalViewBox.height < MIN_VIEWPORT_SIZE) {
			const expansion = (MIN_VIEWPORT_SIZE - finalViewBox.height) / 2;
			finalViewBox.y = Math.max(0, finalViewBox.y - expansion);
			finalViewBox.height = Math.min(MIN_VIEWPORT_SIZE, 100 - finalViewBox.y);
		}

		// Apply transformation
		const scale = 100 / finalViewBox.width;
		const translateX = -finalViewBox.x;
		const translateY = -finalViewBox.y;

		const transformValue = `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
		const transformWrapper = this.querySelector(".transform-wrapper");
		if (transformWrapper) {
			transformWrapper.style.transform = transformValue;
		}
	}

	showTooltip(event) {
		const point = event.target;
		const tooltipText = point.dataset.tooltipText;

		if (this.tooltip && tooltipText) {
			this.tooltip.textContent = tooltipText;
			this.updateTooltipPosition(event);
			this.tooltip.classList.remove("opacity-0");
			this.tooltip.classList.add("opacity-100");
		}
	}

	hideTooltip() {
		if (this.tooltip) {
			this.tooltip.classList.remove("opacity-100");
			this.tooltip.classList.add("opacity-0");
		}
	}

	updateTooltipPosition(event) {
		if (!this.tooltip) return;

		const mapRect = this.mapElement.getBoundingClientRect();
		const x = event.clientX - mapRect.left;
		const y = event.clientY - mapRect.top;

		this.tooltip.style.left = `${x}px`;
		this.tooltip.style.top = `${y}px`;
	}
}

// Register the custom elements
customElements.define("places-filter", PlacesFilter);
customElements.define("place-accordion", PlaceAccordion);
customElements.define("places-map", PlacesMap);
customElements.define("places-map-single", PlacesMapSingle);
