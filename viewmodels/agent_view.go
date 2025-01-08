package viewmodels

import (
	"maps"
	"slices"
	"strings"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
)

type AgentsListView struct {
	Search           string
	AvailableLetters []string
	Agents           map[string]xmlmodels.Agent
	Sorted           []string
}

func AgentsView(letterorid string, lib *xmlmodels.Library) *AgentsListView {
	res := AgentsListView{Search: letterorid, Agents: make(map[string]xmlmodels.Agent)}
	av := make(map[string]bool)

	if len(letterorid) == 1 {
		// INFO: This is all persons beginning with a letter
		for _, a := range lib.Agents.Array {
			av[strings.ToUpper(a.ID[:1])] = true
			if strings.HasPrefix(a.ID, letterorid) {
				res.Sorted = append(res.Sorted, a.ID)
				res.Agents[a.ID] = a
			}
		}
	} else {
		// INFO: This is a specific person lookup by ID
		for _, a := range lib.Agents.Array {
			av[strings.ToUpper(a.ID[:1])] = true
			if a.ID == letterorid {
				res.Sorted = append(res.Sorted, a.ID)
				res.Agents[a.ID] = a
				break
			}
		}
	}

	res.AvailableLetters = slices.Collect(maps.Keys(av))
	slices.Sort(res.AvailableLetters)
	slices.Sort(res.Sorted)

	return &res
}
