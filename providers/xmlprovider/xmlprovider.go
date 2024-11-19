package xmlprovider

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

type KGPZXML[T any] interface {
	Append(data T) T
	fmt.Stringer
}

type XMLProvider[T KGPZXML[T]] struct {
	mu    sync.Mutex
	paths []string
	Items T
}

type Library struct {
	Agents     *AgentProvider
	Places     *PlaceProvider
	Works      *WorkProvider
	Categories *CategoryProvider
	Issues     *IssueProvider
	Pieces     *PieceProvider
}

func NewLibrary(agentpaths, placepaths, workpaths, categorypaths, issuepaths, piecepaths []string) *Library {
	return &Library{
		Agents:     NewAgentProvider(agentpaths),
		Places:     NewPlaceProvider(placepaths),
		Works:      NewWorkProvider(workpaths),
		Categories: NewCategoryProvider(categorypaths),
		Issues:     NewIssueProvider(issuepaths),
		Pieces:     NewPieceProvider(piecepaths),
	}
}

func (l *Library) Serialize() {
	wg := sync.WaitGroup{}
	wg.Add(6)

	go func() {
		defer wg.Done()
		err := l.Agents.Serialize()
		if err != nil {
			l.Agents = nil
		}
	}()

	go func() {
		defer wg.Done()
		err := l.Places.Serialize()
		if err != nil {
			l.Places = nil
		}
	}()

	go func() {
		defer wg.Done()
		err := l.Works.Serialize()
		if err != nil {
			l.Works = nil
		}
	}()

	go func() {
		defer wg.Done()
		err := l.Categories.Serialize()
		if err != nil {
			l.Categories = nil
		}
	}()

	go func() {
		defer wg.Done()
		err := l.Issues.Serialize()
		if err != nil {
			l.Issues = nil
		}
	}()

	go func() {
		defer wg.Done()
		err := l.Pieces.Serialize()
		if err != nil {
			l.Pieces = nil
		}
	}()

	wg.Wait()
}

func (p *XMLProvider[T]) Serialize() error {
	// Introduce goroutine for every path, locking on append:
	var wg sync.WaitGroup
	for _, path := range p.paths {
		wg.Add(1)
		go func(path string) {
			defer wg.Done()
			var data T
			if err := UnmarshalFile(path, &data); err != nil {
				return
			}
			p.mu.Lock()
			defer p.mu.Unlock()
			p.Items = p.Items.Append(data)
		}(path)
	}
	wg.Wait()

	fmt.Println(p.Items)
	return nil
}

func (a *XMLProvider[T]) String() string {
	a.mu.Lock()
	defer a.mu.Unlock()
	return fmt.Sprintf("Items: %s", a.Items)
}

func UnmarshalFile[T any](filename string, data *T) error {
	xmlFile, err := os.Open(filename)
	if err != nil {
		logging.Error(err, "Could not deserialize file: "+filename)
		return err
	}
	defer xmlFile.Close()
	logging.Info("Deserialization: " + filename)
	byteValue, _ := io.ReadAll(xmlFile)
	xml.Unmarshal(byteValue, data)

	return nil
}
