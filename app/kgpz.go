package app

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
)

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

type Library struct {
	Agents     *providers.AgentProvider
	Places     *providers.PlaceProvider
	Works      *providers.WorkProvider
	Categories *providers.CategoryProvider
	Issues     *providers.IssueProvider
	Pieces     *providers.PieceProvider
}

type KGPZ struct {
	lmu    sync.Mutex
	gmu    sync.Mutex
	Config *providers.ConfigProvider
	Repo   *providers.GitProvider
	Library
}

func (k *KGPZ) Init() {
	go k.initRepo()
	k.Serialize()
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
	// TODO: what happens if the application quits mid-pull?
	// We need to make sure to exit gracefully
	go func() {
		k.gmu.Lock()
		defer k.gmu.Unlock()
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
	}()
}

func (k *KGPZ) initRepo() {
	gp, err := providers.NewGitProvider(k.Config.Config.GitURL, k.Config.Config.FolderPath, k.Config.Config.GitBranch)
	if err != nil {
		helpers.LogOnErr(&gp, err, "Error creating GitProvider")
		return
	}

	k.gmu.Lock()
	k.Repo = gp
	k.gmu.Unlock()
	k.Pull()

	if k.IsDebug() {
		helpers.LogOnDebug(&gp, "GitProvider")
	}
}

// This panics if the data cant be read, and there is no data read
func (k *KGPZ) Serialize() {
	new := Library{}

	wg := sync.WaitGroup{}
	wg.Add(6)

	go func() {
		defer wg.Done()
		new.Agents = k.InitAgents()
	}()

	go func() {
		defer wg.Done()
		new.Places = k.InitPlaces()
	}()

	go func() {
		defer wg.Done()
		new.Works = k.InitWorks()
	}()

	go func() {
		defer wg.Done()
		new.Categories = k.InitCategories()
	}()

	go func() {
		defer wg.Done()
		new.Issues = k.InitIssues()
	}()

	go func() {
		defer wg.Done()
		new.Pieces = k.InitPieces()
	}()

	wg.Wait()

	k.lmu.Lock()
	defer k.lmu.Unlock()
	k.Library = new
}

// TODO: on error, we need to log the error, and use stale data to recover gracefully
// If Repo != nil we can try the last commit; if k != nil we can try the last data
func (k *KGPZ) InitAgents() *providers.AgentProvider {
	ap := providers.NewAgentProvider([]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)})
	if err := ap.Load(); err != nil {
		helpers.LogOnErr(&ap, err, "Error loading agents")
		k.lmu.Lock()
		ap.Items = k.Agents.Items
		k.lmu.Unlock()
		// TODO: mark as stale
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&ap, "AgentProvider")
	}

	return ap
}

func (k *KGPZ) InitPlaces() *providers.PlaceProvider {
	pp := providers.NewPlaceProvider([]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)})
	if err := pp.Load(); err != nil {
		helpers.LogOnErr(&pp, err, "Error loading places")
		k.lmu.Lock()
		pp.Items = k.Places.Items
		k.lmu.Unlock()
		// TODO: mark as stale
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&pp, "PlaceProvider")
	}

	return pp
}

func (k *KGPZ) InitWorks() *providers.WorkProvider {
	wp := providers.NewWorkProvider([]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)})
	if err := wp.Load(); err != nil {
		helpers.LogOnErr(&wp, err, "Error loading works")
		k.lmu.Lock()
		wp.Items = k.Works.Items
		k.lmu.Unlock()
		// TODO: mark as stale
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&wp, "WorkProvider")
	}

	return wp
}

func (k *KGPZ) InitCategories() *providers.CategoryProvider {
	cp := providers.NewCategoryProvider([]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)})
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading categories")
		k.lmu.Lock()
		cp.Items = k.Categories.Items
		k.lmu.Unlock()
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&cp, "CategoryProvider")
	}

	return cp
}

func (k *KGPZ) InitIssues() *providers.IssueProvider {
	files, err := getXMLFiles(filepath.Join(k.Config.FolderPath, ISSUES_DIR))

	helpers.MaybePanic(err, "Error getting issues files")

	cp := providers.NewIssueProvider(*files)
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading issues")
		k.lmu.Lock()
		cp.Items = k.Issues.Items
		k.lmu.Unlock()
		// TODO: mark as stale
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&cp, "IssueProvider")
	}

	return cp
}

func (k *KGPZ) InitPieces() *providers.PieceProvider {
	files, err := getXMLFiles(filepath.Join(k.Config.FolderPath, PIECES_DIR))

	helpers.MaybePanic(err, "Error getting pieces files")

	cp := providers.NewPieceProvider(*files)
	if err := cp.Load(); err != nil {
		helpers.LogOnErr(&cp, err, "Error loading pieces")
		k.lmu.Lock()
		cp.Items = k.Pieces.Items
		k.lmu.Unlock()
		// TODO: mark as stale
	}

	if k.Config.LogData {
		helpers.LogOnDebug(&cp, "PieceProvider")
	}

	return cp
}

func (k *KGPZ) Shutdown() {
	k.Repo.Wait()
}

func getXMLFiles(path string) (*[]string, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, err
	}

	matches, err := filepath.Glob(filepath.Join(path, "*.xml"))

	return &matches, err
}
