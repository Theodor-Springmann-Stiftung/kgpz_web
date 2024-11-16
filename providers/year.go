package providers

import (
	"slices"
	"strconv"
	"time"
)

const TLAYOUT = "2006-01-02"

var TRANSLM = map[string][]string{
	"January":   {"Januar", "Jan"},
	"February":  {"Februar", "Feb"},
	"March":     {"März", "Mär"},
	"April":     {"April", "Apr"},
	"May":       {"Mai", "Mai"},
	"June":      {"Juni", "Jun"},
	"July":      {"Juli", "Jul"},
	"August":    {"August", "Aug"},
	"September": {"September", "Sep"},
	"October":   {"Oktober", "Okt"},
	"November":  {"November", "Nov"},
	"December":  {"Dezember", "Dez"},
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
	Issue
	Weekday []string
	Day     int
	Month   []string
}

func NewIssueView(i Issue) (IssueViewModel, error) {
	t, err := time.Parse(TLAYOUT, i.Datum.When)
	if err != nil {
		return IssueViewModel{}, err
	}

	return IssueViewModel{
		Issue:   i,
		Weekday: append(TRANSLD[t.Weekday().String()], t.Weekday().String()),
		Day:     t.Day(),
		Month:   append(TRANSLM[t.Month().String()], i.Datum.When[5:7]),
	}, nil
}

type YearViewModel struct {
	Year           string
	AvailableYears []int
	Issues         []IssueViewModel
}

func (y *YearViewModel) PushIssue(i Issue) {
	iv, err := NewIssueView(i)
	if err != nil {
		return
	}
	y.Issues = append(y.Issues, iv)
}

func (y *YearViewModel) PushAvailable(s string) {
	i, err := strconv.Atoi(s)
	if err != nil {
		return
	}

	if !slices.Contains(y.AvailableYears, i) {
		y.AvailableYears = append(y.AvailableYears, i)
	}
}

func (y *YearViewModel) SortAvailableYears() {
	slices.Sort(y.AvailableYears)
}
