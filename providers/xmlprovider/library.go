package xmlprovider

import (
	"fmt"
	"sync"
)

type Library struct {
	amu        sync.Mutex
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

// INFO: this is the only place where the providers are created. There is no need for locking on access.
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
	l.amu.Lock()
	defer l.amu.Unlock()
	l.Agents.Paths = agentpaths
	l.Places.Paths = placepaths
	l.Works.Paths = workpaths
	l.Categories.Paths = categorypaths
	l.Issues.Paths = issuepaths
	l.Pieces.Paths = piecepaths
}

func (l *Library) Serialize(commit string) {
	wg := sync.WaitGroup{}

	l.Prepare(commit)

	for _, path := range l.Places.Paths {
		wg.Add(1)
		go func() {
			l.Places.Serialize(NewPlaceRoot(), path)
			wg.Done()
		}()
	}

	for _, path := range l.Agents.Paths {
		wg.Add(1)
		go func() {
			l.Agents.Serialize(NewAgentRoot(), path)
			wg.Done()
		}()
	}

	for _, path := range l.Categories.Paths {
		wg.Add(1)
		go func() {
			l.Categories.Serialize(NewCategoryRoot(), path)
			wg.Done()
		}()
	}

	for _, path := range l.Works.Paths {
		wg.Add(1)
		go func() {
			l.Works.Serialize(NewWorkRoot(), path)
			wg.Done()
		}()
	}

	for _, path := range l.Issues.Paths {
		wg.Add(1)
		go func() {
			l.Issues.Serialize(NewIssueRoot(), path)
			wg.Done()
		}()
	}

	for _, path := range l.Pieces.Paths {
		wg.Add(1)
		go func() {
			l.Pieces.Serialize(NewPieceRoot(), path)
			wg.Done()
		}()
	}

	wg.Wait()
	l.Cleanup()
}

func (l *Library) Prepare(commit string) {
	l.Agents.Prepare(commit)
	l.Places.Prepare(commit)
	l.Works.Prepare(commit)
	l.Categories.Prepare(commit)
	l.Issues.Prepare(commit)
	l.Pieces.Prepare(commit)
}

func (l *Library) Cleanup() {
	wg := sync.WaitGroup{}
	wg.Add(6)

	go func() {
		l.Agents.Cleanup()
		wg.Done()
	}()

	go func() {
		l.Places.Cleanup()
		wg.Done()
	}()

	go func() {
		l.Works.Cleanup()
		wg.Done()
	}()

	go func() {
		l.Categories.Cleanup()
		wg.Done()
	}()

	go func() {
		l.Issues.Cleanup()
		wg.Done()
	}()

	go func() {
		l.Pieces.Cleanup()
		wg.Done()
	}()

	wg.Wait()
}
