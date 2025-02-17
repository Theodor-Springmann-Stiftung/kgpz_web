package datatypes

import (
	"regexp"
	"strings"
	"unicode"
)

var html_regexp = regexp.MustCompile(`<[^>]+>`)
var ws_regexp = regexp.MustCompile(`\s+`)

func DeleteTags(s string) string {
	return html_regexp.ReplaceAllString(s, "")
}

func NormalizeString(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "<div>", "")
	s = strings.ReplaceAll(s, "</div>", "")
	return s
}

func SliceJoin[T any](slice []T, join string, f func(T) string) string {
	var result []string
	for _, item := range slice {
		ap := f(item)
		if ap != "" {
			result = append(result, ap)
		}
	}
	return strings.Join(result, join)
}

func RemovePunctuation(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsPunct(r) {
			return -1
		}
		return r
	}, s)
}

func NormalizeWhitespace(s string) string {
	return strings.TrimSpace(ws_regexp.ReplaceAllString(s, " "))
}
