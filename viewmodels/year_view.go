package viewmodels

import (
	"fmt"
	"maps"
	"slices"
	"sort"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type IssuesByMonth map[int][]xmlprovider.Issue

func (ibm *IssuesByMonth) Sort() {
	for _, issues := range *ibm {
		sort.Slice(issues, func(i, j int) bool {
			return issues[i].Number.No < issues[j].Number.No
		})
	}
}

type YearVM struct {
	Year           int
	AvailableYears []int
	Issues         IssuesByMonth
}

func YearView(year int, lib *xmlprovider.Library) (*YearVM, error) {
	issues := make(IssuesByMonth, 12)
	years := make(map[int]bool)

	lib.Issues.Lock()
	for _, issue := range lib.Issues.Array {
		y := issue.Datum.When.Year
		years[y] = true
		if y == year {
			functions.MapArrayInsert(issues, issue.Datum.When.Month, issue)
		}
	}
	lib.Issues.Unlock()

	if len(issues) == 0 {
		return nil, fmt.Errorf("No issues found for year %v", year)
	}

	availableyears := slices.Collect(maps.Keys(years))
	slices.Sort(availableyears)
	issues.Sort()

	return &YearVM{
		Year:           year,
		AvailableYears: availableyears,
		Issues:         issues,
	}, nil
}
