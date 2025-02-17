package xmlmodels

import (
	"encoding/json"
	"encoding/xml"
	"strings"
)

const (
	AGENT_TYPE = "agent"
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

func (a Agent) String() string {
	data, _ := json.MarshalIndent(a, "", "  ")
	return string(data)
}

func (a Agent) Readable(_ *Library) map[string]interface{} {
	ret := map[string]interface{}{
		"ID":    a.ID,
		"Names": strings.Join(a.Names, "; "),
		"Life":  a.Life,
	}

	for k, v := range a.AnnotationNote.Readable() {
		ret[k] = v
	}

	return ret
}

func (a Agent) Type() string {
	return AGENT_TYPE
}
