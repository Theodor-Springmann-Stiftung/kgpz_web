package app

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/helpers/logging"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers"
	"github.com/Theodor-Springmann-Stiftung/kgpz_web/providers/xmlprovider"
)

const (
	AGENTS_PATH     = "XML/akteure.xml"
	PLACES_PATH     = "XML/orte.xml"
	WORKS_PATH      = "XML/werke.xml"
	CATEGORIES_PATH = "XML/kategorien.xml"

	ISSUES_DIR = "XML/stuecke/"
	PIECES_DIR = "XML/beitraege/"
)

type KGPZ struct {
	lmu     sync.Mutex
	gmu     sync.Mutex
	Config  *providers.ConfigProvider
	Repo    *providers.GitProvider
	Library *xmlprovider.Library
}

func (k *KGPZ) Init() {
	if k.Config.Debug {
		// NOTE: validity checks for poor people, speeding up dev mode:
		if _, err := os.Stat(k.Config.FolderPath); err != nil {
			k.initRepo()
		} else {
			go k.initRepo()
		}
		k.Serialize()
		return
	}

	k.initRepo()
	k.Serialize()
}

func NewKGPZ(config *providers.ConfigProvider) *KGPZ {
	helpers.AssertNonNil(config, "Config is nil")
	if err := config.Validate(); err != nil {
		helpers.Assert(err, "Error validating config")
	}

	return &KGPZ{Config: config}
}

func (k *KGPZ) Serialize() {
	// TODO: this is error handling from hell
	// There is no need to recreate the whole library if the paths haven't changed
	// We do it to keep the old data if the new data is missing

	// Preventing pulling and serializing at the same time
	k.gmu.Lock()
	defer k.gmu.Unlock()

	issues, err := getXMLFiles(filepath.Join(k.Config.FolderPath, ISSUES_DIR))
	helpers.Assert(err, "Error getting issues")

	pieces, err := getXMLFiles(filepath.Join(k.Config.FolderPath, PIECES_DIR))
	helpers.Assert(err, "Error getting pieces")

	lib := xmlprovider.NewLibrary(
		[]string{filepath.Join(k.Config.FolderPath, AGENTS_PATH)},
		[]string{filepath.Join(k.Config.FolderPath, PLACES_PATH)},
		[]string{filepath.Join(k.Config.FolderPath, WORKS_PATH)},
		[]string{filepath.Join(k.Config.FolderPath, CATEGORIES_PATH)},
		*issues,
		*pieces)

	lib.Serialize()

	// TODO: is it neccessary to lock here, sice gmu lock prevents concurrent locking of the library?
	k.lmu.Lock()
	defer k.lmu.Unlock()

	if k.Library == nil {
		k.Library = lib
		return
	}

	if lib.Agents == nil {
		lib.Agents = k.Library.Agents
	}

	if lib.Places == nil {
		lib.Places = k.Library.Places
	}

	if lib.Works == nil {
		lib.Works = k.Library.Works
	}

	if lib.Categories == nil {
		lib.Categories = k.Library.Categories
	}

	if lib.Issues == nil {
		lib.Issues = k.Library.Issues
	}

	if lib.Pieces == nil {
		lib.Pieces = k.Library.Pieces
	}

	k.Library = lib
}

func (k *KGPZ) IsDebug() bool {
	return k.Config.Debug
}

func (k *KGPZ) Pull() {
	go func() {
		logging.Info("Pulling Repository...")
		k.gmu.Lock()

		if k.Repo == nil {
			k.gmu.Unlock()
			return
		}

		err, changed := k.Repo.Pull()
		logging.Error(err, "Error pulling GitProvider")

		// Need to unlock here to prevent deadlock, since Serialize locks the same mutex
		k.gmu.Unlock()

		if changed {
			logging.ObjDebug(&k.Repo, "Remote changed. Reparsing")
			k.Serialize()
		}
	}()
}

func (k *KGPZ) initRepo() {
	gp, err := providers.NewGitProvider(k.Config.Config.GitURL, k.Config.Config.FolderPath, k.Config.Config.GitBranch)
	if err != nil {
		logging.ObjErr(&gp, err, "Error creating GitProvider")
		return
	}

	k.gmu.Lock()
	k.Repo = gp
	k.gmu.Unlock()
	k.Pull()

	logging.ObjDebug(&k.Repo, "GitProvider initialized")
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
