package xmlprovider

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

type XMLItem interface {
	fmt.Stringer
	GetIDs() []string
}

type XMLProvider[T XMLItem] struct {
	Paths []string
	Items sync.Map

	mu sync.Mutex
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

func (l *Library) Serialize() {
	wg := sync.WaitGroup{}
	wg.Add(6)

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Places.Paths {
			lwg.Add(1)
			go l.Places.Serialize(NewPlaceRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Agents.Paths {
			lwg.Add(1)
			go l.Agents.Serialize(NewAgentRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Categories.Paths {
			lwg.Add(1)
			go l.Categories.Serialize(NewCategoryRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Works.Paths {
			lwg.Add(1)
			go l.Works.Serialize(NewWorkRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Issues.Paths {
			lwg.Add(1)
			go l.Issues.Serialize(NewIssueRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	go func() {
		defer wg.Done()
		lwg := sync.WaitGroup{}
		for _, path := range l.Pieces.Paths {
			lwg.Add(1)
			go l.Pieces.Serialize(NewPieceRoot(), path, &lwg)
		}
		lwg.Wait()
	}()

	wg.Wait()
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path string, wg *sync.WaitGroup) error {
	// Introduce goroutine for every path, locking on append:
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		return err
	}
	for _, item := range dataholder.Children() {
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.GetIDs() {
			p.Items.Store(id, item)
		}
	}

	if wg != nil {
		wg.Done()
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

func (p *XMLProvider[T]) All() []T {
	var items []T
	p.Items.Range(func(key, value interface{}) bool {
		items = append(items, value.(T))
		return true
	})
	return items
}
