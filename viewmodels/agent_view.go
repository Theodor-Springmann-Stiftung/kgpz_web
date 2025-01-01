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
	Agents           map[string]AgentView
	Sorted           []string
}

type AgentView struct {
	xmlmodels.Agent
	Works  []WorkByAgent
	Pieces []PieceByAgent
}

type WorkByAgent struct {
	xmlmodels.Work
	Pieces    []PieceByWork
	Reference xmlmodels.AgentRef
}

type PieceByAgent struct {
	xmlmodels.Piece
	Reference xmlmodels.AgentRef
}

type PieceByWork struct {
	xmlmodels.Piece
	Reference xmlmodels.WorkRef
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

	// TODO: We won't need to lock the library if we take down the server during parsing
	lib.Works.Lock()
	for _, w := range lib.Works.Array {
		if ref, ok := w.ReferencesAgent(letterorid); ok {
			if entry, ok := res.Agents[ref.Ref]; ok {
				entry.Works = append(entry.Works, WorkByAgent{Work: w, Reference: *ref})
				res.Agents[ref.Ref] = entry
			}
		}
	}
	lib.Works.Unlock()

	lib.Pieces.Lock()
	for _, p := range lib.Pieces.Array {
		if ref, ok := p.ReferencesAgent(letterorid); ok {
			if entry, ok := res.Agents[ref.Ref]; ok {
				entry.Pieces = append(entry.Pieces, PieceByAgent{Piece: p, Reference: *ref})
				res.Agents[ref.Ref] = entry
			}
		}

		// PERF: This is really slow: resolve all backlinks after parse?
		for _, a := range res.Agents {
			for _, w := range a.Works {
				if ref, ok := p.ReferencesWork(w.ID); ok {
					w.Pieces = append(w.Pieces, PieceByWork{Piece: p, Reference: *ref})
				}
			}
		}
	}
	lib.Pieces.Unlock()

	res.AvailableLetters = slices.Collect(maps.Keys(av))
	slices.Sort(res.AvailableLetters)
	slices.Sort(res.Sorted)

	return &res
}
