package xmlprovider

type ItemInfo struct {
	Source string
	Parse  *ParseMeta
}

type KeyedItem struct {
	keys []string
}
