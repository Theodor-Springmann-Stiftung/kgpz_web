package viewmodels

import (
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const TLAYOUT = "2006-01-02"

type IssueListitemVM struct {
	xmlprovider.Issue
	No    int
	Day   int
	Month int
	Year  int
}

func ListitemFromIssue(i xmlprovider.Issue) (*IssueListitemVM, error) {
	t, err := time.Parse(TLAYOUT, i.Datum.When)
	if err != nil {
		return nil, err
	}

	return &IssueListitemVM{
		No:    i.Number.No,
		Issue: i,
		Day:   t.Day(),
		Month: int(t.Month()),
		Year:  t.Year(),
	}, nil
}
