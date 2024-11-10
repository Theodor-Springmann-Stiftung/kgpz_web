package providers

import (
	"encoding/xml"
	"fmt"
)

type PlaceProvider struct {
	XMLProvider[Places]
}

type Places struct {
	XMLName xml.Name `xml:"orte"`
	Place   []Place  `xml:"ort"`
}

type Place struct {
	ID       string   `xml:"id,attr"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Geo      string   `xml:"geonames"`
	AnnotationNote
}

func (p Places) Append(data Places) Places {
	p.Place = append(p.Place, data.Place...)
	return p
}

func (p Places) String() string {
	var res []string
	for _, place := range p.Place {
		res = append(res, place.String())
	}

	return fmt.Sprintf("Places: %v", res)
}

func (p *Place) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nGeo: %s\nAnnotations: %v\nNotes: %v\n", p.ID, p.Names, p.SortName, p.Geo, p.Annotations, p.Notes)
}

func NewPlaceProvider(paths []string) *PlaceProvider {
	return &PlaceProvider{XMLProvider: XMLProvider[Places]{paths: paths}}
}
