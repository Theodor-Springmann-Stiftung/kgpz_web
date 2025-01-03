package xmlprovider

import "fmt"

type XMLItem interface {
	fmt.Stringer
	Keys() []string
	Name() string
}

type ILibrary interface {
	Parse(meta ParseMeta) error
}

type ResolvingMap[T XMLItem] map[string][]Resolved[T]

type ReferenceResolver[T XMLItem] interface {
	References() ResolvingMap[T]
}

type Resolved[T XMLItem] struct {
	Item       *T
	Reference  string
	Category   string
	Cert       bool
	Conjecture bool
	Comment    string
	MetaData   map[string]string
}
