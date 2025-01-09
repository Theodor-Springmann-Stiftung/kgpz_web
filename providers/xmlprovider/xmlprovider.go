package xmlprovider

import (
	"slices"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
)

type ParseSource int

const (
	Unknown ParseSource = iota
	Path
	Commit
)

type ParseMeta struct {
	Source  ParseSource
	BaseDir string
	Commit  string
	Date    time.Time

	FailedPaths []string
}

func (p ParseMeta) Equals(other ParseMeta) bool {
	return p.Source == other.Source && p.BaseDir == other.BaseDir && p.Commit == other.Commit && p.Date == other.Date
}

func (p ParseMeta) Failed(path string) bool {
	return slices.Contains(p.FailedPaths, path)
}

// An XMLProvider is a struct that holds holds serialized XML data of a specific type. It combines multiple parses IF a succeeded parse can not serialize the data from a path.
type XMLProvider[T XMLItem] struct {
	// INFO: map is type map[string]*T
	Items sync.Map
	// INFO: map is type [string]ItemInfo
	// It keeps information about parsing status of the items.
	Infos sync.Map

	// INFO: Resolver is used to resolve references (back-links) between XML items.
	Resolver Resolver[T]

	mu sync.RWMutex
	// TODO: This array is meant to be for iteration purposes, since iteration over the sync.Map is slow.
	// It is best for this array to be sorted by key of the corresponding item.
	Array []T
}

func NewXMLProvider[T XMLItem]() *XMLProvider[T] {
	return &XMLProvider[T]{Resolver: *NewResolver[T]()}
}

// INFO: To parse sth, we call Prepare, then Serialize, then Cleanup.
// Prepare & Cleanup are called once per parse. Serialize is called for every path.
// and can be called concurretly.
func (p *XMLProvider[T]) Prepare() {
	p.mu.Lock()
	defer p.mu.Unlock()
	// INFO: We take 1000 here as to not reallocate the memory as mutch.
	p.Array = make([]T, 0, 1000)
	p.Resolver.Clear()
}

func (p *XMLProvider[T]) Serialize(dataholder XMLRootElement[T], path string, latest ParseMeta) error {
	if err := UnmarshalFile(path, dataholder); err != nil {
		logging.Error(err, "Could not unmarshal file: "+path)
		logging.ParseMessages.LogError(logging.Unknown, path, "", "Could not unmarshal file.")
		return err
	}

	p.mu.Lock()
	defer p.mu.Unlock()
	newItems := dataholder.Children()

	for _, item := range newItems {
		// INFO: Mostly it's just one ID, so the double loop is not that bad.
		for _, id := range item.Keys() {
			p.Infos.Store(id, ItemInfo{Source: path, Parse: latest})
			p.Items.Store(id, &item)
		}

		p.addResolvable(item)
	}

	p.Array = append(p.Array, newItems...)
	return nil
}

// INFO: Cleanup is called after all paths have been serialized.
// It deletes all items that have not been parsed in the last commit,
// and whose filepath has not been marked as failed.
func (p *XMLProvider[T]) Cleanup(latest ParseMeta) {
	p.mu.Lock()
	defer p.mu.Unlock()

	todelete := make([]string, 0)
	toappend := make([]*T, 0)
	p.Infos.Range(func(key, value interface{}) bool {
		info := value.(ItemInfo)
		if !info.Parse.Equals(latest) {
			if !latest.Failed(info.Source) {
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
		p.addResolvable(*item)
	}
}

func (p *XMLProvider[T]) addResolvable(item T) {
	// INFO: If the item has a GetReferences method, we add the references to the resolver.
	if rr, ok := any(item).(ReferenceResolver[T]); ok {
		for name, ids := range rr.References() {
			for _, res := range ids {
				res.Item = &item
				p.Resolver.Add(name, res.Reference, res)
			}
		}
	}
}

func (p *XMLProvider[T]) ReverseLookup(item XMLItem) []Resolved[T] {
	// INFO: this runs just once for the first key
	ret := make([]Resolved[T], 0)
	keys := item.Keys()

	for _, key := range keys {
		r, err := p.Resolver.Get(item.Name(), key)
		if err == nil {
			ret = append(ret, r...)
		}
	}

	return ret
}

func (a *XMLProvider[T]) String() string {
	var s string
	for _, item := range a.Array {
		s += item.String()
	}
	return s
}

func (p *XMLProvider[T]) Info(id string) ItemInfo {
	info, ok := p.Infos.Load(id)
	if !ok {
		return ItemInfo{}
	}
	return info.(ItemInfo)
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
	p.mu.RLock()
	defer p.mu.RUnlock()
	var items []T
	for _, item := range p.Array {
		if fn(&item) {
			items = append(items, item)
		}
	}
	return items
}

// INFO: These are only reading locks.
func (p *XMLProvider[T]) Lock() {
	p.mu.RLock()
}

func (p *XMLProvider[T]) Unlock() {
	p.mu.RUnlock()
}
