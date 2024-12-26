package xmlprovider

import (
	"fmt"
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
	Keys() []string
}

// An XMLProvider is a struct that holds holds serialized XML data of a specific type. It combines multiple parses IF a succeeded parse can not serialize the data from a path.
type XMLProvider[T XMLItem] struct {
	Paths []string
	// INFO: map is type map[string]*T
	Items sync.Map
	// INFO: map is type [string]ItemInfo
	// It keeps information about parsing status of the items.
	Infos sync.Map

	mu sync.Mutex
	// TODO: This array is meant to be for iteration purposes, since iteration over the sync.Map is slow.
	// It is best for this array to be sorted by key of the corresponding item.
	Array    []T
	Previous []T
	failed   []string
	parses   []ParseMeta
}

// INFO: To parse sth, we call Prepare, then Serialize, then Cleanup.
// Prepare & Cleanup are called once per parse. Serialize is called for every path.
// and can be called concurretly.
func (p *XMLProvider[T]) Prepare(commit string) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.Previous = p.Array
	p.Array = make([]T, len(p.Previous))
	p.failed = make([]string, 0)
	p.parses = append(p.parses, ParseMeta{Commit: commit, Date: time.Now()})
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path string) error {
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		logging.ParseMessages.LogError(logging.Unknown, path, "", "Could not unmarshal file.")
		p.mu.Lock()
		defer p.mu.Unlock()
		p.failed = append(p.failed, path)
		return err
	}

	p.mu.Lock()
	if len(p.parses) == 0 {
		logging.Error(fmt.Errorf("No commit set"), "No commit set")
		return fmt.Errorf("No commit set")
	}
	commit := &p.parses[len(p.parses)-1]
	p.Array = append(p.Array, dataholder.Children()...)
	p.mu.Unlock()

	for _, item := range dataholder.Children() {
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.Keys() {
			p.Infos.Store(id, ItemInfo{Source: path, Parse: commit})
			p.Items.Store(id, &item)
		}
	}

	return nil
}

// INFO: Cleanup is called after all paths have been serialized.
// It deletes all items that have not been parsed in the last commit,
// and whose filepath has not been marked as failed.
func (p *XMLProvider[T]) Cleanup() {
	p.mu.Lock()
	defer p.mu.Unlock()

	if len(p.parses) == 0 {
		logging.Error(fmt.Errorf("Trying to cleanup an empty XMLProvider."))
		return
	}

	lastcommit := &p.parses[len(p.parses)-1]
	todelete := make([]string, 0)
	toappend := make([]*T, 0)
	p.Infos.Range(func(key, value interface{}) bool {
		info := value.(ItemInfo)
		if info.Parse != lastcommit {
			if !slices.Contains(p.failed, info.Source) {
				todelete = append(todelete, key.(string))
			} else {
				item, ok := p.Items.Load(key)
				if ok {
					i := item.(*T)
					if !slices.Contains(toappend, i) {
						toappend = append(toappend, i)
					}
				}
			}
		}
		return true
	})

	for _, key := range todelete {
		p.Infos.Delete(key)
		p.Items.Delete(key)
	}

	for _, item := range toappend {
		p.Array = append(p.Array, *item)
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

func (p *XMLProvider[T]) Item(id string) *T {
	item, ok := p.Items.Load(id)
	if !ok {
		return nil
	}

	i := item.(*T)
	return i
}

func (p *XMLProvider[T]) Find(fn func(*T) bool) []T {
	p.mu.Lock()
	defer p.mu.Unlock()
	var items []T
	for _, item := range p.Array {
		if fn(&item) {
			items = append(items, item)
		}
	}
	return items
}

func (p *XMLProvider[T]) Lock() {
	p.mu.Lock()
}

func (p *XMLProvider[T]) Unlock() {
	p.mu.Unlock()
}
