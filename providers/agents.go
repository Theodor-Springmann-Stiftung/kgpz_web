package providers

import (
	"encoding/xml"
	"fmt"
)

type AgentProvider struct {
	XMLProvider[Agents]
}

type Agent struct {
	XMLName  xml.Name `xml:"akteur"`
	Names    []string `xml:"name"`
	SortName string   `xml:"sortiername"`
	Life     string   `xml:"lebensdaten"`
	GND      string   `xml:"gnd"`
	Identifier
	AnnotationNote
}

type Agents struct {
	XMLName xml.Name `xml:"akteure"`
	Agents  []Agent  `xml:"akteur"`
}

func (a Agents) String() string {
	var res []string
	for _, agent := range a.Agents {
		res = append(res, agent.String())
	}

	return fmt.Sprintf("Agents: %v", res)
}

func (a Agents) Append(data Agents) Agents {
	a.Agents = append(a.Agents, data.Agents...)
	return a
}

func (a *Agent) String() string {
	return fmt.Sprintf("ID: %s\nNames: %v\nSortName: %s\nLife: %s\nGND: %s\nAnnotations: %v\nNotes: %v\n", a.ID, a.Names, a.SortName, a.Life, a.GND, a.Annotations, a.Notes)
}

func NewAgentProvider(paths []string) *AgentProvider {
	return &AgentProvider{XMLProvider: XMLProvider[Agents]{paths: paths}}
}
