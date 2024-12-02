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

type XMLItem interface {
	fmt.Stringer
	GetIDs() []string
}

type Collection[T XMLItem] struct {
	Collection []T
	lock       sync.Mutex
}

type XMLProvider[T XMLItem] struct {
	Paths []string
	// INFO: map is type [string]T
	Items sync.Map
	// INFO: map is type [string]ItemInfo
	// It keeps information about parsing status of the items.
	Infos sync.Map

	mu     sync.Mutex
	failed []string
}

func (p *XMLProvider[T]) Prepare() {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.failed = make([]string, 0)
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path, commit string) error {
	date := time.Now().Format("2006-01-02")
	// Introduce goroutine for every path, locking on append:
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		logging.ParseMessages.ParseErrors <- logging.ParseMessage{MessageType: logging.ErrorMessage, Message: "Could not unmarshal file: " + path}
		p.mu.Lock()
		defer p.mu.Unlock()
		p.failed = append(p.failed, path)
		return err
	}

	for _, item := range dataholder.Children() {
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.GetIDs() {
			p.Infos.Store(id, ItemInfo{Source: path, Date: date, Commit: commit})
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

// TODO: how to find that the item was deleted, and couldn't just be serialized?
// -> We compare filepaths of failed serializations with filepaths of the items.
//   - If the item is not in the failed serializations, it was deleted.
//   - If the item is in the failed serializations, we don't know if it was deleted or not, and we keep it.
//
// Consequence: If all serializations completed, we cleanup everything.
func (p *XMLProvider[T]) Cleanup(commit string) {
	todelete := make([]string, 0)
	p.Infos.Range(func(key, value interface{}) bool {
		info := value.(ItemInfo)
		if info.Commit != commit {
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
