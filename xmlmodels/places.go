package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
)

const (
	PLACE_TYPE = "place"
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

func (p Place) Readable(_ *Library) map[string]interface{} {
	ret := map[string]interface{}{
		"ID":    p.ID,
		"Names": p.Names,
	}

	for k, v := range p.AnnotationNote.Readable() {
		ret[k] = v
	}

	return ret
}

func (p Place) Type() string {
	return PLACE_TYPE
}
