# Orte Components Documentation

## Overview
The Orte (Places) section has been updated to use an expandable list view instead of a card grid. This provides better usability on mobile devices and allows for lazy-loading of place details.

## Architecture

### Templates
- `_place_expandable.gohtml` - Template for individual expandable place entries (currently unused, kept for reference)
- `_place_details_fragment.gohtml` - HTMX fragment for place details (header + pieces list)

### JavaScript Components
- `ExpandablePlacesList` - Main web component for the expandable places list
- No shadow DOM - full Tailwind CSS support
- Property-based data passing
- HTMX integration for lazy-loading details

### Backend
- `GetPlaceDetails()` - New controller handler for HTMX requests
- Route: `/ort/{place}/details`
- Returns place details fragment

## Features

### Expandable Interaction
- Click to expand/collapse place entries
- Only one place can be expanded at a time
- Smooth CSS transitions for expand/collapse
- Keyboard navigation support (Enter/Space)

### Data Loading
- Initial places list loaded from server-side template
- Place details loaded on-demand via HTMX
- Loading states and error handling
- Caching of loaded content

### Accessibility
- Proper ARIA attributes (`aria-expanded`, `aria-hidden`, `aria-controls`)
- Keyboard navigation support
- Screen reader friendly labels
- Focus management

### Preserved Functionality
- `/ort/{id}` permalink URLs still work for direct access
- Search filtering via existing `GenericFilter` component
- External links (Wikipedia, Geonames, OpenStreetMap) in expanded view
- Citation links to specific newspaper issues

## Usage

The component is automatically initialized on page load with data from the Go template:

```html
<expandable-places-list id="places-list"></expandable-places-list>
<script>
  const placesList = document.getElementById('places-list');
  placesList.places = placesData; // Array of place objects
</script>
```

## Data Structure

Each place object contains:
- `ID`: Place identifier
- `Names`: Array of place names
- `Geo`: Geonames URL (optional)
- `PieceCount`: Number of associated pieces

## Technical Notes

- Uses CSS `max-height` transitions for smooth expand/collapse
- HTMX events handled for loading states
- Event delegation for dynamically created content
- Compatible with existing search filtering system