package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strconv"
)

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
	Nummer  int      `xml:"nummer,attr"`
	Von     int      `xml:"von"`
	Bis     int      `xml:"bis"`
}

func (i Issue) Name() string {
	return "issue"
}

func (i Issue) Keys() []string {
	if len(i.keys) > 0 {
		return i.keys
	}

	res := make([]string, 2)
	date := i.Datum.When.String()
	if date != "" {
		res = append(res, date)
	}

	res = append(res, i.Reference())
	i.keys = res

	return res
}

func (i Issue) Year() int {
	return i.Datum.When.Year
}

func (i Issue) Reference() string {
	return strconv.Itoa(i.Number.No) + "-" + strconv.Itoa(i.Datum.When.Year)
}

func (i Issue) String() string {
	data, _ := json.MarshalIndent(i, "", "  ")
	return string(data)
}
