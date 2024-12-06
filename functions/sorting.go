package functions

import (
	"golang.org/x/text/collate"
	"golang.org/x/text/language"
)

func Sort(s []string) []string {
	c := collate.New(language.German, collate.IgnoreCase)
	c.SortStrings(s)
	return s
}
