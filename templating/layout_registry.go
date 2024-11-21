package templating

import (
	"html/template"
	"io/fs"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
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
}

func NewLayoutRegistry(routes fs.FS) *LayoutRegistry {
	return &LayoutRegistry{
		layoutsFS: routes,
	}
}

// NOTE: Upon registering a new layout dir, we return a new LayoutRegistry
func (r *LayoutRegistry) Register(fs fs.FS) *LayoutRegistry {
	return NewLayoutRegistry(merged_fs.MergeMultiple(fs, r.layoutsFS))
}

func (r *LayoutRegistry) Reset() error {
	r.cache.Clear()
	r.once = sync.Once{}
	return nil
}

func (r *LayoutRegistry) Load() error {
	r.once.Do(func() {
		err := r.load()
		helpers.Assert(err, "Error loading layouts. Exiting.")
	})

	return nil
}

func (r *LayoutRegistry) load() error {
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

func (r *LayoutRegistry) Layout(name string, funcmap *template.FuncMap) (*template.Template, error) {
	cached, ok := r.cache.Load(name)
	if ok {
		return cached.(*template.Template), nil
	}

	// TODO: What todo on errors?
	r.Load()
	context, ok := r.layouts[name]
	if !ok {
		return nil, NewError(NoTemplateError, name)
	}

	t, err := context.Template(r.layoutsFS, funcmap)
	if err != nil {
		return nil, err
	}

	r.cache.Store(name, t)

	return t, nil
}

func (r *LayoutRegistry) Default(funcmap *template.FuncMap) (*template.Template, error) {
	return r.Layout(DEFAULT_LAYOUT_NAME, funcmap)
}
