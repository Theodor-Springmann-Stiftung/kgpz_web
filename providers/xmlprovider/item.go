package xmlprovider

type ItemInfo struct {
	Source string
	Parse  ParseMeta
}

// INFO: These are just root elements that hold the data of the XML files.
// They get discarded after a parse.
type XMLRootElement[T any] interface {
	Children() []T
}
