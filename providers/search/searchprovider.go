package searchprovider

import (
	"errors"
	"os"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/xmlmodels"
	"github.com/blevesearch/bleve/v2"
	"github.com/blevesearch/bleve/v2/analysis/analyzer/custom"
	"github.com/blevesearch/bleve/v2/analysis/char/html"
	"github.com/blevesearch/bleve/v2/analysis/char/regexp"
	"github.com/blevesearch/bleve/v2/analysis/token/lowercase"
	"github.com/blevesearch/bleve/v2/analysis/token/ngram"
	"github.com/blevesearch/bleve/v2/analysis/token/unicodenorm"
	"github.com/blevesearch/bleve/v2/analysis/tokenizer/unicode"
	"github.com/blevesearch/bleve/v2/mapping"
)

var NoKeyError = errors.New("Missing ID key.")
var NoLibError = errors.New("Missing library.")

type ISearchable interface {
	Keys() []string
	Readable(lib *xmlmodels.Library) map[string]interface{}
	Type() string
}

type SearchProvider struct {
	indeces  sync.Map
	basepath string
}

func NewSearchProvider(basepath string) (*SearchProvider, error) {
	sp := &SearchProvider{basepath: basepath}
	return sp, nil
}

func (sp *SearchProvider) Index(item ISearchable, lib *xmlmodels.Library) error {
	keys := item.Keys()
	if len(keys) == 0 {
		return NoKeyError
	}
	if lib == nil {
		return NoLibError
	}

	i, err := sp.FindCreateIndex(item.Type())
	if err != nil {
		return err
	}

	read := item.Readable(lib)
	return i.Index(keys[0], read)
}

// TODO: this is sloppy
func (sp *SearchProvider) LoadIndeces() error {
	files, err := filepath.Glob(filepath.Join(sp.basepath, "*.bleve"))
	if err != nil {
		return err
	}

	if len(files) == 0 {
		return errors.New("No indeces found.")
	}

	for _, file := range files {
		index, err := bleve.Open(file)
		if err != nil {
			return err
		}
		typ := filepath.Base(file)
		typ = typ[:len(typ)-6]
		sp.indeces.Store(typ, index)
	}
	return nil
}

func (sp *SearchProvider) FindCreateIndex(typ string) (bleve.Index, error) {
	index, ok := sp.indeces.Load(typ)
	if ok {
		i := index.(bleve.Index)
		return i, nil
	}

	fp := filepath.Join(sp.basepath, typ+".bleve")
	ind, err := bleve.Open(fp)
	if err == bleve.ErrorIndexPathDoesNotExist {
		mapping, err := default_mapping()
		if err != nil {
			return nil, err
		}
		ind, err = bleve.New(filepath.Join(fp), mapping)
		if err != nil {
			return nil, err
		}
	}
	sp.indeces.Store(typ, ind)

	return ind, nil
}

func (sp *SearchProvider) GetIndex(typ string) (bleve.Index, error) {
	index, ok := sp.indeces.Load(typ)
	if !ok {
		return nil, errors.New("Index not found.")
	}

	i := index.(bleve.Index)
	return i, nil
}

func default_mapping() (*mapping.IndexMappingImpl, error) {
	indexMapping := bleve.NewIndexMapping()

	customunicodeFilter := map[string]interface{}{
		"type": unicodenorm.Name,
		"form": unicodenorm.NFKD,
	}

	customCharFilterConfig := map[string]interface{}{
		"type":    regexp.Name,
		"regexp":  `[[:punct:]]+`, // Removes all punctuation characters
		"replace": "",
	}

	customNgramFilterConfig := map[string]interface{}{
		"type": ngram.Name,
		"min":  1,  // minimum n-gram size
		"max":  20, // maximum n-gram size
	}

	customNgramAnalyzer := map[string]interface{}{
		"type":          custom.Name,
		"tokenizer":     unicode.Name,
		"char_filters":  []string{"removePunctuation", html.Name},
		"token_filters": []string{lowercase.Name, "customNgramFilter", "customUnicodeCharFilter"},
	}

	err := indexMapping.AddCustomTokenFilter("customNgramFilter", customNgramFilterConfig)
	if err != nil {
		return nil, err
	}

	err = indexMapping.AddCustomCharFilter("removePunctuation", customCharFilterConfig)
	if err != nil {
		return nil, err
	}

	err = indexMapping.AddCustomTokenFilter("customUnicodeCharFilter", customunicodeFilter)
	if err != nil {
		return nil, err
	}

	err = indexMapping.AddCustomAnalyzer("customNgramAnalyzer", customNgramAnalyzer)
	if err != nil {
		return nil, err
	}

	indexMapping.DefaultAnalyzer = "customNgramAnalyzer"
	return indexMapping, nil
}

// ClearAllIndices closes and removes all search indices
func (sp *SearchProvider) ClearAllIndices() error {
	// Close all open indices
	sp.indeces.Range(func(key, value interface{}) bool {
		if index, ok := value.(bleve.Index); ok {
			index.Close()
		}
		return true
	})

	// Clear the sync.Map
	sp.indeces = sync.Map{}

	// Remove all .bleve directories from disk
	files, err := filepath.Glob(filepath.Join(sp.basepath, "*.bleve"))
	if err != nil {
		return err
	}

	for _, file := range files {
		os.RemoveAll(file)
	}

	return nil
}
