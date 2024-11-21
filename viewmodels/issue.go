package viewmodels

import (
	"errors"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const TLAYOUT = "2006-01-02"

type IssueViewModel struct {
	xmlprovider.Issue
	Day   int
	Month int
	Year  int
}

func IssueView(y string, No string, lib *xmlprovider.Library) (*IssueViewModel, error) {
	issue := lib.Issues.Item(y + "-" + No)

	if issue == nil {
		return nil, errors.New("Issue not found")
	}

	return FromIssue(*issue)

}

func FromIssue(i xmlprovider.Issue) (*IssueViewModel, error) {
	t, err := time.Parse(TLAYOUT, i.Datum.When)
	if err != nil {
		return nil, err
	}

	ivm := IssueViewModel{
		Issue: i,
		Day:   t.Day(),
		Month: int(t.Month()),
		Year:  t.Year(),
	}

	return &ivm, nil
}
