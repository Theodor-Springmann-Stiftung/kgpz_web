package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
)

type Agent struct {
	XMLName  xml.Name `xml:"akteur"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Life     string   `xml:"lebensdaten"`
	GND      string   `xml:"gnd"`
	Org      bool     `xml:"org,attr"`
	Identifier
	AnnotationNote
}

func (a Agent) Name() string {
	return "agent"
}

func (a Agent) String() string {
	data, _ := json.MarshalIndent(a, "", "  ")
	return string(data)
}
