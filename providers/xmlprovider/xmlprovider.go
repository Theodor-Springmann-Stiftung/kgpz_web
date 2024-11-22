package xmlprovider

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

type XMLItem interface {
	fmt.Stringer
	GetIDs() []string
	SetSource(string)
	SetDate(string)
	SetCommit(string)
}

type Collection[T XMLItem] struct {
	Collection []T
	lock       sync.Mutex
}

type XMLProvider[T XMLItem] struct {
	Paths []string
	// INFO: map is type [string]T
	Items sync.Map
}

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
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path, commit string) error {
	date := time.Now().Format("2006-01-02")
	// Introduce goroutine for every path, locking on append:
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		logging.ParseMessages.ParseErrors <- logging.ParseMessage{MessageType: logging.ErrorMessage, Message: "Could not unmarshal file: " + path}
		return err
	}
	for _, item := range dataholder.Children() {
		item.SetSource(path)
		item.SetDate(date)
		item.SetCommit(commit)
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.GetIDs() {
			p.Items.Store(id, item)
		}
	}

	return nil
}

func (a *XMLProvider[T]) String() string {
	var s string
	a.Items.Range(func(key, value interface{}) bool {
		v := value.(T)
		s += v.String()
		return true
	})
	return s
}

func UnmarshalFile[T any](filename string, data T) error {
	xmlFile, err := os.Open(filename)
	if err != nil {
		logging.Error(err, "Could not open file: "+filename)
		return err
	}
	defer xmlFile.Close()

	logging.Info("Deserialization: " + filename)
	byteValue, err := io.ReadAll(xmlFile)
	if err != nil {
		logging.Error(err, "Could not read file: "+filename)
		return err
	}
	err = xml.Unmarshal(byteValue, &data)

	if err != nil {
		logging.Error(err, "Could not unmarshal file: "+filename)
		return err
	}
	return nil
}

func (p *XMLProvider[T]) Item(id string) *T {
	item, ok := p.Items.Load(id)
	if !ok {
		return nil
	}

	i := item.(T)
	return &i
}

func (p *XMLProvider[T]) Find(fn func(T) bool) []T {
	var items []T
	p.Items.Range(func(key, value interface{}) bool {
		if fn(value.(T)) {
			items = append(items, value.(T))
		}
		return true
	})
	return items
}

func (p *XMLProvider[T]) FindKey(fn func(string) bool) []T {
	var items []T
	p.Items.Range(func(key, value interface{}) bool {
		if fn(key.(string)) {
			items = append(items, value.(T))
		}
		return true
	})
	return items
}

// INFO: Do not use this, except when iterating over a collection multiple times (three times or more).
// Maps are slow to iterate, but many of the Iterations can only be done once.
func (p *XMLProvider[T]) Everything() []T {
	var items []T
	p.Items.Range(func(key, value interface{}) bool {
		items = append(items, value.(T))
		return true
	})
	return items
}
