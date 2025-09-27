package viewmodels

import (
	"maps"
	"slices"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

// PlacesListView represents the data for the places overview
type PlacesListView struct {
	Search           string
	AvailableLetters []string
	Places           map[string]xmlmodels.Place
	Sorted           []string
	SelectedPlace    *PlaceDetailView
	TotalPiecesWithPlaces int
}

// PlaceDetailView represents a specific place with its associated pieces
type PlaceDetailView struct {
	Place  xmlmodels.Place
	Pieces []xmlmodels.Piece
}

// PlacesView returns places data for the overview page
func PlacesView(placeID string, lib *xmlmodels.Library) *PlacesListView {
	res := PlacesListView{Search: placeID, Places: make(map[string]xmlmodels.Place)}
	av := make(map[string]bool)

	// Get all places that are referenced in pieces and count total pieces with places
	referencedPlaces := make(map[string]bool)
	totalPiecesWithPlaces := 0

	for _, piece := range lib.Pieces.Array {
		hasPlace := false
		for _, placeRef := range piece.PlaceRefs {
			referencedPlaces[placeRef.Ref] = true
			hasPlace = true
		}
		if hasPlace {
			totalPiecesWithPlaces++
		}
	}

	// Build available letters and places list
	for _, place := range lib.Places.Array {
		// Only include places that are actually referenced in pieces
		if referencedPlaces[place.ID] {
			av[strings.ToUpper(place.ID[:1])] = true
			res.Sorted = append(res.Sorted, place.ID)
			res.Places[place.ID] = place
		}
	}

	// If a specific place is requested, get its details
	if placeID != "" && len(placeID) > 1 {
		if place, exists := res.Places[placeID]; exists {
			res.SelectedPlace = GetPlaceDetail(place, lib)
		}
	}

	res.AvailableLetters = slices.Collect(maps.Keys(av))
	slices.Sort(res.AvailableLetters)
	slices.Sort(res.Sorted)
	res.TotalPiecesWithPlaces = totalPiecesWithPlaces

	return &res
}

// GetPlaceDetail returns detailed information for a specific place including associated pieces
func GetPlaceDetail(place xmlmodels.Place, lib *xmlmodels.Library) *PlaceDetailView {
	detail := &PlaceDetailView{
		Place:  place,
		Pieces: make([]xmlmodels.Piece, 0),
	}

	// Find all pieces that reference this place
	for _, piece := range lib.Pieces.Array {
		for _, placeRef := range piece.PlaceRefs {
			if placeRef.Ref == place.ID {
				detail.Pieces = append(detail.Pieces, piece)
				break // Don't add the same piece multiple times
			}
		}
	}

	// Sort pieces by title for consistent display
	slices.SortFunc(detail.Pieces, func(a, b xmlmodels.Piece) int {
		// Get first title from each piece, or use empty string if no titles
		titleA := ""
		if len(a.Title) > 0 {
			titleA = a.Title[0]
		}
		titleB := ""
		if len(b.Title) > 0 {
			titleB = b.Title[0]
		}
		return strings.Compare(strings.ToLower(titleA), strings.ToLower(titleB))
	})

	return detail
}