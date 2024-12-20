package gnd

import "github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"

type GNDData struct {
	ID, GND string
}

func ProviderIntoDataset(provider *xmlprovider.XMLProvider[xmlprovider.Agent]) []GNDData {
	provider.Lock()
	defer provider.Unlock()
	var data []GNDData
	for _, agent := range provider.Array {
		data = append(data, GNDData{ID: agent.ID, GND: agent.GND})
	}
	return data
}
