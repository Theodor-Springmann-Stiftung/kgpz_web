package viewmodels

import (
	"slices"
	"strconv"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type SingleIssueViewModel struct {
	IssueViewModel
	No               int
	Year             string
	Pieces           map[int][]PieceViewModel
	Pages            []int
	AdditionalPieces map[int][]PieceViewModel
	AdditionalPages  []int
	Next             IssueViewModel
	Prev             IssueViewModel
}

func NewSingleIssueView(y string, No string, lib *xmlprovider.Library) (*SingleIssueViewModel, error) {
	ivm, err := IssueView(y, No, lib)
	if err != nil {
		return nil, err
	}

	no, err := strconv.Atoi(No)
	if err != nil {
		return nil, err
	}

	sivm := SingleIssueViewModel{IssueViewModel: *ivm, No: no, Year: y}

	if err := sivm.PiecesForIsssue(lib); err != nil {
		return nil, err
	}

	slices.Sort(sivm.Pages)
	slices.Sort(sivm.AdditionalPages)

	return &sivm, nil
}

func (issue *SingleIssueViewModel) PiecesForIsssue(lib *xmlprovider.Library) error {
	nostr := strconv.Itoa(issue.No)
	lookfor := issue.Year + "-" + nostr + "-"
	n := issue.No
	y := issue.Year

	adp := make(map[int][]PieceViewModel)
	ip := make(map[int][]PieceViewModel)

	lib.Pieces.Items.Range(func(key, value interface{}) bool {
		k := key.(string)
		if strings.HasPrefix(k, lookfor) {
			a := value.(*xmlprovider.Piece)
			p, err := NewPieceView(a)
			if err != nil {
				logging.ObjErr(&a, err)
				return true
			}

			if strings.HasPrefix(k, lookfor+"b-") {
				for _, i := range p.AdditionalRef {
					// INFO: Here we find the page number the piece has in THIS issue, same below
					if i.Datum == y && i.Nr == n {
						p.Von = i.Von
						p.Bis = i.Bis
					}
				}

				functions.MapArrayInsert(adp, p.Von, p)
			} else {
				for _, i := range p.IssueRefs {
					if i.Datum == y && i.Nr == n {
						p.Von = i.Von
						p.Bis = i.Bis
					}
				}

				functions.MapArrayInsert(ip, p.Von, p)
			}
		}
		return true
	})

	issue.Pieces = ip
	issue.Pages = functions.Keys(ip)

	issue.AdditionalPieces = adp
	issue.AdditionalPages = functions.Keys(adp)

	return nil
}
