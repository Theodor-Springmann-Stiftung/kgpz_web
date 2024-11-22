package xmlprovider

type SerializedItem struct {
	Source string
	Date   string
	Commit string
}

func (si SerializedItem) SetSource(s string) {
	si.Source = s
}

func (si SerializedItem) SetDate(d string) {
	si.Date = d
}

func (si SerializedItem) SetCommit(c string) {
	si.Commit = c
}
