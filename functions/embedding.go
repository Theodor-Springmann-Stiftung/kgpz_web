package functions

import (
	"html/template"
	"io"
	"io/fs"
	"sync"
)

var embed_cache sync.Map

// INFO: We initialize the cache in both functions, which is only valid if both of these get
// called in the same context, eg. when creating a template engine.
func EmbedSafe(fs fs.FS) func(string) template.HTML {
	embed_cache.Clear()
	return func(path string) template.HTML {
		val, err := getFileData(fs, path)
		if err != nil {
			return template.HTML("")
		}

		return template.HTML(val)
	}
}

func Embed(fs fs.FS) func(string) string {
	embed_cache.Clear()
	return func(path string) string {
		val, err := getFileData(fs, path)
		if err != nil {
			return ""
		}

		return string(val)
	}
}

func getFileData(fs fs.FS, path string) ([]byte, error) {
	if val, ok := embed_cache.Load(path); ok {
		return val.([]byte), nil
	}

	f, err := fs.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}

	embed_cache.Store(path, data)
	return data, nil
}
