package viewmodels

import (
	"fmt"
	"sort"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type PiecePageEntry struct {
	PageNumber     int
	IssueYear      int
	IssueNumber    int
	ImagePath      string
	IsContinuation bool
	IssueContext   string // "1764 Nr. 37" for display
	Available      bool
	OtherPieces    []IndividualPieceByIssue // Other pieces on the same page
}

type PieceImages struct {
	AllPages  []IssuePage // Sequential list of all pages across issues
	HasImages bool
}

type PieceVM struct {
	xmlmodels.Piece
	AllIssueRefs        []xmlmodels.IssueRef       // All issues containing this piece
	AllPages            []PiecePageEntry           // Flattened chronological page list
	ContinuousPages     IndividualPiecesByPage     // For template compatibility
	Images              PieceImages                // All page images across issues
	TotalPageCount      int
	Title               string // Extracted piece title
	MainCategory        string // Primary category
	IssueContexts       []string // List of issue contexts for display
}

func NewPieceView(piece xmlmodels.Piece, lib *xmlmodels.Library) (*PieceVM, error) {
	pvm := &PieceVM{
		Piece:         piece,
		AllIssueRefs:  piece.IssueRefs,
		AllPages:      []PiecePageEntry{},
		IssueContexts: []string{},
	}

	// Extract title from piece
	if len(piece.Title) > 0 {
		pvm.Title = piece.Title[0]
	}

	// Extract main category
	if len(piece.CategoryRefs) > 0 {
		pvm.MainCategory = piece.CategoryRefs[0].Ref
	}

	// Sort issue refs chronologically
	sort.Slice(pvm.AllIssueRefs, func(i, j int) bool {
		refA := pvm.AllIssueRefs[i]
		refB := pvm.AllIssueRefs[j]

		if refA.When.Year != refB.When.Year {
			return refA.When.Year < refB.When.Year
		}
		return refA.Nr < refB.Nr
	})

	// Process each issue reference
	for partIndex, issueRef := range pvm.AllIssueRefs {
		issueContext := fmt.Sprintf("%d Nr. %d", issueRef.When.Year, issueRef.Nr)
		pvm.IssueContexts = append(pvm.IssueContexts, issueContext)

		// Add pages for this issue reference
		for pageNum := issueRef.Von; pageNum <= issueRef.Bis; pageNum++ {
			pageEntry := PiecePageEntry{
				PageNumber:     pageNum,
				IssueYear:      issueRef.When.Year,
				IssueNumber:    issueRef.Nr,
				IsContinuation: pageNum > issueRef.Von || partIndex > 0,
				IssueContext:   issueContext,
				Available:      true, // Will be updated when we load images
				OtherPieces:    []IndividualPieceByIssue{}, // Will be populated later
			}

			// Get actual image path from registry
			pageEntry.ImagePath = getImagePathFromRegistry(issueRef.When.Year, pageNum)

			pvm.AllPages = append(pvm.AllPages, pageEntry)
		}
	}

	pvm.TotalPageCount = len(pvm.AllPages)

	// Load images and update availability
	if err := pvm.loadImages(); err != nil {
		return nil, fmt.Errorf("failed to load images: %w", err)
	}

	// Create template-compatible structure
	if err := pvm.createContinuousPages(lib); err != nil {
		return nil, fmt.Errorf("failed to create continuous pages: %w", err)
	}

	// Populate other pieces on each page
	if err := pvm.populateOtherPieces(lib); err != nil {
		return nil, fmt.Errorf("failed to populate other pieces: %w", err)
	}

	return pvm, nil
}

// loadImages loads and validates all page images for the piece
func (pvm *PieceVM) loadImages() error {
	// Initialize image registry if needed
	if err := initImageRegistry(); err != nil {
		return err
	}

	issuePages := []IssuePage{}
	hasAnyImages := false

	for i, pageEntry := range pvm.AllPages {
		// Create IssuePage for template compatibility
		issuePage := IssuePage{
			PageNumber: pageEntry.PageNumber,
			ImagePath:  pageEntry.ImagePath,
			Available:  true, // Assume available for now
			PageIcon:   "single", // Simplified icon for piece view
		}

		// Check if image actually exists using the registry
		key := fmt.Sprintf("%d-%d", pageEntry.IssueYear, pageEntry.PageNumber)
		if imageRegistry != nil {
			if _, exists := imageRegistry.ByYearPage[key]; exists {
				hasAnyImages = true
			} else {
				issuePage.Available = false
				pvm.AllPages[i].Available = false
			}
		}

		issuePages = append(issuePages, issuePage)
	}

	pvm.Images = PieceImages{
		AllPages:  issuePages,
		HasImages: hasAnyImages,
	}

	return nil
}

// createContinuousPages creates the template-compatible IndividualPiecesByPage structure
func (pvm *PieceVM) createContinuousPages(lib *xmlmodels.Library) error {
	individual := IndividualPiecesByPage{
		Items: make(map[int][]IndividualPieceByIssue),
		Pages: []int{},
	}

	// Create a virtual piece entry for each page
	for _, pageEntry := range pvm.AllPages {
		// Create IssueRef for this specific page
		issueRef := xmlmodels.IssueRef{
			Nr:  pageEntry.IssueNumber,
			Von: pageEntry.PageNumber,
			Bis: pageEntry.PageNumber,
		}
		issueRef.When.Year = pageEntry.IssueYear

		// Create PieceByIssue
		pieceByIssue := PieceByIssue{
			Piece:          pvm.Piece,
			Reference:      issueRef,
			IsContinuation: pageEntry.IsContinuation,
		}

		// Create IndividualPieceByIssue
		individualPiece := IndividualPieceByIssue{
			PieceByIssue: pieceByIssue,
			IssueRefs:    pvm.AllIssueRefs,
			PageIcon:     "single", // Simplified icon for piece view
		}

		// Add to the page map
		if individual.Items[pageEntry.PageNumber] == nil {
			individual.Items[pageEntry.PageNumber] = []IndividualPieceByIssue{}
			individual.Pages = append(individual.Pages, pageEntry.PageNumber)
		}
		individual.Items[pageEntry.PageNumber] = append(individual.Items[pageEntry.PageNumber], individualPiece)
	}

	// Sort pages
	sort.Ints(individual.Pages)

	pvm.ContinuousPages = individual
	return nil
}

// getImagePathFromRegistry gets the actual image path from the image registry
func getImagePathFromRegistry(year, page int) string {
	// Initialize registry if needed
	if err := initImageRegistry(); err != nil {
		return ""
	}

	// Look up the image by year and page
	key := fmt.Sprintf("%d-%d", year, page)
	if imageFile, exists := imageRegistry.ByYearPage[key]; exists {
		return imageFile.Path
	}

	// Fallback: generate a default path (though this probably won't exist)
	return fmt.Sprintf("/static/pictures/%d/seite_%d.jpg", year, page)
}

// populateOtherPieces finds and populates other pieces that appear on the same pages as this piece
func (pvm *PieceVM) populateOtherPieces(lib *xmlmodels.Library) error {
	fmt.Printf("DEBUG: Starting populateOtherPieces for piece %s\n", pvm.Piece.ID)
	for i, pageEntry := range pvm.AllPages {
		fmt.Printf("DEBUG: Processing page %d from issue %d/%d\n", pageEntry.PageNumber, pageEntry.IssueYear, pageEntry.IssueNumber)

		// Find the issue this page belongs to
		var issue *xmlmodels.Issue
		lib.Issues.Lock()
		for _, iss := range lib.Issues.Array {
			if iss.Datum.When.Year == pageEntry.IssueYear && iss.Number.No == pageEntry.IssueNumber {
				issue = &iss
				break
			}
		}
		lib.Issues.Unlock()

		if issue == nil {
			fmt.Printf("DEBUG: Issue not found for %d/%d\n", pageEntry.IssueYear, pageEntry.IssueNumber)
			continue
		}

		// Get all pieces for this issue using the same approach as the ausgabe view
		piecesForIssue, _, err := PiecesForIsssue(lib, *issue)
		if err != nil {
			fmt.Printf("DEBUG: Error getting pieces for issue: %v\n", err)
			continue
		}

		// Create IndividualPiecesByPage using the same function as ausgabe view
		individualPieces := CreateIndividualPagesWithMetadata(piecesForIssue, lib)

		// Get pieces that appear on this specific page
		if individualPiecesOnPage, exists := individualPieces.Items[pageEntry.PageNumber]; exists {
			fmt.Printf("DEBUG: Found %d pieces on page %d\n", len(individualPiecesOnPage), pageEntry.PageNumber)
			otherPieces := []IndividualPieceByIssue{}

			for _, individualPiece := range individualPiecesOnPage {
				fmt.Printf("DEBUG: Checking piece %s (current: %s)\n", individualPiece.PieceByIssue.Piece.ID, pvm.Piece.ID)
				// Skip the current piece itself
				if individualPiece.PieceByIssue.Piece.ID == pvm.Piece.ID {
					fmt.Printf("DEBUG: Skipping current piece\n")
					continue
				}

				fmt.Printf("DEBUG: Adding other piece %s\n", individualPiece.PieceByIssue.Piece.ID)
				otherPieces = append(otherPieces, individualPiece)
			}

			fmt.Printf("DEBUG: Found %d other pieces on page %d\n", len(otherPieces), pageEntry.PageNumber)
			pvm.AllPages[i].OtherPieces = otherPieces
		} else {
			fmt.Printf("DEBUG: No pieces found on page %d\n", pageEntry.PageNumber)
		}
	}

	return nil
}