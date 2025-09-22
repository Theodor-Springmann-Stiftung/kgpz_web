package templating

import (
	"fmt"
	"html/template"
	"io"
	"io/fs"
	"reflect"
	"strings"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/functions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/templatefunctions"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/views"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/etag"
)

const (
	ASSETS_URL_PREFIX = "/assets"
	CLEAR_LAYOUT      = `
<html>
<head>
	{{ block "head" . }}{{ end }}
</head>
   {{ block "body" . }}{{ end }}
</html>`
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

// PageIcon renders the appropriate icon HTML for a page based on its icon type
func PageIcon(iconType string) template.HTML {
	switch iconType {
	case "first":
		return template.HTML(`<i class="ri-file-text-line text-black text-sm" style="display: inline-block;"></i>`)
	case "last":
		return template.HTML(`<i class="ri-file-text-line text-black text-sm" style="display: inline-block; transform: scaleX(-1);"></i>`)
	case "even":
		return template.HTML(`<i class="ri-file-text-line text-black text-sm" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-slate-400 text-sm"></i>`)
	case "odd":
		return template.HTML(`<i class="ri-file-text-line text-slate-400 text-sm" style="margin-left: 1px; transform: scaleX(-1); display: inline-block;"></i><i class="ri-file-text-line text-black text-sm" ></i>`)
	case "single":
		return template.HTML(`<i class="ri-file-text-line text-black text-sm"></i>`)
	default:
		return template.HTML(`<i class="ri-file-text-line text-black text-sm"></i>`)
	}
}

// GetPieceURL generates a piece view URL from piece ID
func GetPieceURL(pieceID string) string {
	return "/beitrag/" + pieceID
}

// IssueContext formats an issue reference into a readable context string
func IssueContext(issueRef interface{}) string {
	// Handle both direct IssueRef and map formats
	switch ref := issueRef.(type) {
	case map[string]interface{}:
		if year, ok := ref["year"].(int); ok {
			if nr, ok := ref["nr"].(int); ok {
				return fmt.Sprintf("%d Nr. %d", year, nr)
			}
		}
		return "Unbekannte Ausgabe"
	default:
		return "Unbekannte Ausgabe"
	}
}

// shouldSwap determines if two pieces should be swapped for chronological ordering
func shouldSwap(item1, item2 interface{}) bool {
	// Use reflection to access IssueRefs field
	v1 := reflect.ValueOf(item1)
	v2 := reflect.ValueOf(item2)

	if v1.Kind() == reflect.Ptr {
		v1 = v1.Elem()
	}
	if v2.Kind() == reflect.Ptr {
		v2 = v2.Elem()
	}

	if v1.Kind() != reflect.Struct || v2.Kind() != reflect.Struct {
		return false
	}

	refs1 := v1.FieldByName("IssueRefs")
	refs2 := v2.FieldByName("IssueRefs")

	if !refs1.IsValid() || !refs2.IsValid() || refs1.Len() == 0 || refs2.Len() == 0 {
		return false
	}

	// Get first IssueRef for each piece
	ref1 := refs1.Index(0)
	ref2 := refs2.Index(0)

	// Get year
	when1 := ref1.FieldByName("When")
	when2 := ref2.FieldByName("When")
	if !when1.IsValid() || !when2.IsValid() {
		return false
	}

	year1 := when1.FieldByName("Year")
	year2 := when2.FieldByName("Year")
	if !year1.IsValid() || !year2.IsValid() {
		return false
	}

	y1 := int(year1.Int())
	y2 := int(year2.Int())

	if y1 != y2 {
		return y1 > y2 // Sort by year ascending
	}

	// If same year, sort by issue number
	nr1 := ref1.FieldByName("Nr")
	nr2 := ref2.FieldByName("Nr")
	if !nr1.IsValid() || !nr2.IsValid() {
		return false
	}

	n1 := int(nr1.Int())
	n2 := int(nr2.Int())

	if n1 != n2 {
		return n1 > n2 // Sort by issue number ascending
	}

	// If same issue, sort by order
	order1 := ref1.FieldByName("Order")
	order2 := ref2.FieldByName("Order")
	if !order1.IsValid() || !order2.IsValid() {
		return false
	}

	o1 := int(order1.Int())
	o2 := int(order2.Int())

	return o1 > o2 // Sort by order ascending
}

// extractItem extracts the Item field from a Resolved struct
func extractItem(piece interface{}) interface{} {
	v := reflect.ValueOf(piece)
	if v.Kind() == reflect.Ptr {
		v = v.Elem()
	}
	if v.Kind() != reflect.Struct {
		return nil
	}

	itemField := v.FieldByName("Item")
	if !itemField.IsValid() {
		return nil
	}

	return itemField.Interface()
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
	e.AddFunc("seq", func(start, end int) []int {
		if start > end {
			return []int{}
		}
		result := make([]int, end-start+1)
		for i := range result {
			result[i] = start + i
		}
		return result
	})

	// Template helpers
	e.AddFunc("dict", func(values ...interface{}) (map[string]interface{}, error) {
		if len(values)%2 != 0 {
			return nil, fmt.Errorf("dict requires an even number of arguments")
		}
		dict := make(map[string]interface{})
		for i := 0; i < len(values); i += 2 {
			key, ok := values[i].(string)
			if !ok {
				return nil, fmt.Errorf("dict keys must be strings")
			}
			dict[key] = values[i+1]
		}
		return dict, nil
	})

	e.AddFunc("merge", func(dest map[string]interface{}, src map[string]interface{}) map[string]interface{} {
		result := make(map[string]interface{})
		// Copy from dest first
		for k, v := range dest {
			result[k] = v
		}
		// Override with src values
		for k, v := range src {
			result[k] = v
		}
		return result
	})

	e.AddFunc("append", func(slice interface{}, item interface{}) interface{} {
		v := reflect.ValueOf(slice)
		if v.Kind() != reflect.Slice {
			return slice
		}
		newSlice := reflect.Append(v, reflect.ValueOf(item))
		return newSlice.Interface()
	})

	e.AddFunc("slice", func(items ...interface{}) []interface{} {
		return items
	})

	e.AddFunc("keys", func(m map[string]interface{}) []string {
		keys := make([]string, 0, len(m))
		for k := range m {
			keys = append(keys, k)
		}
		return keys
	})

	e.AddFunc("has", func(slice interface{}, item interface{}) bool {
		v := reflect.ValueOf(slice)
		if v.Kind() != reflect.Slice {
			return false
		}
		for i := 0; i < v.Len(); i++ {
			if reflect.DeepEqual(v.Index(i).Interface(), item) {
				return true
			}
		}
		return false
	})

	e.AddFunc("joinWithUnd", func(items []string) string {
		if len(items) == 0 {
			return ""
		}
		if len(items) == 1 {
			return items[0]
		}
		if len(items) == 2 {
			return items[0] + " und " + items[1]
		}
		// For 3+ items: "A, B und C"
		result := ""
		for i, item := range items {
			if i == 0 {
				result = item
			} else if i == len(items)-1 {
				result += " und " + item
			} else {
				result += ", " + item
			}
		}
		return result
	})

	e.AddFunc("split", func(s, delimiter string) []string {
		if s == "" {
			return []string{}
		}
		return strings.Split(s, delimiter)
	})

	e.AddFunc("sortStrings", func(items interface{}) []string {
		v := reflect.ValueOf(items)
		if v.Kind() != reflect.Slice {
			return []string{}
		}

		// Convert to string slice
		result := make([]string, v.Len())
		for i := 0; i < v.Len(); i++ {
			if str, ok := v.Index(i).Interface().(string); ok {
				result[i] = str
			}
		}

		// Simple bubble sort
		for i := 0; i < len(result)-1; i++ {
			for j := i + 1; j < len(result); j++ {
				if result[i] > result[j] {
					result[i], result[j] = result[j], result[i]
				}
			}
		}
		return result
	})

	e.AddFunc("unique", func(items interface{}) []string {
		v := reflect.ValueOf(items)
		if v.Kind() != reflect.Slice {
			return []string{}
		}

		seen := make(map[string]bool)
		result := []string{}
		for i := 0; i < v.Len(); i++ {
			if str, ok := v.Index(i).Interface().(string); ok {
				if !seen[str] {
					seen[str] = true
					result = append(result, str)
				}
			}
		}
		return result
	})

	// Strings
	e.AddFunc("FirstLetter", functions.FirstLetter)
	e.AddFunc("Upper", strings.ToUpper)
	e.AddFunc("Lower", strings.ToLower)
	e.AddFunc("Safe", functions.Safe)

	// Sorting
	e.AddFunc("SortPiecesByDate", func(pieces interface{}) interface{} {
		// Use reflection to handle any slice type
		v := reflect.ValueOf(pieces)
		if v.Kind() != reflect.Slice {
			return pieces
		}

		length := v.Len()
		if length == 0 {
			return pieces
		}

		// Create indices for sorting
		indices := make([]int, length)
		for i := range indices {
			indices[i] = i
		}

		// Sort indices based on piece comparison
		for i := 0; i < len(indices)-1; i++ {
			for j := i + 1; j < len(indices); j++ {
				piece1 := v.Index(indices[i]).Interface()
				piece2 := v.Index(indices[j]).Interface()

				// Extract the Item field from each resolved piece
				item1 := extractItem(piece1)
				item2 := extractItem(piece2)

				if item1 != nil && item2 != nil && shouldSwap(item1, item2) {
					indices[i], indices[j] = indices[j], indices[i]
				}
			}
		}

		// Create sorted slice with same type as input
		sortedSlice := reflect.MakeSlice(v.Type(), length, length)
		for i, idx := range indices {
			sortedSlice.Index(i).Set(v.Index(idx))
		}

		return sortedSlice.Interface()
	})

	// Embedding of file contents
	embedder := functions.NewEmbedder(views.StaticFS)
	e.AddFunc("EmbedSafe", embedder.EmbedSafe())
	e.AddFunc("Embed", embedder.Embed())
	e.AddFunc("EmbedXSLT", embedder.EmbedXSLT())

	// Page icons for ausgabe templates
	e.AddFunc("PageIcon", PageIcon)

	// Piece view helpers
	e.AddFunc("GetPieceURL", GetPieceURL)
	e.AddFunc("IssueContext", IssueContext)
	e.AddFunc("GetCategoryFlags", templatefunctions.GetCategoryFlags)

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
	if len(layout) == 0 {
		lay, err := e.LayoutRegistry.Default(&e.FuncMap)
		if err != nil {
			return err
		}
		l = lay
	} else {
		if layout[0] == "clear" {
			lay, err := template.New("clear").Parse(CLEAR_LAYOUT)
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
