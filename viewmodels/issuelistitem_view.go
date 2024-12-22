package viewmodels

import (
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
	return &IssueListitemVM{
		No:    i.Number.No,
		Issue: i,
		Day:   i.Datum.When.Day,
		Month: i.Datum.When.Month,
		Year:  i.Datum.When.Year,
	}, nil
}
