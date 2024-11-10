package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"githib.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
)

// 1. Check if folder exists
//		- If not, clone the repo, if possible or throw if error
// 2. If the folder exists, we try to serialize -- and spawn a goroutine to pull.
//		Upon pulling, we read in the current state of the repository, even if it's up to date.
//		-> If the repo was changed we execute a callback and parse again.
//		-> If pulling fails, we retry after a certain amount of time.
//		   Still we can continue if serialization proceeds.
//		-> If serialization fails, we throw an error, log it. We try to pull in the background.
//		- setup commit date & hash
//		- Setup GitHub webhook if set

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

type Library struct {
	smu        sync.Mutex
	Agents     *providers.AgentProvider
	Places     *providers.PlaceProvider
	Works      *providers.WorkProvider
	Categories *providers.CategoryProvider
	Issues     *providers.IssueProvider
	Pieces     *providers.PieceProvider
}

type KGPZ struct {
	Config *providers.ConfigProvider
	Repo   *providers.GitProvider
	Library
}

func NewKGPZ(config *providers.ConfigProvider) *KGPZ {
	if config == nil {
		panic("ConfigProvider is nil")
	}

	if err := config.Validate(); err != nil {
		helpers.MaybePanic(err, "Error validating config")
	}

	return &KGPZ{Config: config}
}

func (k *KGPZ) IsDebug() bool {
	return k.Config.Debug
}

func (k *KGPZ) Pull() {
	go func(k *KGPZ) {
		if k.Repo == nil {
			return
		}

		err, changed := k.Repo.Pull()
		if err != nil {
			helpers.LogOnErr(&k.Repo, err, "Error pulling repo")
		}

		if changed {
			if k.IsDebug() {
				helpers.LogOnDebug(&k.Repo, "GitProvider changed")
			}
			// Locking is handled in Serialize()
			k.Serialize()
		}
	}(k)
}

func (k *KGPZ) InitRepo() {
	gp, err := providers.NewGitProvider(k.Config.Config.GitURL, k.Config.Config.FolderPath, k.Config.Config.GitBranch)
	if err != nil {
		helpers.LogOnErr(&gp, err, "Error creating GitProvider")
		return
	}

	fmt.Println("InitRepo")
	k.Repo = gp
	k.Pull()

	if k.IsDebug() {
		helpers.LogOnDebug(&gp, "GitProvider")
	}
}

// This panics if the data cant be read, and there is no data read
func (k *KGPZ) Serialize() {
	k.smu.Lock()
	defer k.smu.Unlock()
	// TODO: maybe dont panic if a webhook can be setup, we need to check the requirements only when starting the server
	// TODO: do this in parallel goroutines using a waitgroup
	agents := k.InitAgents()
	if agents == nil && k.Agents != nil {
		helpers.LogOnErr(&k.Agents, nil, "Error initializing agents, keeping old state")
	} else if agents == nil {
		helpers.Panic(nil, "Error initializing agents")
	} else {
		k.Agents = agents
	}

	places := k.InitPlaces()
	if places == nil && k.Places != nil {
		helpers.LogOnErr(&k.Places, nil, "Error initializing places, keeping old state")
	} else if places == nil {
		helpers.Panic(nil, "Error initializing places")
	} else {
		k.Places = places
	}

	works := k.InitWorks()
	if works == nil && k.Works != nil {
		helpers.LogOnErr(&k.Works, nil, "Error initializing works, keeping old state")
	} else if works == nil {
		helpers.Panic(nil, "Error initializing works")
	} else {
		k.Works = works
	}

	categories := k.InitCategories()
	if categories == nil && k.Categories != nil {
		helpers.LogOnErr(&k.Categories, nil, "Error initializing categories, keeping old state")
	} else if categories == nil {
		helpers.Panic(nil, "Error initializing categories")
	} else {
		k.Categories = categories
	}

	issues := k.InitIssues()
	if issues == nil && k.Issues != nil {
		helpers.LogOnErr(&k.Issues, nil, "Error initializing issues, keeping old state")
	} else if issues == nil {
		helpers.Panic(nil, "Error initializing issues")
	} else {
		k.Issues = issues
	}

	pieces := k.InitPieces()
	if pieces == nil && k.Pieces != nil {
		helpers.LogOnErr(&k.Pieces, nil, "Error initializing pieces, keeping old state")
	} else if pieces == nil {
		helpers.Panic(nil, "Error initializing pieces")
	} else {
		k.Pieces = pieces
	}
}

func (k *KGPZ) InitAgents() *providers.AgentProvider {
	ap := providers.NewAgentProvider([]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)})
	if err := ap.Load(); err != nil {
		helpers.LogOnErr(&ap, err, "Error loading agents")
		return nil
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&ap, "AgentProvider")
	}

	return ap
}

func (k *KGPZ) InitPlaces() *providers.PlaceProvider {
	pp := providers.NewPlaceProvider([]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)})
	if err := pp.Load(); err != nil {
		helpers.LogOnErr(&pp, err, "Error loading places")
		return nil
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&pp, "PlaceProvider")
	}

	return pp
}

func (k *KGPZ) InitWorks() *providers.WorkProvider {
	wp := providers.NewWorkProvider([]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)})
	if err := wp.Load(); err != nil {
		helpers.LogOnErr(&wp, err, "Error loading works")
		return nil
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&wp, "WorkProvider")
	}

	return wp
}

func (k *KGPZ) InitCategories() *providers.CategoryProvider {
	cp := providers.NewCategoryProvider([]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)})
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading categories")
		return nil
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&cp, "CategoryProvider")
	}

	return cp
}

func (k *KGPZ) InitIssues() *providers.IssueProvider {
	files, err := getXMLFiles(filepath.Join(k.Config.FolderPath, ISSUES_DIR))

	if err != nil {
		helpers.MaybePanic(err, "Error getting issues files")
	}

	cp := providers.NewIssueProvider(*files)
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading issues")
		return nil
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&cp, "IssueProvider")
	}

	return cp
}

func (k *KGPZ) InitPieces() *providers.PieceProvider {
	files, err := getXMLFiles(filepath.Join(k.Config.FolderPath, PIECES_DIR))

	if err != nil {
		helpers.MaybePanic(err, "Error getting pieces files")
		return nil
	}

	cp := providers.NewPieceProvider(*files)
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading pieces")
	}

	if k.IsDebug() {
		helpers.LogOnDebug(&cp, "PieceProvider")
	}

	return cp
}

func getXMLFiles(path string) (*[]string, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, err
	}

	matches, err := filepath.Glob(filepath.Join(path, "*.xml"))

	return &matches, err
}

func main() {
	cfg := providers.NewConfigProvider([]string{"config.dev.json", "config.json"})
	if err := cfg.Read(); err != nil {
		helpers.MaybePanic(err, "Error reading config")
	}

	kgpz := NewKGPZ(cfg)
	kgpz.InitRepo()
	kgpz.Serialize()
}
