package viewmodels

import (
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type SingleIssueViewModel struct {
	IssueViewModel
	No     int
	Year   string
	Pieces PieceListViewModel
	Next   IssueViewModel
	Prev   IssueViewModel
}

func NewSingleIssueView(y string, No string, lib *xmlprovider.Library) (*SingleIssueViewModel, error) {
	ivm, err := IssueView(y, No, lib)
	if err != nil {
		return nil, err
	}

	pl, err := PieceListViewModelForIssue(lib, y, No)
	if err != nil {
		return nil, err
	}

	no, err := strconv.Atoi(No)
	if err != nil {
		return nil, err
	}

	sivm := SingleIssueViewModel{IssueViewModel: *ivm, No: no, Year: y, Pieces: *pl}

	sivm.Pieces.Sort(y, no)

	return &sivm, nil
}
