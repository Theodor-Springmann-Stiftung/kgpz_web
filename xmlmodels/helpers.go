package xmlmodels

import (
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/gnd"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/geonames"
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

func PlacesIntoDataset(provider *xmlprovider.XMLProvider[Place]) []geonames.GeonamesData {
	provider.Lock()
	defer provider.Unlock()
	var data []geonames.GeonamesData
	for _, place := range provider.Array {
		data = append(data, geonames.GeonamesData{ID: place.ID, Geonames: place.Geo})
	}
	return data
}
