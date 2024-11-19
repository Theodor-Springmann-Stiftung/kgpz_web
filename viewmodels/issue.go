package viewmodels

import (
	"errors"
	"strconv"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const TLAYOUT = "2006-01-02"

var TRANSLM = map[string][]string{
	"January":   {"Januar", "Jan", "1"},
	"February":  {"Februar", "Feb", "2"},
	"March":     {"März", "Mär", "3"},
	"April":     {"April", "Apr", "4"},
	"May":       {"Mai", "Mai", "5"},
	"June":      {"Juni", "Jun", "6"},
	"July":      {"Juli", "Jul", "7"},
	"August":    {"August", "Aug", "8"},
	"September": {"September", "Sep", "9"},
	"October":   {"Oktober", "Okt", "10"},
	"November":  {"November", "Nov", "11"},
	"December":  {"Dezember", "Dez", "12"},
}

var TRANSLD = map[string][]string{
	"Monday":    {"Montag", "Mo"},
	"Tuesday":   {"Dienstag", "Di"},
	"Wednesday": {"Mittwoch", "Mi"},
	"Thursday":  {"Donnerstag", "Do"},
	"Friday":    {"Freitag", "Fr"},
	"Saturday":  {"Samstag", "Sa"},
	"Sunday":    {"Sonntag", "So"},
}

type IssueViewModel struct {
	xmlprovider.Issue
	Weekday []string
	Day     int
	Month   []string
}

func IssueView(y string, No string, lib *xmlprovider.Library) (*IssueViewModel, error) {
	n, err := strconv.Atoi(No)
	if err != nil {
		return nil, err
	}

	for _, i := range lib.Issues.Items.Issues {
		if len(i.Datum.When) < 4 {
			continue
		}

		d := i.Datum.When[:4]
		if d == y && i.Number.No == n {
			return FromIssue(i)
		}
	}

	return nil, errors.New("Issue not found")
}

func FromIssue(i xmlprovider.Issue) (*IssueViewModel, error) {
	t, err := time.Parse(TLAYOUT, i.Datum.When)
	if err != nil {
		return nil, err
	}

	ivm := IssueViewModel{
		Issue:   i,
		Weekday: append(TRANSLD[t.Weekday().String()], t.Weekday().String()),
		Day:     t.Day(),
		Month:   TRANSLM[t.Month().String()]}

	return &ivm, nil
}
