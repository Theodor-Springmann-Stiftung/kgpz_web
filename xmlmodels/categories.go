package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
)

type Category struct {
	XMLName  xml.Name `xml:"kategorie"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Identifier
	AnnotationNote
}

func (c Category) Name() string {
	return "category"
}

func (c Category) String() string {
	data, _ := json.MarshalIndent(c, "", "  ")
	return string(data)
}
