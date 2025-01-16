package functions

import (
	"html/template"
	"io"
	"io/fs"
	"path/filepath"
	"strings"
	"sync"
)

type Embedder struct {
	embed_cache sync.Map
	fs          fs.FS
}

func NewEmbedder(fs fs.FS) *Embedder {
	return &Embedder{
		fs:          fs,
		embed_cache: sync.Map{},
	}
}

// INFO: We initialize the cache in both functions, which is only valid if both of these get
// called in the same context, eg. when creating a template engine.
func (e *Embedder) EmbedSafe() func(string) template.HTML {
	return func(path string) template.HTML {
		path = strings.TrimSpace(path)
		path = filepath.Clean(path)
		val, err := e.getFileData(path)
		if err != nil {
			return template.HTML("")
		}

		return template.HTML(val)
	}
}

func (e *Embedder) Embed() func(string) string {
	return func(path string) string {
		path = strings.TrimSpace(path)
		path = filepath.Clean(path)
		val, err := e.getFileData(path)
		if err != nil {
			return ""
		}

		return string(val)
	}
}

func (e *Embedder) getFileData(path string) ([]byte, error) {
	if val, ok := e.embed_cache.Load(path); ok {
		return val.([]byte), nil
	}

	f, err := e.fs.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	data, err := io.ReadAll(f)
	if err != nil {
		return nil, err
	}

	e.embed_cache.Store(path, data)
	return data, nil
}

func (e *Embedder) EmbedXSLT() func(string) template.HTML {
	return func(path string) template.HTML {
		path = strings.TrimSpace(path)
		path = filepath.Clean(path)
		fn := filepath.Base(path)
		ext := filepath.Ext(fn)
		fn = fn[:len(fn)-len(ext)]

		if (ext != ".xsl" && ext != ".xslt") || ext == "" || fn == "" {
			return template.HTML("[ERROR: " + "file is not an XSLT file" + "]")
		}

		val, err := e.getFileData(path)
		if err != nil {
			return template.HTML("[ERROR: " + err.Error() + "]")
		}

		src := "<script id=\"" + fn + "\" type=\"application/xml\">\n" + string(val) + "\n</script>"

		return template.HTML(src)
	}
}
