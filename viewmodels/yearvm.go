package viewmodels

import (
	"errors"
	"slices"
	"sort"
	"strconv"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type IssuesByMonth map[int][]IssueViewModel

type YearViewModel struct {
	Year           string
	AvailableYears []string
	Issues         IssuesByMonth
}

func YearView(year string, lib *xmlprovider.Library) (*YearViewModel, error) {
	res := YearViewModel{Year: year}
	res.Issues = make(IssuesByMonth, 12)
	last := ""

	lib.Issues.Items.Range(func(key, value interface{}) bool {
		k := key.(string)
		if len(k) < 4 {
			return true
		}

		date := k[0:4]
		if date != last {
			res.PushAvailable(date)
			last = date
		}

		if date == year {
			issue := value.(xmlprovider.Issue)
			res.PushIssue(issue)
		}
		return true
	})

	if len(res.Issues) == 0 {
		return nil, errors.New("No issues found for year " + year)
	}

	res.Sort()

	return &res, nil
}

func (y *YearViewModel) Sort() {
	y.SortAvailableYears()
	y.Issues.Sort()
}

func (y *YearViewModel) PushIssue(i xmlprovider.Issue) {
	iv, err := FromIssue(i)
	if err != nil {
		return
	}

	list, ok := y.Issues[iv.Month]
	if !ok {
		list = []IssueViewModel{}
	} else {
		for _, issue := range list {
			if issue.Number.No == iv.Number.No {
				return
			}
		}
	}

	y.Issues[iv.Month] = append(list, *iv)
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

func (ibm *IssuesByMonth) Sort() {
	for _, issues := range *ibm {
		sort.Slice(issues, func(i, j int) bool {
			return issues[i].Number.No < issues[j].Number.No
		})
	}
}
