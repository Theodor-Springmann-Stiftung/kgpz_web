package templating

import (
	"fmt"
	"html/template"
	"io/fs"
	"os"
	"strings"
	"sync"

	"github.com/yalue/merged_fs"
)

// INFO: this ist thread-safe and safe to call in a handler or middleware
type TemplateRegistry struct {
	routesFS fs.FS
	once     sync.Once
	// INFO: Template & cache keys are directory routing paths, with '/' as root
	// INFO: we don't need a mutex here since this is set in Parse() and never changed.
	// Parse() is called only once in a thread-safe manner
	templates map[string]TemplateContext
	cache     sync.Map
	funcs     template.FuncMap
}

func NewTemplateRegistry(routes fs.FS) *TemplateRegistry {
	return &TemplateRegistry{
		routesFS: routes,
		funcs: template.FuncMap{
			"safe": func(s string) template.HTML {
				return template.HTML(s)
			},
		},
	}
}

// INFO: This returns a new TemplateRegistry with the new fs added to the existing fs,
// merging with the existing FS, possibly overwriting existing files.
func (r *TemplateRegistry) Register(path string, fs fs.FS) *TemplateRegistry {
	return NewTemplateRegistry(merged_fs.MergeMultiple(fs, r.routesFS))
}

func (r *TemplateRegistry) RegisterFuncs(funcs template.FuncMap) {
	for k, v := range funcs {
		r.funcs[k] = v
	}
}

// TODO: Throw errors
// TODO: what if there is no template in the directory above?
// What if a certain path is or should uncallable since it has no index or body?
func (r *TemplateRegistry) Parse() error {
	// INFO: Parse setrs r.templates, which is why you need to make sure to call Parse() once
	templates := make(map[string]TemplateContext)
	fs.WalkDir(r.routesFS, ".", func(path string, d fs.DirEntry, err error) error {
		if !d.IsDir() {
			return nil
		}

		url := FSPathToPath(path)
		tc := NewTemplateContext(url)

		if path != "." {
			pathelem := strings.Split(path, string(os.PathSeparator))
			pathabove := strings.Join(pathelem[:len(pathelem)-1], string(os.PathSeparator))
			pathabove = FSPathToPath(pathabove)

			global, ok := templates[pathabove]
			if ok {
				tc.SetGlobals(global.Globals())
			}
		}

		tc.Parse(r.routesFS)

		templates[url] = tc

		return nil
	})

	r.templates = templates
	return nil
}

// This function takes a template (typically a layout) and adds all the templates of
// a given directory path to it. This is useful for adding a layout to a template.
func (r *TemplateRegistry) Add(path string, t *template.Template) error {
	temp, ok := r.cache.Load(path)
	if !ok {
		// INFO: What todo on errors?
		r.once.Do(func() {
			err := r.Parse()
			if err != nil {
				fmt.Println(err)
				panic(-1)
			}
		})
		tc, ok := r.templates[path]
		if !ok {
			return NewError(NoTemplateError, path)
		}

		template, err := tc.Template(r.routesFS)
		if err != nil {
			return err
		}

		r.cache.Store(path, template)

		return r.Add(path, t)
	}

	casted := temp.(*template.Template)
	for _, st := range casted.Templates() {
		_, err := t.AddParseTree(st.Name(), st.Tree)
		if err != nil {
			return err
		}
	}

	return nil
}

// TODO: get for a specific component
func (r *TemplateRegistry) Get(path string) error {
	return nil
}
