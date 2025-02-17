package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strconv"
)

const (
	ISSUE_TYPE = "issue"
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

func (i Issue) Keys() []string {
	res := make([]string, 0, 2)
	res = append(res, i.Reference())

	date := i.Datum.When.String()
	if date != "" {
		res = append(res, date)
	}

	return res
}

func (i Issue) Year() int {
	return i.Datum.When.Year
}

func (i Issue) Reference() string {
	return strconv.Itoa(i.Datum.When.Year) + "-" + strconv.Itoa(i.Number.No)
}

func (i Issue) String() string {
	data, _ := json.MarshalIndent(i, "", "  ")
	return string(data)
}

func (i Issue) Readable(_ *Library) map[string]interface{} {
	ret := map[string]interface{}{
		"ID":     i.ID,
		"Number": i.Number.No,
		"Year":   i.Datum.When.Year,
		"Date":   strconv.Itoa(i.Datum.When.Day) + "." + strconv.Itoa(i.Datum.When.Month) + "." + strconv.Itoa(i.Datum.When.Year),
	}

	for k, v := range i.AnnotationNote.Readable() {
		ret[k] = v
	}

	return ret
}

func (i Issue) Type() string {
	return ISSUE_TYPE
}
