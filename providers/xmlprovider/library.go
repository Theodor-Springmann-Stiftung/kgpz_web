package xmlprovider

import (
	"fmt"
	"sync"
)

type Library struct {
	Agents     *XMLProvider[Agent]
	Places     *XMLProvider[Place]
	Works      *XMLProvider[Work]
	Categories *XMLProvider[Category]
	Issues     *XMLProvider[Issue]
	Pieces     *XMLProvider[Piece]
}

func (l *Library) String() string {
	return fmt.Sprintf("Agents: %s\nPlaces: %s\nWorks: %s\nCategories: %s\nIssues: %s\nPieces: %s\n",
		l.Agents.String(), l.Places.String(), l.Works.String(), l.Categories.String(), l.Issues.String(), l.Pieces.String())
}

func NewLibrary(agentpaths, placepaths, workpaths, categorypaths, issuepaths, piecepaths []string) *Library {
	return &Library{
		Agents:     &XMLProvider[Agent]{Paths: agentpaths},
		Places:     &XMLProvider[Place]{Paths: placepaths},
		Works:      &XMLProvider[Work]{Paths: workpaths},
		Categories: &XMLProvider[Category]{Paths: categorypaths},
		Issues:     &XMLProvider[Issue]{Paths: issuepaths},
		Pieces:     &XMLProvider[Piece]{Paths: piecepaths},
	}
}

func (l *Library) SetPaths(agentpaths, placepaths, workpaths, categorypaths, issuepaths, piecepaths []string) {
	l.Agents.Paths = agentpaths
	l.Places.Paths = placepaths
	l.Works.Paths = workpaths
	l.Categories.Paths = categorypaths
	l.Issues.Paths = issuepaths
	l.Pieces.Paths = piecepaths
}

func (l *Library) Serialize(commit string) {
	wg := sync.WaitGroup{}

	l.Prepare()

	for _, path := range l.Places.Paths {
		wg.Add(1)
		go func() {
			l.Places.Serialize(NewPlaceRoot(), path, commit)
			wg.Done()
		}()
	}

	for _, path := range l.Agents.Paths {
		wg.Add(1)
		go func() {
			l.Agents.Serialize(NewAgentRoot(), path, commit)
			wg.Done()
		}()
	}

	for _, path := range l.Categories.Paths {
		wg.Add(1)
		go func() {
			l.Categories.Serialize(NewCategoryRoot(), path, commit)
			wg.Done()
		}()
	}

	for _, path := range l.Works.Paths {
		wg.Add(1)
		go func() {
			l.Works.Serialize(NewWorkRoot(), path, commit)
			wg.Done()
		}()
	}

	for _, path := range l.Issues.Paths {
		wg.Add(1)
		go func() {
			l.Issues.Serialize(NewIssueRoot(), path, commit)
			wg.Done()
		}()
	}

	for _, path := range l.Pieces.Paths {
		wg.Add(1)
		go func() {
			l.Pieces.Serialize(NewPieceRoot(), path, commit)
			wg.Done()
		}()
	}

	wg.Wait()

	go func() {
		l.Cleanup(commit)
	}()
}

// TODO: Prepare resets the list of failed parses for a new parse.
// We need to set the logs accordingly.
func (l *Library) Prepare() {
	l.Agents.Prepare()
	l.Places.Prepare()
	l.Works.Prepare()
	l.Categories.Prepare()
	l.Issues.Prepare()
	l.Pieces.Prepare()
}

func (l *Library) Cleanup(commit string) {
	l.Agents.Cleanup(commit)
	l.Places.Cleanup(commit)
	l.Works.Cleanup(commit)
	l.Categories.Cleanup(commit)
	l.Issues.Cleanup(commit)
	l.Pieces.Cleanup(commit)
}
