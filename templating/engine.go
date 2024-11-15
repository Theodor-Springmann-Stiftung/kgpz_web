package templating

import (
	"html/template"
	"io"
	"io/fs"
	"path/filepath"
	"sync"
	"time"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
)

type Engine struct {
	// NOTE: LayoutRegistry and TemplateRegistry have their own syncronization & cache and do not require a mutex here
	regmu            *sync.Mutex
	LayoutRegistry   *LayoutRegistry
	TemplateRegistry *TemplateRegistry

	mu      *sync.Mutex
	FuncMap template.FuncMap

	paths     []string
	layouts   *fs.FS
	templates *fs.FS
}

func NewEngine(layouts, templates *fs.FS) *Engine {
	return &Engine{
		regmu:            &sync.Mutex{},
		mu:               &sync.Mutex{},
		LayoutRegistry:   NewLayoutRegistry(*layouts),
		TemplateRegistry: NewTemplateRegistry(*templates),
		FuncMap:          template.FuncMap{},
		layouts:          layouts,
		templates:        templates,
	}
}

func (e *Engine) AddWatchers(paths []string) error {
	e.paths = paths
	var dirs []string
	for _, path := range paths {
		// Get all subdirectories for paths
		filepath.WalkDir(path, func(path string, d fs.DirEntry, err error) error {
			if d.IsDir() {
				dirs = append(dirs, path)
			}
			return nil
		})
	}

	watcher, err := helpers.NewFileWatcher(dirs)
	defer watcher.Close()
	if err != nil {
		return err
	}

	go func() {
		w := watcher.GetEvents()
		<-w
		time.Sleep(100 * time.Millisecond)
		e.regmu.Lock()
		defer e.regmu.Unlock()
		e.LayoutRegistry = NewLayoutRegistry(*e.layouts)
		e.TemplateRegistry = NewTemplateRegistry(*e.templates)
		e.AddWatchers(e.paths)
	}()

	return nil
}

func (e *Engine) Load() error {
	wg := sync.WaitGroup{}
	wg.Add(2)

	go func() {
		defer wg.Done()
		e.LayoutRegistry.Load()
	}()

	go func() {
		defer wg.Done()
		e.TemplateRegistry.Load()
	}()

	wg.Wait()
	return nil
}

func (e *Engine) Render(out io.Writer, path string, data interface{}, layout ...string) error {
	// TODO: check if a reload is needed if files on disk have changed

	var l *template.Template
	if layout == nil || len(layout) == 0 {
		lay, err := e.LayoutRegistry.Default()
		if err != nil {
			return err
		}
		l = lay
	} else {
		lay, err := e.LayoutRegistry.Layout(layout[0])
		if err != nil {
			return err
		}
		l = lay
	}

	lay, err := l.Clone()
	if err != nil {
		return err
	}

	err = e.TemplateRegistry.Add(path, lay)
	if err != nil {
		return err
	}

	err = lay.Execute(out, data)
	if err != nil {
		return err
	}

	return nil
}
