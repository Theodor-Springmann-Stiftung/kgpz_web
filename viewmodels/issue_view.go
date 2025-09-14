package viewmodels

import (
	"fmt"
	"maps"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type PieceByIssue struct {
	xmlmodels.Piece
	// TODO: this is a bit hacky, but it refences the page number of the piece in the issue
	Reference xmlmodels.IssueRef
}

type PiecesByPage struct {
	Items map[int][]PieceByIssue
	Pages []int
}

type IssuePage struct {
	PageNumber int
	ImagePath  string
	Available  bool
}

type IssueImages struct {
	MainPages        []IssuePage
	AdditionalPages  map[int][]IssuePage // Beilage number -> pages
	HasImages        bool
}

type ImageFile struct {
	Year      int
	Issue     int
	Page      int
	IsBeilage bool
	BeilageNo int
	Filename  string
	Path      string
}

type ImageRegistry struct {
	Files          []ImageFile
	ByYearIssue    map[string][]ImageFile // "year-issue" -> files
	ByYearPage     map[string]ImageFile   // "year-page" -> file
}

var imageRegistry *ImageRegistry

// TODO: Next & Prev
type IssueVM struct {
	xmlmodels.Issue
	Next             *xmlmodels.Issue
	Prev             *xmlmodels.Issue
	Pieces           PiecesByPage
	AdditionalPieces PiecesByPage
	Images           IssueImages
}

func NewSingleIssueView(y, no int, lib *xmlmodels.Library) (*IssueVM, error) {
	lib.Issues.Lock()
	var issue *xmlmodels.Issue = nil
	var next *xmlmodels.Issue = nil
	var prev *xmlmodels.Issue = nil

	for i, iss := range lib.Issues.Array {
		if iss.Datum.When.Year == y && iss.Number.No == no {
			issue = &iss
			if i > 0 {
				prev = &lib.Issues.Array[i-1]
			}
			if i < len(lib.Issues.Array)-1 {
				next = &lib.Issues.Array[i+1]
			}
		}
	}

	if issue == nil {
		return nil, fmt.Errorf("No issue found for %v-%v", y, no)
	}

	var Next *xmlmodels.Issue = nil
	var Prev *xmlmodels.Issue = nil
	if next != nil {
		Next = &*next
	}
	if prev != nil {
		Prev = &*prev
	}

	sivm := IssueVM{Issue: *issue, Next: Next, Prev: Prev}

	lib.Issues.Unlock()
	ppi, ppa, err := PiecesForIsssue(lib, *issue)
	if err != nil {
		return nil, err
	}

	slices.Sort(ppi.Pages)
	slices.Sort(ppa.Pages)

	sivm.Pieces = ppi
	sivm.AdditionalPieces = ppa

	images, err := LoadIssueImages(*issue)
	if err != nil {
		return nil, err
	}
	sivm.Images = images

	return &sivm, nil
}

func PiecesForIsssue(lib *xmlmodels.Library, issue xmlmodels.Issue) (PiecesByPage, PiecesByPage, error) {
	year := issue.Datum.When.Year

	ppi := PiecesByPage{Items: make(map[int][]PieceByIssue)}
	ppa := PiecesByPage{Items: make(map[int][]PieceByIssue)}

	// TODO: will we have to lock this, if we shutdown the server while loading the library?
	lib.Pieces.Lock()
	defer lib.Pieces.Unlock()

	for _, piece := range lib.Pieces.Array {
		if d, ok := piece.ReferencesIssue(year, issue.Number.No); ok {
			p := PieceByIssue{Piece: piece, Reference: *d}
			if d.Beilage > 0 {
				functions.MapArrayInsert(ppa.Items, d.Von, p)
			} else {
				functions.MapArrayInsert(ppi.Items, d.Von, p)
			}
		}
	}

	ppi.Pages = slices.Collect(maps.Keys(ppi.Items))
	ppa.Pages = slices.Collect(maps.Keys(ppa.Items))

	return ppi, ppa, nil
}

func LoadIssueImages(issue xmlmodels.Issue) (IssueImages, error) {
	// Initialize registry if not already done
	if err := initImageRegistry(); err != nil {
		return IssueImages{}, err
	}

	year := issue.Datum.When.Year
	issueNo := issue.Number.No

	images := IssueImages{
		MainPages:       make([]IssuePage, 0),
		AdditionalPages: make(map[int][]IssuePage),
		HasImages:       false,
	}

	// Get all image files for this year-issue combination
	yearIssueKey := fmt.Sprintf("%d-%d", year, issueNo)
	issueFiles := imageRegistry.ByYearIssue[yearIssueKey]

	// Separate main pages from beilage pages
	var mainFiles []ImageFile
	var beilageFiles []ImageFile

	for _, file := range issueFiles {
		if file.IsBeilage {
			beilageFiles = append(beilageFiles, file)
		} else {
			mainFiles = append(mainFiles, file)
		}
	}

	// Create main pages - match with issue page range
	for page := issue.Von; page <= issue.Bis; page++ {
		var foundFile *ImageFile

		// Look for a file that has this page number
		for _, file := range mainFiles {
			if file.Page == page {
				foundFile = &file
				break
			}
		}

		if foundFile != nil {
			images.HasImages = true
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber: page,
				ImagePath:  foundFile.Path,
				Available:  true,
			})
		} else {
			images.MainPages = append(images.MainPages, IssuePage{
				PageNumber: page,
				ImagePath:  "",
				Available:  false,
			})
		}
	}

	// Create beilage pages - match with beilage page ranges
	for _, additional := range issue.Additionals {
		beilagePages := make([]IssuePage, 0)

		for page := additional.Von; page <= additional.Bis; page++ {
			var foundFile *ImageFile

			// Look for beilage files that match this page number
			for _, file := range beilageFiles {
				if file.Page == page {
					foundFile = &file
					break
				}
			}

			if foundFile != nil {
				images.HasImages = true
				beilagePages = append(beilagePages, IssuePage{
					PageNumber: page,
					ImagePath:  foundFile.Path,
					Available:  true,
				})
			} else {
				beilagePages = append(beilagePages, IssuePage{
					PageNumber: page,
					ImagePath:  "",
					Available:  false,
				})
			}
		}

		if len(beilagePages) > 0 {
			images.AdditionalPages[additional.Nummer] = beilagePages
		}
	}

	return images, nil
}

func initImageRegistry() error {
	if imageRegistry != nil {
		return nil
	}

	imageRegistry = &ImageRegistry{
		Files:       make([]ImageFile, 0),
		ByYearIssue: make(map[string][]ImageFile),
		ByYearPage:  make(map[string]ImageFile),
	}

	return filepath.Walk("pictures", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		filename := info.Name()

		// Skip non-jpg files
		if !strings.HasSuffix(strings.ToLower(filename), ".jpg") {
			return nil
		}

		// Remove .jpg extension and split by -
		nameWithoutExt := strings.TrimSuffix(filename, ".jpg")
		parts := strings.Split(nameWithoutExt, "-")

		// Need at least 3 parts: year-issue-page
		if len(parts) != 3 {
			return nil
		}

		// Parse year
		year, err := strconv.Atoi(strings.TrimSpace(parts[0]))
		if err != nil {
			return nil
		}

		// Check if second part ends with 'b' (beilage)
		issueStr := strings.TrimSpace(parts[1])
		isBeilage := strings.HasSuffix(issueStr, "b")

		if isBeilage {
			issueStr = strings.TrimSuffix(issueStr, "b")
		}

		// Parse issue number
		issue, err := strconv.Atoi(issueStr)
		if err != nil {
			return nil
		}

		// Parse page number
		page, err := strconv.Atoi(strings.TrimSpace(parts[2]))
		if err != nil {
			return nil
		}

		imageFile := ImageFile{
			Year:      year,
			Issue:     issue,
			Page:      page,
			IsBeilage: isBeilage,
			BeilageNo: 1, // Default beilage number
			Filename:  filename,
			Path:      fmt.Sprintf("/static/pictures/%s", path[9:]), // Remove "pictures/" prefix
		}

		imageRegistry.Files = append(imageRegistry.Files, imageFile)

		yearIssueKey := fmt.Sprintf("%d-%d", year, issue)
		imageRegistry.ByYearIssue[yearIssueKey] = append(imageRegistry.ByYearIssue[yearIssueKey], imageFile)

		if !isBeilage {
			yearPageKey := fmt.Sprintf("%d-%d", year, page)
			imageRegistry.ByYearPage[yearPageKey] = imageFile
		}

		return nil
	})
}
