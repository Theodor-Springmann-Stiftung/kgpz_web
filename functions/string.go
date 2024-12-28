package functions

import "html/template"

func FirstLetter(s string) string {
	if len(s) == 0 {
		return ""
	}
	return string(s[:1])
}

func Safe(s string) template.HTML {
	if len(s) == 0 {
		return ""
	}
	return template.HTML(s)
}
