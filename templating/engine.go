package templating

import (
	"html/template"
	"io"
	"io/fs"
	"strings"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/views"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/etag"
)

const (
	ASSETS_URL_PREFIX = "/assets"
)

type Engine struct {
	// NOTE: LayoutRegistry and TemplateRegistry have their own syncronization & cache and do not require a mutex here
	LayoutRegistry   *LayoutRegistry
	TemplateRegistry *TemplateRegistry

	mu         *sync.Mutex
	FuncMap    template.FuncMap
	GlobalData fiber.Map
}

// INFO: We pass the app here to be able to access the config and other data for functions
// which also means we must reload the engine if the app changes
func NewEngine(layouts, templates *fs.FS) *Engine {
	e := Engine{
		mu:               &sync.Mutex{},
		LayoutRegistry:   NewLayoutRegistry(*layouts),
		TemplateRegistry: NewTemplateRegistry(*templates),
		FuncMap:          make(template.FuncMap),
	}
	e.funcs()
	return &e
}

func (e *Engine) funcs() error {
	e.mu.Lock()
	e.mu.Unlock()

	// Dates
	e.AddFunc("MonthName", functions.MonthName)
	e.AddFunc("WeekdayName", functions.WeekdayName)
	e.AddFunc("HRDateShort", functions.HRDateShort)
	e.AddFunc("HRDateYear", functions.HRDateYear)

	// Math
	e.AddFunc("sub", func(a, b int) int { return a - b })
	e.AddFunc("add", func(a, b int) int { return a + b })
	e.AddFunc("mod", func(a, b int) int { return a % b })

	// Strings
	e.AddFunc("FirstLetter", functions.FirstLetter)
	e.AddFunc("Upper", strings.ToUpper)
	e.AddFunc("Lower", strings.ToLower)
	e.AddFunc("Safe", functions.Safe)

	// Embedding of file contents
	embedder := functions.NewEmbedder(views.StaticFS)
	e.AddFunc("EmbedSafe", embedder.EmbedSafe())
	e.AddFunc("Embed", embedder.Embed())
	e.AddFunc("EmbedXSLT", embedder.EmbedXSLT())

	return nil
}

func (e Engine) Pre(srv *fiber.App) error {
	srv.Use(ASSETS_URL_PREFIX, etag.New())
	srv.Use(ASSETS_URL_PREFIX, helpers.StaticHandler(&views.StaticFS))
	return nil
}

func (e *Engine) Globals(data fiber.Map) {
	e.mu.Lock()
	defer e.mu.Unlock()
	if e.GlobalData == nil {
		e.GlobalData = data
	} else {
		for k, v := range data {
			(e.GlobalData)[k] = v
		}
	}
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

func (e *Engine) Reload() error {
	wg := sync.WaitGroup{}
	wg.Add(2)

	go func() {
		defer wg.Done()
		e.LayoutRegistry.Reset()
	}()

	go func() {
		defer wg.Done()
		e.TemplateRegistry.Reset()
	}()

	wg.Wait()
	return nil
}

// INFO: fn is a function that returns either one value or two values, the second one being an error
func (e *Engine) AddFunc(name string, fn interface{}) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.FuncMap[name] = fn
}

func (e *Engine) AddFuncs(funcs map[string]interface{}) {
	e.mu.Lock()
	defer e.mu.Unlock()
	for k, v := range funcs {
		e.FuncMap[k] = v
	}
}

func (e *Engine) Render(out io.Writer, path string, data interface{}, layout ...string) error {
	// TODO: check if a reload is needed if files on disk have changed
	ld := data.(fiber.Map)
	gd := e.GlobalData
	if e.GlobalData != nil {
		for k, v := range ld {
			gd[k] = v
		}
	}

	e.mu.Lock()
	defer e.mu.Unlock()
	var l *template.Template
	if layout == nil || len(layout) == 0 {
		lay, err := e.LayoutRegistry.Default(&e.FuncMap)
		if err != nil {
			return err
		}
		l = lay
	} else {
		lay, err := e.LayoutRegistry.Layout(layout[0], &e.FuncMap)
		if err != nil {
			return err
		}
		l = lay
	}

	lay, err := l.Clone()
	if err != nil {
		return err
	}

	err = e.TemplateRegistry.Add(path, lay, &e.FuncMap)
	if err != nil {
		return err
	}

	err = lay.Execute(out, gd)
	if err != nil {
		return err
	}

	return nil
}
