package xmlmodels

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
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
