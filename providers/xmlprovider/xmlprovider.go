package xmlprovider

import (
	"encoding/xml"
	"fmt"
	"io"
	"os"
	"slices"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

type ParseMeta struct {
	Commit string
	Date   time.Time
}

type XMLItem interface {
	fmt.Stringer
	GetIDs() []string
}

type Collection[T XMLItem] struct {
	Collection []T
	lock       sync.Mutex
}

// An XMLProvider is a struct that holds holds serialized XML data of a specific type. It combines multiple parses IF a succeeded parse can not serialize the data from a path.
type XMLProvider[T XMLItem] struct {
	Paths []string
	// INFO: map is type [string]T
	Items sync.Map
	// INFO: map is type [string]ItemInfo
	// It keeps information about parsing status of the items.
	Infos sync.Map

	mu     sync.Mutex
	failed []string
	parses []ParseMeta
}

// INFO: To parse sth, we call Prepare, then Serialize, then Cleanup.
// Serialize can be called concurretly.
func (p *XMLProvider[T]) Prepare(commit string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.failed = make([]string, 0)
	p.parses = append(p.parses, ParseMeta{Commit: commit, Date: time.Now()})
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path string) error {
	if len(p.parses) == 0 {
		logging.Error(fmt.Errorf("No commit set"), "No commit set")
		return fmt.Errorf("No commit set")
	}

	p.mu.Lock()
	commit := &p.parses[len(p.parses)-1]
	p.mu.Unlock()

	// Introduce goroutine for every path, locking on append:
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		logging.ParseMessages.LogError(logging.Unknown, path, "", "Could not unmarshal file.")
		p.mu.Lock()
		defer p.mu.Unlock()
		p.failed = append(p.failed, path)
		return err
	}

	for _, item := range dataholder.Children() {
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.GetIDs() {
			p.Infos.Store(id, ItemInfo{Source: path, Parse: commit})
			p.Items.Store(id, item)
		}
	}

	return nil
}

func (p *XMLProvider[T]) Cleanup() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if len(p.parses) == 0 {
		logging.Error(fmt.Errorf("Trying to cleanup an empty XMLProvider."))
		return
	}

	lastcommit := &p.parses[len(p.parses)-1]
	todelete := make([]string, 0)
	p.Infos.Range(func(key, value interface{}) bool {
		info := value.(ItemInfo)
		if info.Parse != lastcommit {
			if !slices.Contains(p.failed, info.Source) {
				todelete = append(todelete, key.(string))
			}
		}
		return true
	})

	for _, key := range todelete {
		p.Infos.Delete(key)
		p.Items.Delete(key)
	}
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
// Maps are slow to iterate, but many of the Iterations can only be done once, so it doesn´t matter for a
// few thousand objects. We prefer to lookup objects by key and have multiple meaningful keys; along with
// sensible caching rules to keep the application responsive.
func (p *XMLProvider[T]) Everything() []T {
	var items []T
	p.Items.Range(func(key, value interface{}) bool {
		items = append(items, value.(T))
		return true
	})
	return items
}
