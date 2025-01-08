package xmlprovider

import "sync"

type Library struct {
	pmux   sync.Mutex
	Parses []ParseMeta
}

func (l *Library) Latest() ParseMeta {
	if len(l.Parses) == 0 {
		return ParseMeta{}
	}
	return l.Parses[len(l.Parses)-1]
}
