package functions

import (
	"html/template"
	"io"
	"io/fs"
)

// TODO: this needs to be cached, FS reads are expensive
func EmbedSafe(fs fs.FS) func(string) template.HTML {
	return func(path string) template.HTML {
		f, err := fs.Open(path)
		if err != nil {
			return ""
		}

		defer f.Close()
		data, err := io.ReadAll(f)
		if err != nil {
			return ""
		}

		return template.HTML(data)
	}
}
