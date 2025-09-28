package viewmodels

import (
	"encoding/json"
	"maps"
	"slices"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/geonames"
)

// PlacesListView represents the data for the places overview
type PlacesListView struct {
	Search           string
	AvailableLetters []string
	Places           map[string]xmlmodels.Place
	PlacePieceCounts map[string]int
	Sorted           []string
	SelectedPlace    *PlaceDetailView
	TotalPiecesWithPlaces int
	PlacesJSON       string
}

// MapPlace represents a place for the map component
type MapPlace struct {
	ID           string `json:"id"`
	Name         string `json:"name"`
	ToponymName  string `json:"toponymName"`
	Lat          string `json:"lat"`
	Lng          string `json:"lng"`
}

// PlaceDetailView represents a specific place with its associated pieces
type PlaceDetailView struct {
	Place  xmlmodels.Place
	Pieces []xmlmodels.Piece
}

// PlacesView returns places data for the overview page
func PlacesView(placeID string, lib *xmlmodels.Library, geonamesProvider *geonames.GeonamesProvider) *PlacesListView {
	res := PlacesListView{
		Search: placeID,
		Places: make(map[string]xmlmodels.Place),
		PlacePieceCounts: make(map[string]int),
	}
	av := make(map[string]bool)

	// Get all places that are referenced in pieces and count total pieces with places
	referencedPlaces := make(map[string]bool)
	placePieceCounts := make(map[string]int)
	totalPiecesWithPlaces := 0

	for _, piece := range lib.Pieces.Array {
		hasPlace := false
		for _, placeRef := range piece.PlaceRefs {
			referencedPlaces[placeRef.Ref] = true
			placePieceCounts[placeRef.Ref]++
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

	// Set the piece counts
	res.PlacePieceCounts = placePieceCounts

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

	// Generate JSON data for map
	res.PlacesJSON = generatePlacesJSON(res.Places, geonamesProvider)

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

// generatePlacesJSON creates JSON data for the map component
func generatePlacesJSON(places map[string]xmlmodels.Place, geonamesProvider *geonames.GeonamesProvider) string {
	if geonamesProvider == nil {
		return "[]"
	}

	mapPlaces := make([]MapPlace, 0)

	for _, place := range places {
		if place.Geo == "" {
			continue
		}

		// Get geonames data
		geoPlace := geonamesProvider.Place(place.Geo)
		if geoPlace == nil || geoPlace.Lat == "" || geoPlace.Lng == "" {
			continue
		}

		// Get main place name
		mainName := place.ID
		if len(place.Names) > 0 {
			mainName = place.Names[0]
		}

		// Get modern place name (toponym)
		toponymName := ""
		for _, altName := range geoPlace.AlternateNames {
			if altName.Lang == "de" {
				toponymName = altName.Name
				break
			}
		}
		if toponymName == "" {
			toponymName = geoPlace.Name
		}

		mapPlace := MapPlace{
			ID:          place.ID,
			Name:        mainName,
			ToponymName: toponymName,
			Lat:         geoPlace.Lat,
			Lng:         geoPlace.Lng,
		}

		mapPlaces = append(mapPlaces, mapPlace)
	}

	// Sort by name for consistent output
	slices.SortFunc(mapPlaces, func(a, b MapPlace) int {
		return strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name))
	})

	jsonData, err := json.Marshal(mapPlaces)
	if err != nil {
		return "[]"
	}

	return string(jsonData)
}