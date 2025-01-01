package xmlprovider

// INFO: This is used to resolve references (back-links) between XML items.

import (
	"fmt"
	"sync"
)

type ReferenceResolver interface {
	GetReferences() map[string][]string
}

type Resolver[T XMLItem] struct {
	index map[string]map[string][]*T // Map[typeName][refID] -> []*T
	mu    sync.Mutex                 // Synchronization for thread safety
}

func NewResolver[T XMLItem]() *Resolver[T] {
	return &Resolver[T]{index: make(map[string]map[string][]*T)}
}

func (r *Resolver[T]) Add(typeName, refID string, item *T) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.index[typeName]; !exists {
		r.index[typeName] = make(map[string][]*T)
	}
	r.index[typeName][refID] = append(r.index[typeName][refID], item)
}

func (r *Resolver[T]) Get(typeName, refID string) ([]*T, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if typeIndex, exists := r.index[typeName]; exists {
		if items, ok := typeIndex[refID]; ok {
			return items, nil
		}
		return nil, fmt.Errorf("no references found for refID '%s' of type '%s'", refID, typeName)
	}
	return nil, fmt.Errorf("no index exists for type '%s'", typeName)
}
