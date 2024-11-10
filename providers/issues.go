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
	Issue   []Issue  `xml:"stueck"`
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

type KGPZDate struct {
	XMLName   xml.Name `xml:"datum"`
	When      string   `xml:"when,attr"`
	NotBefore string   `xml:"notBefore,attr"`
	NotAfter  string   `xml:"notAfter,attr"`
	From      string   `xml:"from,attr"`
	To        string   `xml:"to,attr"`
	Value
}

type Additional struct {
	XMLName xml.Name `xml:"beilage"`
	Nummer  string   `xml:"nummer,attr"`
	Von     string   `xml:"von"`
	Bis     string   `xml:"bis"`
}

func (i Issues) Append(data Issues) Issues {
	i.Issue = append(i.Issue, data.Issue...)
	return i
}

func (i Issues) String() string {
	var res []string
	for _, issue := range i.Issue {
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
