package providers

import (
	"encoding/xml"
	"fmt"
)

type IssueProvider struct {
	XMLProvider[Issues]
}

type Issues struct {
	XMLName xml.Name `xml:"stuecke"`
	Issues  []Issue  `xml:"stueck"`
}

func (i *IssueProvider) GetYear(year string) YearViewModel {
	res := YearViewModel{Year: year}
	last := ""
	for _, issue := range i.Items.Issues {
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

	res.SortAvailableYears()

	return res
}

type Issue struct {
	XMLName     xml.Name     `xml:"stueck"`
	Number      IssueNumber  `xml:"nummer"`
	Datum       KGPZDate     `xml:"datum"`
	Von         string       `xml:"von"`
	Bis         string       `xml:"bis"`
	Additionals []Additional `xml:"beilage"`
	Identifier
	AnnotationNote
}

type IssueNumber struct {
	XMLName xml.Name `xml:"nummer"`
	Value
	Corrected string `xml:"korrigiert,attr"`
}

type Additional struct {
	XMLName xml.Name `xml:"beilage"`
	Nummer  string   `xml:"nummer,attr"`
	Von     string   `xml:"von"`
	Bis     string   `xml:"bis"`
}

func (i Issues) Append(data Issues) Issues {
	i.Issues = append(i.Issues, data.Issues...)
	return i
}

func (i Issues) String() string {
	var res []string
	for _, issue := range i.Issues {
		res = append(res, issue.String())
	}

	return fmt.Sprintf("Issues: %v", res)
}

func (i *Issue) String() string {
	return fmt.Sprintf("ID: %s\nNumber: %v\nDatum: %v\nVon: %s\nBis: %s\nAdditionals: %v\n", i.ID, i.Number, i.Datum, i.Von, i.Bis, i.Additionals)
}

func NewIssueProvider(paths []string) *IssueProvider {
	return &IssueProvider{XMLProvider: XMLProvider[Issues]{paths: paths}}
}
