package xmlmodels

import (
	"fmt"
	"path/filepath"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

type Library struct {
	mu sync.Mutex
	xmlprovider.Library

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
func NewLibrary() *Library {
	return &Library{
		Agents:     xmlprovider.NewXMLProvider[Agent](),
		Places:     xmlprovider.NewXMLProvider[Place](),
		Works:      xmlprovider.NewXMLProvider[Work](),
		Categories: xmlprovider.NewXMLProvider[Category](),
		Issues:     xmlprovider.NewXMLProvider[Issue](),
		Pieces:     xmlprovider.NewXMLProvider[Piece](),
	}
}

func (l *Library) Parse(source xmlprovider.ParseSource, baseDir, commit string) error {
	// INFO: this lock prevents multiple parses from happening at the same time.
	l.mu.Lock()
	defer l.mu.Unlock()

	if commit != "" {
		logging.Info("Parsing XML from commit: " + commit)
	} else {
		logging.Info("Parsing XML from directory: " + baseDir)
	}

	wg := sync.WaitGroup{}
	meta := xmlprovider.ParseMeta{
		Source:  source,
		BaseDir: baseDir,
		Commit:  commit,
		Date:    time.Now(),
	}
	metamu := sync.Mutex{}

	l.prepare()

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer func() {
			if r := recover(); r != nil {
				logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing places")
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, PLACES_PATH))
				metamu.Unlock()
			}
		}()
		err := l.Places.Serialize(&PlaceRoot{}, filepath.Join(meta.BaseDir, PLACES_PATH), meta)
		if err != nil {
			metamu.Lock()
			meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, PLACES_PATH))
			metamu.Unlock()
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer func() {
			if r := recover(); r != nil {
				logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing agents")
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, AGENTS_PATH))
				metamu.Unlock()
			}
		}()
		err := l.Agents.Serialize(&AgentRoot{}, filepath.Join(meta.BaseDir, AGENTS_PATH), meta)
		if err != nil {
			metamu.Lock()
			meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, AGENTS_PATH))
			metamu.Unlock()
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer func() {
			if r := recover(); r != nil {
				logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing categories")
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, CATEGORIES_PATH))
				metamu.Unlock()
			}
		}()
		err := l.Categories.Serialize(&CategoryRoot{}, filepath.Join(meta.BaseDir, CATEGORIES_PATH), meta)
		if err != nil {
			metamu.Lock()
			meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, CATEGORIES_PATH))
			metamu.Unlock()
		}
	}()

	wg.Add(1)
	go func() {
		defer wg.Done()
		defer func() {
			if r := recover(); r != nil {
				logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing works")
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, WORKS_PATH))
				metamu.Unlock()
			}
		}()
		err := l.Works.Serialize(&WorkRoot{}, filepath.Join(meta.BaseDir, WORKS_PATH), meta)
		if err != nil {
			metamu.Lock()
			meta.FailedPaths = append(meta.FailedPaths, filepath.Join(meta.BaseDir, WORKS_PATH))
			metamu.Unlock()
		}
	}()

	issuepaths, _ := xmlprovider.XMLFilesForPath(filepath.Join(meta.BaseDir, ISSUES_DIR))
	for _, path := range issuepaths {
		wg.Add(1)
		go func(p string) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing issue file")
					metamu.Lock()
					meta.FailedPaths = append(meta.FailedPaths, p)
					metamu.Unlock()
				}
			}()
			err := l.Issues.Serialize(&IssueRoot{}, p, meta)
			if err != nil {
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, p)
				metamu.Unlock()
			}
		}(path)
	}

	piecepaths, _ := xmlprovider.XMLFilesForPath(filepath.Join(meta.BaseDir, PIECES_DIR))
	for _, path := range piecepaths {
		wg.Add(1)
		go func(p string) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					logging.Error(fmt.Errorf("panic: %v\n%s", r, string(debug.Stack())), "panic while parsing piece file")
					metamu.Lock()
					meta.FailedPaths = append(meta.FailedPaths, p)
					metamu.Unlock()
				}
			}()
			err := l.Pieces.Serialize(&PieceRoot{}, p, meta)
			if err != nil {
				metamu.Lock()
				meta.FailedPaths = append(meta.FailedPaths, p)
				metamu.Unlock()
			}
		}(path)
	}

	wg.Wait()

	l.cleanup(meta)
	l.Parses = append(l.Parses, meta)

	// Log parsing statistics
	logging.Info(fmt.Sprintf("Parse complete: %d agents, %d places, %d works, %d categories, %d issues, %d pieces",
		len(l.Agents.Array), len(l.Places.Array), len(l.Works.Array),
		len(l.Categories.Array), len(l.Issues.Array), len(l.Pieces.Array)))

	var errors []string
	if len(meta.FailedPaths) > 0 {
		errors = append(errors, fmt.Sprintf("Failed paths: %v", meta.FailedPaths))
	}
	if len(errors) > 0 {
		return fmt.Errorf("Parsing encountered errors: %v", strings.Join(errors, "; "))
	}
	return nil
}

func (l *Library) prepare() {
	l.Agents.Prepare()
	l.Places.Prepare()
	l.Works.Prepare()
	l.Categories.Prepare()
	l.Issues.Prepare()
	l.Pieces.Prepare()
}

func (l *Library) cleanup(meta xmlprovider.ParseMeta) {
	wg := sync.WaitGroup{}
	wg.Add(6)

	go func() {
		l.Agents.Cleanup(meta)
		wg.Done()
	}()

	go func() {
		l.Places.Cleanup(meta)
		wg.Done()
	}()

	go func() {
		l.Works.Cleanup(meta)
		wg.Done()
	}()

	go func() {
		l.Categories.Cleanup(meta)
		wg.Done()
	}()

	go func() {
		l.Issues.Cleanup(meta)
		wg.Done()
	}()

	go func() {
		l.Pieces.Cleanup(meta)
		wg.Done()
	}()

	wg.Wait()
}
