package xmlmodels

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

func AgentsIntoDataset(provider *xmlprovider.XMLProvider[Agent]) []gnd.GNDData {
	provider.Lock()
	defer provider.Unlock()
	var data []gnd.GNDData
	for _, agent := range provider.Array {
		data = append(data, gnd.GNDData{ID: agent.ID, GND: agent.GND})
	}
	return data
}
