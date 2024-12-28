package templating

import (
	"html/template"
	"io"
	"io/fs"
	"strings"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/app"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/gofiber/fiber/v2"
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
	}

	return &e
}

func (e *Engine) Funcs(app *app.KGPZ) error {
	e.mu.Lock()
	e.FuncMap = make(map[string]interface{})
	e.mu.Unlock()

	// Dates
	e.AddFunc("MonthName", functions.MonthName)
	e.AddFunc("WeekdayName", functions.WeekdayName)
	e.AddFunc("HRDateShort", functions.HRDateShort)

	// Strings
	e.AddFunc("FirstLetter", functions.FirstLetter)
	e.AddFunc("Upper", strings.ToUpper)
	e.AddFunc("Lower", strings.ToLower)
	e.AddFunc("Safe", functions.Safe)

	// App specific
	e.AddFunc("GetAgent", app.Library.Agents.Item)
	e.AddFunc("GetPlace", app.Library.Places.Item)
	e.AddFunc("GetWork", app.Library.Works.Item)
	e.AddFunc("GetCategory", app.Library.Categories.Item)
	e.AddFunc("GetIssue", app.Library.Issues.Item)
	e.AddFunc("GetPiece", app.Library.Pieces.Item)
	e.AddFunc("GetGND", app.GND.Person)

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
