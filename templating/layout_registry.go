package templating

import (
	"fmt"
	"html/template"
	"io/fs"
	"sync"

	"github.com/yalue/merged_fs"
)

// TODO: Implement Handler interface, maybe in template? But then template would need to know about the layout registry
// Function signature: func (t *templateHandler) ServeHTTP(w http.ResponseWriter, r *http.Request)
// A static Handler could incoporate both the layout registry and the template registry and serve templates that dont need any data
// INFO: this ist thread-safe and safe to call in a handler or middleware
type LayoutRegistry struct {
	layoutsFS fs.FS
	once      sync.Once
	// INFO: Layout & cache keys are template directory names
	layouts map[string]TemplateContext
	// WARNING: maybe this is too early for caching?
	cache sync.Map
	funcs template.FuncMap
}

func NewLayoutRegistry(routes fs.FS) *LayoutRegistry {
	return &LayoutRegistry{
		layoutsFS: routes,
		funcs: template.FuncMap{
			"safe": func(s string) template.HTML {
				return template.HTML(s)
			},
		},
	}
}

// NOTE: Upon registering a new layout dir, we return a new LayoutRegistry
func (r *LayoutRegistry) Register(fs fs.FS) *LayoutRegistry {
	return NewLayoutRegistry(merged_fs.MergeMultiple(fs, r.layoutsFS))
}

// TODO: Funcs are not used in executing the templates yet
func (r *LayoutRegistry) RegisterFuncs(funcs template.FuncMap) {
	for k, v := range funcs {
		r.funcs[k] = v
	}
}

func (r *LayoutRegistry) Parse() error {
	layouts := make(map[string]TemplateContext)
	rootcontext := NewTemplateContext(".")
	err := rootcontext.Parse(r.layoutsFS)
	if err != nil {
		return err
	}

	globals := rootcontext.Globals()

	entries, err := fs.ReadDir(r.layoutsFS, ".")
	if err != nil {
		return NewError(FileAccessError, ".")
	}

	for _, e := range entries {
		if !e.IsDir() || e.Name() == TEMPLATE_COMPONENT_DIRECTORY {
			continue
		}

		url := FSPathToPath(e.Name())
		context := NewTemplateContext(url)
		context.SetGlobals(globals)
		context.Parse(r.layoutsFS)

		layouts[e.Name()] = context
	}

	r.layouts = layouts
	return nil
}

func (r *LayoutRegistry) Layout(name string) (*template.Template, error) {
	cached, ok := r.cache.Load(name)
	if ok {
		return cached.(*template.Template), nil
	}

	// TODO: What todo on errors?
	r.once.Do(func() {
		err := r.Parse()
		if err != nil {
			fmt.Println(err)
			panic(-1)
		}
	})

	context, ok := r.layouts[name]
	if !ok {
		return nil, NewError(NoTemplateError, name)
	}

	t, err := context.Template(r.layoutsFS)
	if err != nil {
		return nil, err
	}

	r.cache.Store(name, t)

	return t, nil
}

func (r *LayoutRegistry) Default() (*template.Template, error) {
	return r.Layout(DEFAULT_LAYOUT_NAME)
}
