package viewmodels

import (
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type AgentView struct {
	Agents []xmlprovider.Agent
}

func AgentsView(letterorid string, lib *xmlprovider.Library) *AgentView {
	res := AgentView{}
	lib.Agents.Items.Range(func(key, value interface{}) bool {
		k := key.(string)
		if strings.HasPrefix(k, letterorid) {
			agent := value.(xmlprovider.Agent)
			res.Agents = append(res.Agents, agent)
		}
		return true
	})

	return &res
}
