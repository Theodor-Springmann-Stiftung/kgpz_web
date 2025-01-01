package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
)

type Place struct {
	XMLName  xml.Name `xml:"ort"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Geo      string   `xml:"geonames"`
	Identifier
	AnnotationNote
}

func (p Place) Name() string {
	return "place"
}

func (p Place) String() string {
	data, _ := json.MarshalIndent(p, "", "  ")
	return string(data)
}
