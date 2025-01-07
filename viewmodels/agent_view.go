package viewmodels

import (
	"maps"
	"slices"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type AgentsListView struct {
	Search           string
	AvailableLetters []string
	Agents           map[string]AgentView
	Sorted           []string
}

type AgentView struct {
	xmlmodels.Agent
	Works  []WorkByAgent
	Pieces []xmlprovider.Resolved[xmlmodels.Piece]
}

type WorkByAgent struct {
	xmlprovider.Resolved[xmlmodels.Work]
	Pieces []xmlprovider.Resolved[xmlmodels.Piece]
}

func AgentsView(letterorid string, lib *xmlmodels.Library) *AgentsListView {
	res := AgentsListView{Search: letterorid, Agents: make(map[string]AgentView)}
	av := make(map[string]bool)

	if len(letterorid) == 1 {
		// INFO: This is all persons beginning with a letter
		for _, a := range lib.Agents.Array {
			av[strings.ToUpper(a.ID[:1])] = true
			if strings.HasPrefix(a.ID, letterorid) {
				res.Sorted = append(res.Sorted, a.ID)
				res.Agents[a.ID] = AgentView{Agent: a}
			}
		}
	} else {
		// INFO: This is a specific person lookup by ID
		for _, a := range lib.Agents.Array {
			av[strings.ToUpper(a.ID[:1])] = true
			if a.ID == letterorid {
				res.Sorted = append(res.Sorted, a.ID)
				res.Agents[a.ID] = AgentView{Agent: a}
				break
			}
		}
	}

	for _, a := range res.Agents {
		if works, err := lib.Works.ReverseLookup(a); err == nil {
			for _, w := range works {
				if pieces, err := lib.Pieces.ReverseLookup(w.Item); err == nil {
					// INFO: it makes no sense to append works that have no pieces attached
					a.Works = append(a.Works, WorkByAgent{Resolved: w, Pieces: pieces})
				}
			}
		}

		if pieces, err := lib.Pieces.ReverseLookup(a.Agent); err == nil {
			a.Pieces = pieces
		}

		// TODO: sort the things, also for works and pieces above
		res.Agents[a.ID] = a
	}

	res.AvailableLetters = slices.Collect(maps.Keys(av))
	slices.Sort(res.AvailableLetters)
	slices.Sort(res.Sorted)

	return &res
}
