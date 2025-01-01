package xmlmodels

import (
	"fmt"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

type Library struct {
	baseDir string

	Agents     *xmlprovider.XMLProvider[Agent]
	Places     *xmlprovider.XMLProvider[Place]
	Works      *xmlprovider.XMLProvider[Work]
	Categories *xmlprovider.XMLProvider[Category]
	Issues     *xmlprovider.XMLProvider[Issue]
	Pieces     *xmlprovider.XMLProvider[Piece]
}

func (l *Library) String() string {
	return fmt.Sprintf("Agents: %s\nPlaces: %s\nWorks: %s\nCategories: %s\nIssues: %s\nPieces: %s\n",
		l.Agents.String(), l.Places.String(), l.Works.String(), l.Categories.String(), l.Issues.String(), l.Pieces.String())
}

// INFO: this is the only place where the providers are created. There is no need for locking on access.
func NewLibrary(basedir string) *Library {
	return &Library{
		baseDir:    basedir,
		Agents:     &xmlprovider.XMLProvider[Agent]{},
		Places:     &xmlprovider.XMLProvider[Place]{},
		Works:      &xmlprovider.XMLProvider[Work]{},
		Categories: &xmlprovider.XMLProvider[Category]{},
		Issues:     &xmlprovider.XMLProvider[Issue]{},
		Pieces:     &xmlprovider.XMLProvider[Piece]{},
	}
}

func (l *Library) Serialize(commit string) {
	wg := sync.WaitGroup{}

	l.Prepare(commit)

	wg.Add(1)
	go func() {
		l.Places.Serialize(&PlaceRoot{}, filepath.Join(l.baseDir, PLACES_PATH))
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		l.Agents.Serialize(&AgentRoot{}, filepath.Join(l.baseDir, AGENTS_PATH))
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		l.Categories.Serialize(&CategoryRoot{}, filepath.Join(l.baseDir, CATEGORIES_PATH))
		wg.Done()
	}()

	wg.Add(1)
	go func() {
		l.Works.Serialize(&WorkRoot{}, filepath.Join(l.baseDir, WORKS_PATH))
		wg.Done()
	}()

	issuepaths, _ := xmlprovider.XMLFilesForPath(filepath.Join(l.baseDir, ISSUES_DIR))
	for _, path := range issuepaths {
		wg.Add(1)
		go func() {
			l.Issues.Serialize(&IssueRoot{}, path)
			wg.Done()
		}()
	}

	piecepaths, _ := xmlprovider.XMLFilesForPath(filepath.Join(l.baseDir, PIECES_DIR))
	for _, path := range piecepaths {
		wg.Add(1)
		go func() {
			l.Pieces.Serialize(&PieceRoot{}, path)
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
