package viewmodels

import (
	"slices"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

// CategoriesListView represents the data for the categories overview page
type CategoriesListView struct {
	Categories map[string]CategoryWithPieceCount
	Sorted     []string
}

// CategoryDetailView represents a specific category with its available years
type CategoryDetailView struct {
	Category         xmlmodels.Category
	CategoryReadable map[string]interface{}
	AvailableYears   []YearWithPieceCount
	PieceCount       int
}

// CategoryPiecesView represents pieces filtered by category and year
type CategoryPiecesView struct {
	Category         xmlmodels.Category
	CategoryReadable map[string]interface{}
	Year             int
	Pieces           []xmlmodels.Piece
	PieceCount       int
	AvailableYears   []YearWithPieceCount
}

// CategoryWithPieceCount represents a category with total piece count and available years
type CategoryWithPieceCount struct {
	Category       xmlmodels.Category
	Readable       map[string]interface{}
	PieceCount     int
	AvailableYears []YearWithPieceCount
}

// YearWithPieceCount represents a year with piece count for a specific category
type YearWithPieceCount struct {
	Year       int
	PieceCount int
}

// CategoriesView returns categories data for the overview page
func CategoriesView(lib *xmlmodels.Library) *CategoriesListView {
	res := CategoriesListView{Categories: make(map[string]CategoryWithPieceCount)}

	// Count pieces per category and year
	categoryPieceCounts := make(map[string]int)
	categoryYearCounts := make(map[string]map[int]int) // categoryID -> year -> count

	for _, piece := range lib.Pieces.Array {
		// Get years for this piece
		pieceYears := make(map[int]bool)
		for _, issueRef := range piece.IssueRefs {
			if issueRef.When.Year > 0 {
				pieceYears[issueRef.When.Year] = true
			}
		}

		// Process CategoryRefs
		for _, catRef := range piece.CategoryRefs {
			if catRef.Ref != "" {
				categoryPieceCounts[catRef.Ref]++
				if categoryYearCounts[catRef.Ref] == nil {
					categoryYearCounts[catRef.Ref] = make(map[int]int)
				}
				for year := range pieceYears {
					categoryYearCounts[catRef.Ref][year]++
				}
			}
		}

		// Process WorkRefs with categories
		for _, workRef := range piece.WorkRefs {
			categoryID := workRef.Category
			if categoryID == "" {
				categoryID = "rezension" // Default category for WorkRefs
			}
			categoryPieceCounts[categoryID]++
			if categoryYearCounts[categoryID] == nil {
				categoryYearCounts[categoryID] = make(map[int]int)
			}
			for year := range pieceYears {
				categoryYearCounts[categoryID][year]++
			}
		}
	}

	// Build categories list with piece counts and available years
	for _, category := range lib.Categories.Array {
		if categoryPieceCounts[category.ID] > 0 {
			// Merge readable and readable HTML data
			readable := category.Readable(lib)
			readableHTML := category.ReadableHTML()
			for k, v := range readableHTML {
				readable[k] = v
			}

			// Build available years list for this category
			var availableYears []YearWithPieceCount
			if yearCounts, exists := categoryYearCounts[category.ID]; exists {
				years := make([]int, 0, len(yearCounts))
				for year := range yearCounts {
					years = append(years, year)
				}
				slices.Sort(years)

				for _, year := range years {
					availableYears = append(availableYears, YearWithPieceCount{
						Year:       year,
						PieceCount: yearCounts[year],
					})
				}
			}

			res.Categories[category.ID] = CategoryWithPieceCount{
				Category:       category,
				Readable:       readable,
				PieceCount:     categoryPieceCounts[category.ID],
				AvailableYears: availableYears,
			}
			res.Sorted = append(res.Sorted, category.ID)
		}
	}

	// Sort by category ID
	slices.Sort(res.Sorted)

	return &res
}

// CategoryDetailView returns category data with available years
func CategoryView(categoryID string, lib *xmlmodels.Library) *CategoryDetailView {
	// Get the category
	category := lib.Categories.Item(categoryID)
	if category == nil {
		return nil
	}

	// Count pieces per year for this category
	yearPieceCounts := make(map[int]int)
	totalPieces := 0

	for _, piece := range lib.Pieces.Array {
		matchesCategory := false

		// Check direct CategoryRefs
		for _, catRef := range piece.CategoryRefs {
			if catRef.Ref == categoryID {
				matchesCategory = true
				break
			}
		}

		// Check WorkRefs with categories if not found in direct refs
		if !matchesCategory {
			for _, workRef := range piece.WorkRefs {
				if workRef.Category == categoryID || (workRef.Category == "" && categoryID == "rezension") {
					matchesCategory = true
					break
				}
			}
		}

		if matchesCategory {
			totalPieces++
			// Extract years from IssueRefs
			for _, issueRef := range piece.IssueRefs {
				year := issueRef.When.Year
				if year > 0 {
					yearPieceCounts[year]++
				}
			}
		}
	}

	// Build available years list
	var availableYears []YearWithPieceCount
	years := make([]int, 0, len(yearPieceCounts))
	for year := range yearPieceCounts {
		years = append(years, year)
	}
	slices.Sort(years)

	for _, year := range years {
		availableYears = append(availableYears, YearWithPieceCount{
			Year:       year,
			PieceCount: yearPieceCounts[year],
		})
	}

	// Merge readable and readable HTML data
	readable := category.Readable(lib)
	readableHTML := category.ReadableHTML()
	for k, v := range readableHTML {
		readable[k] = v
	}

	return &CategoryDetailView{
		Category:         *category,
		CategoryReadable: readable,
		AvailableYears:   availableYears,
		PieceCount:       totalPieces,
	}
}

// NewCategoryPiecesView returns pieces filtered by category and year
func NewCategoryPiecesView(categoryID string, year int, lib *xmlmodels.Library) *CategoryPiecesView {
	// Get the category
	category := lib.Categories.Item(categoryID)
	if category == nil {
		return nil
	}

	var pieces []xmlmodels.Piece
	yearPieceCounts := make(map[int]int)

	for _, piece := range lib.Pieces.Array {
		matchesCategory := false

		// Check direct CategoryRefs
		for _, catRef := range piece.CategoryRefs {
			if catRef.Ref == categoryID {
				matchesCategory = true
				break
			}
		}

		// Check WorkRefs with categories if not found in direct refs
		if !matchesCategory {
			for _, workRef := range piece.WorkRefs {
				if workRef.Category == categoryID || (workRef.Category == "" && categoryID == "rezension") {
					matchesCategory = true
					break
				}
			}
		}

		if matchesCategory {
			// Count all years for this category (for navigation)
			for _, issueRef := range piece.IssueRefs {
				if issueRef.When.Year > 0 {
					yearPieceCounts[issueRef.When.Year]++
				}
			}

			// Check if piece appears in the specified year
			for _, issueRef := range piece.IssueRefs {
				if issueRef.When.Year == year {
					pieces = append(pieces, piece)
					break
				}
			}
		}
	}

	// Build available years list
	var availableYears []YearWithPieceCount
	years := make([]int, 0, len(yearPieceCounts))
	for yearVal := range yearPieceCounts {
		years = append(years, yearVal)
	}
	slices.Sort(years)

	for _, yearVal := range years {
		availableYears = append(availableYears, YearWithPieceCount{
			Year:       yearVal,
			PieceCount: yearPieceCounts[yearVal],
		})
	}

	// Merge readable and readable HTML data
	readable := category.Readable(lib)
	readableHTML := category.ReadableHTML()
	for k, v := range readableHTML {
		readable[k] = v
	}

	return &CategoryPiecesView{
		Category:         *category,
		CategoryReadable: readable,
		Year:             year,
		Pieces:           pieces,
		PieceCount:       len(pieces),
		AvailableYears:   availableYears,
	}
}