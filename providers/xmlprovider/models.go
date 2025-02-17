package xmlprovider

import "fmt"

type IXMLItem interface {
	fmt.Stringer
	// INFO:
	// - Keys should be unique
	// - Keys[0] has the special meaning of the primary key (for FTS etc.)
	Keys() []string
	Type() string
}

type ILibrary interface {
	Parse(meta ParseMeta) error
}

type ResolvingMap[T IXMLItem] map[string][]Resolved[T]

type ReferenceResolver[T IXMLItem] interface {
	References() ResolvingMap[T]
}

type Resolved[T IXMLItem] struct {
	Item       *T
	Reference  string
	Category   string
	Cert       bool
	Conjecture bool
	Comment    string
	MetaData   map[string]string
}
