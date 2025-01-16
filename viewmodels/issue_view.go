package viewmodels

import (
	"fmt"
	"maps"
	"slices"

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

// TODO: Next & Prev
type IssueVM struct {
	xmlmodels.Issue
	Next             *xmlmodels.Issue
	Prev             *xmlmodels.Issue
	Pieces           PiecesByPage
	AdditionalPieces PiecesByPage
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
