package xmlprovider

import (
	"encoding/xml"
	"fmt"
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
	return strconv.Itoa(i.Number.No) + "-" + i.Datum.When.String()
}

func (i Issue) String() string {
	return fmt.Sprintf("Number: %v, Datum: %v, Von: %d, Bis: %d, Additionals: %v, Identifier: %v, AnnotationNote: %v\n", i.Number, i.Datum, i.Von, i.Bis, i.Additionals, i.Identifier, i.AnnotationNote)
}
