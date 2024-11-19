package viewmodels

import (
	"errors"
	"slices"
	"sort"
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type IssuesByMonth map[int][]IssueViewModel

type YearViewModel struct {
	Year           string
	AvailableYears []string
	Issues         IssuesByMonth
}

func (y *YearViewModel) PushIssue(i xmlprovider.Issue) {
	iv, err := FromIssue(i)
	if err != nil {
		return
	}

	month, _ := strconv.Atoi(iv.Month[2])

	list, ok := y.Issues[month]
	if !ok {
		list = []IssueViewModel{}
	}

	y.Issues[month] = append(list, *iv)
}

func (y *YearViewModel) PushAvailable(s string) {

	if !slices.Contains(y.AvailableYears, s) {
		y.AvailableYears = append(y.AvailableYears, s)
	}
}

func (y *YearViewModel) SortAvailableYears() {
	sort.Slice(y.AvailableYears, func(i, j int) bool {
		iint, err := strconv.Atoi(y.AvailableYears[i])
		if err != nil {
			return true
		}
		jint, err := strconv.Atoi(y.AvailableYears[j])
		if err != nil {
			return false
		}
		return iint < jint
	})
}

func YearView(year string, lib *xmlprovider.Library) (*YearViewModel, error) {
	res := YearViewModel{Year: year}
	res.Issues = make(IssuesByMonth, 12)
	last := ""
	for _, issue := range lib.Issues.Items.Issues {

		logging.ObjDebug(&issue, "Issue")
		if len(issue.Datum.When) < 4 {
			continue
		}

		date := issue.Datum.When[0:4]
		if date != last {
			res.PushAvailable(date)
			last = date
		}

		if date == year {
			res.PushIssue(issue)
		}
	}

	if len(res.Issues) == 0 {
		return nil, errors.New("No issues found")
	}

	res.SortAvailableYears()

	return &res, nil
}
