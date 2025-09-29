package viewmodels

import (
	"fmt"
	"sort"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/pictures"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type PiecePageEntry struct {
	PageNumber     int
	IssueYear      int
	IssueNumber    int
	ImagePath      string // Full-quality image path (prefers WebP over JPEG)
	PreviewPath    string // Compressed WebP path for layout views
	JpegPath       string // JPEG path for download button
	IsContinuation bool
	IssueContext   string // "1764 Nr. 37" for display
	Available      bool
	OtherPieces    []IndividualPieceByIssue // Other pieces on the same page
	PartNumber     int                      // Which part of the piece (1, 2, 3, etc.)
}

type PieceImages struct {
	AllPages  []IssuePage // Sequential list of all pages across issues
	HasImages bool
}

type PieceVM struct {
	xmlmodels.Piece
	AllIssueRefs    []xmlmodels.IssueRef   // All issues containing this piece
	AllPages        []PiecePageEntry       // Flattened chronological page list
	ContinuousPages IndividualPiecesByPage // For template compatibility
	Images          PieceImages            // All page images across issues
	TotalPageCount  int
	Title           string   // Extracted piece title
	MainCategory    string   // Primary category
	IssueContexts   []string // List of issue contexts for display
}

func NewPieceView(piece xmlmodels.Piece, lib *xmlmodels.Library, pics *pictures.PicturesProvider) (*PieceVM, error) {
	pvm := &PieceVM{
		Piece:         piece,
		AllIssueRefs:  piece.IssueRefs,
		AllPages:      []PiecePageEntry{},
		IssueContexts: []string{},
	}

	// DEBUG: Log piece details
	logging.Debug(fmt.Sprintf("PieceView: Creating view for piece ID=%s", piece.Identifier.ID))
	logging.Debug(fmt.Sprintf("PieceView: Piece has %d IssueRefs", len(piece.IssueRefs)))
	for i, ref := range piece.IssueRefs {
		logging.Debug(fmt.Sprintf("PieceView: IssueRef[%d]: Year=%d, Nr=%d, Von=%d, Bis=%d, Beilage=%d", i, ref.When.Year, ref.Nr, ref.Von, ref.Bis, ref.Beilage))
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
		// Handle case where Bis=0 (should be treated as single page at Von)
		bis := issueRef.Bis
		if bis == 0 {
			bis = issueRef.Von
		}

		for pageNum := issueRef.Von; pageNum <= bis; pageNum++ {
			pageEntry := PiecePageEntry{
				PageNumber:     pageNum,
				IssueYear:      issueRef.When.Year,
				IssueNumber:    issueRef.Nr,
				IsContinuation: pageNum > issueRef.Von || partIndex > 0,
				IssueContext:   issueContext,
				Available:      true,                       // Will be updated when we load images
				OtherPieces:    []IndividualPieceByIssue{}, // Will be populated later
				PartNumber:     partIndex + 1,              // Part number (1-based)
			}

			// Get actual image path, preview path, and JPEG path from provider
			pageEntry.ImagePath, pageEntry.PreviewPath, pageEntry.JpegPath = getImagePathsFromProvider(pics, issueRef.When.Year, issueRef.Nr, pageNum, issueRef.Beilage > 0)

			pvm.AllPages = append(pvm.AllPages, pageEntry)
		}
	}

	pvm.TotalPageCount = len(pvm.AllPages)

	// DEBUG: Log final counts
	logging.Debug(fmt.Sprintf("PieceView: Final counts - %d issue contexts, %d total pages", len(pvm.IssueContexts), pvm.TotalPageCount))
	logging.Debug(fmt.Sprintf("PieceView: Issue contexts: %v", pvm.IssueContexts))

	// Load images and update availability
	if err := pvm.loadImages(pics); err != nil {
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
func (pvm *PieceVM) loadImages(pics *pictures.PicturesProvider) error {
	issuePages := []IssuePage{}
	hasAnyImages := false

	for i, pageEntry := range pvm.AllPages {
		// Create IssuePage for template compatibility
		issuePage := IssuePage{
			PageNumber:  pageEntry.PageNumber,
			ImagePath:   pageEntry.ImagePath,
			PreviewPath: pageEntry.PreviewPath,
			JpegPath:    pageEntry.JpegPath,
			Available:   true,     // Assume available for now
			PageIcon:    "single", // Simplified icon for piece view
		}

		// Check if image actually exists using the provider
		if _, exists := pics.GetByYearPage(pageEntry.IssueYear, pageEntry.PageNumber); exists {
			hasAnyImages = true
		} else {
			issuePage.Available = false
			pvm.AllPages[i].Available = false
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

// getImagePathsFromProvider gets image paths: primary (WebP preferred), preview (compressed), and JPEG, handling both regular and Beilage pages
func getImagePathsFromProvider(pics *pictures.PicturesProvider, year, issue, page int, isBeilage bool) (string, string, string) {
	// Get image file from provider
	imageFile, exists := pics.GetByYearIssuePage(year, issue, page, isBeilage)
	if !exists {
		// Fallback for regular pages
		if !isBeilage {
			fallbackPath := fmt.Sprintf("/static/pictures/%d/seite_%d.jpg", year, page)
			return fallbackPath, fallbackPath, fallbackPath
		}
		// No file found for beilage
		return "", "", ""
	}

	// Return paths from found image file
	previewPath := imageFile.PreviewPath
	if previewPath == "" {
		previewPath = imageFile.Path // Fallback to original if no preview
	}
	jpegPath := imageFile.JpegPath
	if jpegPath == "" {
		jpegPath = imageFile.Path // Fallback to primary if no separate JPEG
	}
	return imageFile.Path, previewPath, jpegPath
}

// populateOtherPieces finds and populates other pieces that appear on the same pages as this piece
func (pvm *PieceVM) populateOtherPieces(lib *xmlmodels.Library) error {
	logging.Debug(fmt.Sprintf("Starting populateOtherPieces for piece %s", pvm.Piece.Identifier.ID))
	for i, pageEntry := range pvm.AllPages {
		logging.Debug(fmt.Sprintf("Processing page %d from issue %d/%d", pageEntry.PageNumber, pageEntry.IssueYear, pageEntry.IssueNumber))

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
			logging.Debug(fmt.Sprintf("Issue not found for %d/%d", pageEntry.IssueYear, pageEntry.IssueNumber))
			continue
		}

		// Get all pieces for this issue using the same approach as the ausgabe view
		piecesForIssue, _, err := PiecesForIssue(lib, *issue)
		if err != nil {
			logging.Error(err, fmt.Sprintf("Error getting pieces for issue %d/%d", pageEntry.IssueYear, pageEntry.IssueNumber))
			continue
		}
		logging.Debug(fmt.Sprintf("Found %d total pieces for issue %d/%d", len(piecesForIssue.Pages), pageEntry.IssueYear, pageEntry.IssueNumber))
		logging.Debug(fmt.Sprintf("PiecesForIssue.Pages = %v", piecesForIssue.Pages))

		// Create IndividualPiecesByPage using the same function as ausgabe view
		individualPieces := CreateIndividualPagesWithMetadata(piecesForIssue, lib)
		logging.Debug(fmt.Sprintf("CreateIndividualPagesWithMetadata created %d pages with pieces", len(individualPieces.Pages)))
		logging.Debug(fmt.Sprintf("Pages with pieces: %v", individualPieces.Pages))

		// DEBUG: Show what pages are available in the map
		if pageEntry.PageNumber == 113 {
			logging.Debug(fmt.Sprintf("Available pages in individualPieces.Items: %v", individualPieces.Pages))
			for pageNum := range individualPieces.Items {
				logging.Debug(fmt.Sprintf("Page %d has %d pieces", pageNum, len(individualPieces.Items[pageNum])))
			}
		}

		// Get pieces that appear on this specific page
		if individualPiecesOnPage, exists := individualPieces.Items[pageEntry.PageNumber]; exists {
			logging.Debug(fmt.Sprintf("Found %d pieces on page %d", len(individualPiecesOnPage), pageEntry.PageNumber))
			otherPieces := []IndividualPieceByIssue{}

			for _, individualPiece := range individualPiecesOnPage {
				// Skip the current piece itself using comprehensive comparison
				if IsSamePiece(individualPiece.PieceByIssue.Piece, pvm.Piece) {
					logging.Debug("Skipping current piece (comprehensive field match)")
					continue
				}

				// Debug piece information
				pieceTitle := "no title"
				if len(individualPiece.PieceByIssue.Piece.Title) > 0 {
					pieceTitle = individualPiece.PieceByIssue.Piece.Title[0]
				} else if len(individualPiece.PieceByIssue.Piece.Incipit) > 0 {
					pieceTitle = individualPiece.PieceByIssue.Piece.Incipit[0]
				}

				logging.Debug(fmt.Sprintf("Adding other piece title='%s'", pieceTitle))
				otherPieces = append(otherPieces, individualPiece)
			}

			logging.Debug(fmt.Sprintf("Found %d other pieces on page %d", len(otherPieces), pageEntry.PageNumber))
			pvm.AllPages[i].OtherPieces = otherPieces
		} else {
			logging.Debug(fmt.Sprintf("No pieces found on page %d", pageEntry.PageNumber))
		}
	}

	return nil
}

// IsSamePiece compares two pieces using comprehensive field-by-field heuristics
// This is a universal method that can be used anywhere in the codebase
func IsSamePiece(piece1, piece2 xmlmodels.Piece) bool {
	// 1. Compare titles (all variants)
	if !equalStringSlices(piece1.Title, piece2.Title) {
		return false
	}

	// 2. Compare incipits (all variants)
	if !equalStringSlices(piece1.Incipit, piece2.Incipit) {
		return false
	}

	// 3. Compare issue references (must have identical coverage)
	if !equalIssueRefs(piece1.IssueRefs, piece2.IssueRefs) {
		return false
	}

	// 4. Compare category references
	if !equalCategoryRefs(piece1.CategoryRefs, piece2.CategoryRefs) {
		return false
	}

	// 5. Compare agent references (authors, etc.)
	if !equalAgentRefs(piece1.AgentRefs, piece2.AgentRefs) {
		return false
	}

	// 6. Compare work references
	if !equalWorkRefs(piece1.WorkRefs, piece2.WorkRefs) {
		return false
	}

	// 7. Compare place references
	if !equalPlaceRefs(piece1.PlaceRefs, piece2.PlaceRefs) {
		return false
	}

	return true
}

// Helper functions for comparing slices and references

func equalStringSlices(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func equalIssueRefs(a, b []xmlmodels.IssueRef) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].When.Year != b[i].When.Year ||
			a[i].Nr != b[i].Nr ||
			a[i].Von != b[i].Von ||
			a[i].Bis != b[i].Bis {
			return false
		}
	}
	return true
}

func equalCategoryRefs(a, b []xmlmodels.CategoryRef) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Ref != b[i].Ref {
			return false
		}
	}
	return true
}

func equalAgentRefs(a, b []xmlmodels.AgentRef) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Ref != b[i].Ref || a[i].Category != b[i].Category {
			return false
		}
	}
	return true
}

func equalWorkRefs(a, b []xmlmodels.WorkRef) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Ref != b[i].Ref {
			return false
		}
	}
	return true
}

func equalPlaceRefs(a, b []xmlmodels.PlaceRef) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Ref != b[i].Ref {
			return false
		}
	}
	return true
}

