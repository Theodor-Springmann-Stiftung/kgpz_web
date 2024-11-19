package xmlprovider

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

type Issue struct {
	XMLName     xml.Name     `xml:"stueck"`
	Number      Nummer       `xml:"nummer"`
	Datum       KGPZDate     `xml:"datum"`
	Von         int          `xml:"von"`
	Bis         int          `xml:"bis"`
	Additionals []Additional `xml:"beilage"`
	Identifier
	AnnotationNote
}

type Nummer struct {
	No        int    `xml:",chardata"`
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

func (i Issue) String() string {
	return fmt.Sprintf("Number: %v, Datum: %v, Von: %d, Bis: %d, Additionals: %v, Identifier: %v, AnnotationNote: %v\n", i.Number, i.Datum, i.Von, i.Bis, i.Additionals, i.Identifier, i.AnnotationNote)
}

func NewIssueProvider(paths []string) *IssueProvider {
	return &IssueProvider{XMLProvider: XMLProvider[Issues]{paths: paths}}
}
