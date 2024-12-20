package viewmodels

import (
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type AgentView struct {
	Agents []xmlprovider.Agent
	Works  map[string][]xmlprovider.Work
	Pieces map[string][]xmlprovider.Piece
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

	res.Works = make(map[string][]xmlprovider.Work)
	res.Pieces = make(map[string][]xmlprovider.Piece)

	lib.Works.Items.Range(func(key, value interface{}) bool {
		w := value.(xmlprovider.Work)
		for _, a := range res.Agents {
			if strings.HasPrefix(a.ID, letterorid) {
				_, ok := res.Works[a.ID]
				if !ok {
					res.Works[a.ID] = []xmlprovider.Work{}
				}
				res.Works[a.ID] = append(res.Works[a.ID], w)
			}
		}
		return true
	})

	lib.Pieces.Items.Range(func(key, value interface{}) bool {
		p := value.(xmlprovider.Piece)
		for _, a := range res.Agents {
			if strings.HasPrefix(a.ID, letterorid) {
				_, ok := res.Pieces[a.ID]
				if !ok {
					res.Pieces[a.ID] = []xmlprovider.Piece{}
				}
				res.Pieces[a.ID] = append(res.Pieces[a.ID], p)
			}
		}
		return true
	})

	return &res
}
